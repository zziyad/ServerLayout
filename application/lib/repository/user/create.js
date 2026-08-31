// =============================================================================
// USER REPOSITORY - Create
// =============================================================================

async (data) => {
  let resolvedTenantId = data.tenantId || null;
  if (resolvedTenantId) {
    const tenant = await db.pg.query(
      `SELECT id FROM "Tenant" WHERE id = $1 AND is_active = true`,
      [resolvedTenantId],
    );
    if (!tenant.rows[0]) throw new Error('Tenant not found');
  } else {
    const tenant = await db.pg.query(
      `SELECT id FROM "Tenant" WHERE is_active = true
       ORDER BY created_at ASC, id ASC LIMIT 1`,
    );
    if (!tenant.rows[0]) {
      throw new Error('No active tenant found. Create a tenant first');
    }
    resolvedTenantId = tenant.rows[0].id;
  }

  if (data.corporateCardId) {
    const dup = await db.pg.query(
      `SELECT id FROM "User"
       WHERE is_deleted = false AND corporate_card_id = $1
       LIMIT 1`,
      [data.corporateCardId],
    );
    if (dup.rows[0]) throw new Error('Corporate card id is already in use');
  }

  const existingEmail = await db.pg.row('User', ['id'], { email: data.email });
  if (existingEmail) throw new Error('User with this email already exists');

  if (data.username) {
    const existingUsername = await db.pg.row('User', ['id'], {
      username: data.username,
    });
    if (existingUsername) throw new Error('Username already taken');
  }

  if (data.departmentRoleAssignmentId) {
    const roleAssignment = await db.pg.row(
      'DepartmentRoleAssignment',
      ['id', 'is_active'],
      { id: data.departmentRoleAssignmentId, is_deleted: false },
    );
    if (!roleAssignment) throw new Error('Department role assignment not found');
    if (!roleAssignment.is_active) {
      throw new Error('Department role assignment is not active');
    }
  }

  let employeeId = data.employeeId;
  if (!employeeId) {
    const lastEmpQuery = await db.pg.query(
      `SELECT employee_id FROM "User"
       WHERE employee_id IS NOT NULL
       ORDER BY employee_id DESC LIMIT 1`,
    );
    let nextNumber = 1;
    if (lastEmpQuery.rows[0]?.employee_id) {
      const match = String(lastEmpQuery.rows[0].employee_id).match(/(\d+)$/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    const year = new Date().getFullYear();
    const padded = String(nextNumber).padStart(3, '0');
    employeeId = `EMP-${year}-${padded}`;
    const existing = await db.pg.row('User', ['id'], {
      employee_id: employeeId,
    });
    if (existing) {
      employeeId = `EMP-${year}-${padded}-${Date.now().toString().slice(-3)}`;
    }
  }

  const result = await db.pg.query(
    `INSERT INTO "User" (
       email, username, password_hash,
       first_name, last_name, display_name,
       phone, position, employee_id, hire_date,
       department_role_assignment_id, corporate_card_id,
       is_active, tenant_id, account_status
     ) VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14, $15::public.user_account_status
     )
     RETURNING *`,
    [
      data.email,
      data.username,
      data.passwordHash,
      data.firstName,
      data.lastName,
      data.displayName,
      data.phone,
      data.position,
      employeeId,
      data.hireDate,
      data.departmentRoleAssignmentId,
      data.corporateCardId,
      true,
      resolvedTenantId,
      data.accountStatus,
    ],
  );
  const user = result.rows[0];

  try {
    const defaultRole =
      (await db.pg.row('Role', ['id'], { name: 'app_user' })) ||
      (await db.pg.row('Role', ['id'], { name: 'user' }));
    if (defaultRole) {
      await db.pg.insert('UserRole', {
        user_id: user.id,
        role_id: defaultRole.id,
        assigned_by: user.id,
        is_active: true,
      });
    }
  } catch (roleError) {
    console.warn('Failed to assign default role:', roleError);
  }

  if (!data.skipQueryCacheClear) {
    try {
      db.optimized.clearCache();
    } catch {}
  }

  return user;
};
