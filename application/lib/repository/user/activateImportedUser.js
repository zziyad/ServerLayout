// =============================================================================
// USER REPOSITORY - ActivateImportedUser
// =============================================================================

async (payload) => {
  const {
    user_id,
    email,
    password,
    username,
    role_id,
    department_role_assignment_id,
    sessionUserId,
  } = payload;

  if (!sessionUserId) {
    throw new Error('Authentication required');
  }

  const emailNormalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!emailNormalized) {
    throw new Error('Email is required');
  }

  const usernameNormalized =
    username === undefined || username === null || String(username).trim() === ''
      ? null
      : String(username).trim();

  const targetUser = await db.pg.query(
    `SELECT id, email, username, is_deleted, corporate_card_id, account_status, activated_at
     FROM "User"
     WHERE id = $1
     LIMIT 1`,
    [user_id],
  );

  if (targetUser.rows.length === 0) {
    throw new Error('User not found');
  }

  const current = targetUser.rows[0];
  if (current.is_deleted) {
    throw new Error('Cannot activate deleted user');
  }
  if (current.account_status !== 'IMPORTED') {
    throw new Error('User is already activated');
  }
  if (current.activated_at) {
    throw new Error('User is already activated');
  }

  const duplicateEmail = await db.pg.query(
    `SELECT id
     FROM "User"
     WHERE is_deleted = false
       AND lower(email) = lower($1)
       AND id <> $2
     LIMIT 1`,
    [emailNormalized, user_id],
  );
  if (duplicateEmail.rows.length > 0) {
    throw new Error('Email already exists');
  }

  if (usernameNormalized) {
    const duplicateUsername = await db.pg.query(
      `SELECT id
       FROM "User"
       WHERE is_deleted = false
         AND lower(username) = lower($1)
         AND id <> $2
       LIMIT 1`,
      [usernameNormalized, user_id],
    );
    if (duplicateUsername.rows.length > 0) {
      throw new Error('Username already taken');
    }
  }

  if (department_role_assignment_id) {
    const roleAssignment = await db.pg.row(
      'DepartmentRoleAssignment',
      ['id', 'is_active'],
      {
        id: department_role_assignment_id,
        is_deleted: false,
      },
    );
    if (!roleAssignment) {
      throw new Error('Department role assignment not found');
    }
    if (!roleAssignment.is_active) {
      throw new Error('Department role assignment is not active');
    }
  }

  if (role_id) {
    const role = await db.pg.row('Role', ['id', 'is_active', 'is_deleted'], {
      id: role_id,
    });
    if (!role || role.is_deleted) {
      throw new Error('Role not found');
    }
    if (!role.is_active) {
      throw new Error('Role is not active');
    }
  }

  const password_hash = await metarhia.metautil.hashPassword(password);

  try {
    let updatedUser = null;
    await db.optimized.transaction(async (client) => {
      const updateFields = [
        'email = $2',
        'password_hash = $3',
        'account_status = $4::public.user_account_status',
        'activated_at = now()',
        'activated_by = $5',
        'is_active = true',
        'updated_at = now()',
      ];
      const updateValues = [
        user_id,
        emailNormalized,
        password_hash,
        'ACTIVE',
        sessionUserId,
      ];

      if (usernameNormalized !== null) {
        updateFields.push(`username = $${updateValues.length + 1}`);
        updateValues.push(usernameNormalized);
      }

      if (department_role_assignment_id !== undefined) {
        updateFields.push(
          `department_role_assignment_id = $${updateValues.length + 1}`,
        );
        updateValues.push(department_role_assignment_id || null);
      }

      const updateResult = await client.query(
        `UPDATE "User"
         SET ${updateFields.join(', ')}
         WHERE id = $1
         RETURNING id, email, username, first_name, last_name, display_name,
                   corporate_card_id, department_role_assignment_id, account_status,
                   activated_at, activated_by, is_active`,
        updateValues,
      );

      if (updateResult.rows.length === 0) {
        throw new Error('Failed to activate imported user');
      }
      updatedUser = updateResult.rows[0];

      if (role_id) {
        await client.query(
          `UPDATE "UserRole"
           SET is_active = false, is_deleted = true, deleted_at = now()
           WHERE user_id = $1
             AND role_id = $2
             AND is_deleted = false
             AND is_active = true`,
          [user_id, role_id],
        );
        await client.query(
          `INSERT INTO "UserRole" (user_id, role_id, assigned_by, is_active, assigned_at)
           VALUES ($1, $2, $3, true, now())`,
          [user_id, role_id, sessionUserId],
        );
      }

      await client.query(
        `INSERT INTO "UserActivationAudit" (
           user_id,
           activated_by,
           previous_email,
           new_email,
           previous_username,
           new_username,
           assigned_role_id,
           assigned_department_role_assignment_id,
           meta
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
        [
          user_id,
          sessionUserId,
          current.email,
          emailNormalized,
          current.username || null,
          usernameNormalized,
          role_id || null,
          department_role_assignment_id || null,
          JSON.stringify({
            corporate_card_id: current.corporate_card_id || null,
            source: 'user.activateImported',
          }),
        ],
      );
    });

    try {
      console.security('user-import-activated', {
        actor: sessionUserId,
        userId: user_id,
        email: emailNormalized,
      });
    } catch {}

    try {
      db.optimized.clearCache();
    } catch {}

    return updatedUser;
  } catch (error) {
    if (error.code === '23505') {
      if (error.constraint?.includes('email')) {
        throw new Error('Email already exists');
      }
      if (error.constraint?.includes('username')) {
        throw new Error('Username already taken');
      }
    }
    console.error('user/activateImportedUser failed', { error, user_id });
    throw error;
  }
};
