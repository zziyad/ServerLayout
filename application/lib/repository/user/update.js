// =============================================================================
// USER REPOSITORY - Update
// =============================================================================

async (payload, maybeOptions) => {
  const skipQueryCacheClear =
    maybeOptions &&
    typeof maybeOptions === 'object' &&
    Object.prototype.hasOwnProperty.call(maybeOptions, 'skipQueryCacheClear') &&
    maybeOptions.skipQueryCacheClear === true;

  const {
    id,
    username,
    password,
    first_name,
    last_name,
    display_name,
    email,
    phone,
    department, // Can be code or ID (backward compatibility)
    department_id, // Direct ID (new format)
    department_role, // Can be code or ID (backward compatibility)
    department_role_id, // Direct ID (new format)
    position,
    employee_id,
    corporate_card_id,
    hire_date,
    profile_picture,
    avatar_url,
    tenant_id,
  } = payload;

  // Check if user exists
  const existingUser = await db.pg.row(
    'User',
    ['id', 'email', 'username', 'password_hash'],
    { id },
  );
  if (!existingUser) {
    throw new Error('User not found');
  }

  // Build update object (only non-undefined fields)
  const updates = {};

  // Add first_name if provided
  if (first_name !== undefined) {
    updates.first_name = first_name;
  }

  // Add last_name if provided
  if (last_name !== undefined) {
    updates.last_name = last_name;
  }

  // Update display_name
  if (display_name !== undefined) {
    updates.display_name = display_name || null;
  } else if (first_name || last_name) {
    // Auto-generate display_name if names changed
    const fName = updates.first_name || existingUser.first_name;
    const lName = updates.last_name || existingUser.last_name;
    updates.display_name = `${fName} ${lName}`;
  }

  // Add email if provided and different
  if (email !== undefined && email !== existingUser.email) {
    // Check if email already exists
    const existingEmail = await db.pg.row('User', ['id'], { email });
    if (existingEmail && existingEmail.id !== id) {
      throw new Error('Email already exists');
    }
    updates.email = email;
  }

  // Add username if provided and not empty
  if (username !== undefined && username !== '') {
    // Check if username already exists
    const existingUsername = await db.pg.row('User', ['id'], { username });
    if (existingUsername && existingUsername.id !== id) {
      throw new Error('Username already taken');
    }
    updates.username = username;
  }

  // Add password if provided
  if (password !== undefined && password !== '') {
    const password_hash = await metarhia.metautil.hashPassword(password);
    updates.password_hash = password_hash;
  }

  // Add phone if provided
  if (phone !== undefined) {
    updates.phone = phone === '' ? null : phone;
  }

  // User has only department_role_assignment_id (no department_id). Setting it sets both department and role.
  const departmentRoleInput =
    department_role_id !== undefined ? department_role_id : department_role;
  if (departmentRoleInput !== undefined) {
    if (departmentRoleInput === '' || departmentRoleInput === null) {
      updates.department_role_assignment_id = null;
    } else {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(departmentRoleInput)) {
        const roleAssignment = await db.pg.row(
          'DepartmentRoleAssignment',
          ['id'],
          { id: departmentRoleInput, is_deleted: false },
        );
        if (!roleAssignment) {
          throw new Error('Department role assignment not found');
        }
        updates.department_role_assignment_id = roleAssignment.id;
      } else {
        // Role code: need department to resolve. Use current user's assignment to get department.
        const currentUser = await db.pg.row(
          'User',
          ['department_role_assignment_id'],
          { id },
        );
        let userDepartmentId = null;
        if (currentUser?.department_role_assignment_id) {
          const ass = await db.pg.row(
            'DepartmentRoleAssignment',
            ['department_id'],
            {
              id: currentUser.department_role_assignment_id,
              is_deleted: false,
            },
          );
          if (ass) userDepartmentId = ass.department_id;
        }
        if (
          !userDepartmentId &&
          department_id !== undefined &&
          department_id !== '' &&
          department_id !== null
        ) {
          const uuidTest =
            typeof department_id === 'string' && uuidRegex.test(department_id);
          if (uuidTest) {
            const dept = await db.pg.row('Department', ['id'], {
              id: department_id,
              is_deleted: false,
            });
            if (dept) userDepartmentId = dept.id;
          } else {
            const dept = await db.pg.row('Department', ['id'], {
              code: department_id,
              is_deleted: false,
            });
            if (dept) userDepartmentId = dept.id;
          }
        }
        if (!userDepartmentId) {
          throw new Error(
            'Department must be set first when using department role code',
          );
        }
        const roleAssignment = await db.pg.row(
          'DepartmentRoleAssignment',
          ['id'],
          {
            department_id: userDepartmentId,
            code: departmentRoleInput,
            is_deleted: false,
          },
        );
        if (!roleAssignment) {
          throw new Error(
            `Department role with code '${departmentRoleInput}' not found for this department`,
          );
        }
        updates.department_role_assignment_id = roleAssignment.id;
      }
    }
  }

  // Add position if provided
  if (position !== undefined) {
    updates.position = position === '' ? null : position;
  }

  // Add employee_id if provided
  if (employee_id !== undefined) {
    updates.employee_id = employee_id === '' ? null : employee_id;
  }

  if (corporate_card_id !== undefined) {
    const v =
      corporate_card_id === '' || corporate_card_id === null
        ? null
        : String(corporate_card_id).trim();
    if (v) {
      const clash = await db.pg.query(
        `SELECT id FROM "User"
         WHERE is_deleted = false
           AND corporate_card_id = $1
           AND id <> $2
         LIMIT 1`,
        [v, id],
      );
      if (clash.rows.length > 0) {
        throw new Error('Corporate card id is already in use');
      }
    }
    updates.corporate_card_id = v;
  }

  // Add hire_date if provided
  if (hire_date !== undefined) {
    updates.hire_date = hire_date === '' ? null : hire_date;
  }

  // Add avatar_url if provided
  if (profile_picture !== undefined && profile_picture !== '') {
    updates.avatar_url = profile_picture;
  }
  if (avatar_url !== undefined) {
    updates.avatar_url = avatar_url;
  }

  if (tenant_id !== undefined && tenant_id !== null) {
    const t = await db.pg.query(
      `SELECT id FROM "Tenant" WHERE id = $1 AND is_active = true`,
      [tenant_id],
    );
    if (t.rows.length === 0) {
      throw new Error('Tenant not found');
    }
    updates.tenant_id = tenant_id;
  }

  // Check if there are any updates
  if (Object.keys(updates).length === 0) {
    throw new Error('No fields have been updated');
  }

  try {
    // Build UPDATE query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `UPDATE "User" SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`;
    const values = [id, ...Object.values(updates)];

    const result = await db.pg.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('User not found or no changes made');
    }

    if (!skipQueryCacheClear) {
      try {
        db.optimized.clearCache();
      } catch {}
    }

    // Return updated user (already returned from UPDATE query)
    const updatedUser = result.rows[0];
    const { password_hash: _, ...userWithoutPassword } = updatedUser;

    return userWithoutPassword;
  } catch (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      if (error.constraint?.includes('email')) {
        throw new Error('Email already exists');
      }
      if (error.constraint?.includes('username')) {
        throw new Error('Username already exists');
      }
      if (
        String(error.constraint || '').includes('corporate_card') ||
        String(error.constraint || '').includes('ux_user_corporate_card')
      ) {
        throw new Error('Corporate card id is already in use');
      }
      throw new Error('User already exists');
    }
    console.error('user/update failed', { error });
    throw error;
  }
};
