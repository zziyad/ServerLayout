// =============================================================================
// USER REPOSITORY - List
// =============================================================================

async ({ page, limit, search, department, status, role, tenant_id, account_scope }) => {
  const offset = (page - 1) * limit;

  // Build WHERE conditions
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (tenant_id) {
    conditions.push(`u.tenant_id = $${paramIndex}`);
    values.push(tenant_id);
    paramIndex++;
  }

  // Search filter (email, username, first_name, last_name)
  if (search) {
    conditions.push(`(
      u.email ILIKE $${paramIndex} OR 
      u.username ILIKE $${paramIndex} OR 
      u.first_name ILIKE $${paramIndex} OR 
      u.last_name ILIKE $${paramIndex} OR
      u.display_name ILIKE $${paramIndex} OR
      u.corporate_card_id ILIKE $${paramIndex} OR
      u.employee_id ILIKE $${paramIndex} OR
      concat_ws(' ', u.first_name, u.last_name) ILIKE $${paramIndex}
    )`);
    values.push(`%${search}%`);
    paramIndex++;
  }

  // Department filter (support both UUID and code). User has department_role_assignment_id -> DepartmentRoleAssignment -> department_id -> Department
  let departmentJoin = '';
  if (department) {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(department)) {
      conditions.push(`dra.department_id = $${paramIndex}`);
      values.push(department);
    } else {
      departmentJoin = `INNER JOIN "Department" d_filter ON dra.department_id = d_filter.id AND d_filter.code = $${paramIndex} AND d_filter.is_deleted = false`;
      values.push(department);
    }
    paramIndex++;
  }

  // Status filter
  if (status) {
    if (status === 'active') {
      conditions.push(`u.is_active = true AND u.is_deleted = false`);
    } else if (status === 'inactive') {
      conditions.push(`u.is_active = false AND u.is_deleted = false`);
    } else if (status === 'deleted') {
      conditions.push(`u.is_deleted = true`);
    }
  } else {
    // By default, show only non-deleted users
    conditions.push(`u.is_deleted = false`);
  }

  // Account scope filter
  if (account_scope === 'system') {
    conditions.push(
      `(u.account_status IS NULL OR u.account_status = 'ACTIVE'::public.user_account_status)`,
    );
  } else if (account_scope === 'imported') {
    conditions.push(`u.account_status = 'IMPORTED'::public.user_account_status`);
  }

  // Role filter
  let roleJoin = '';
  if (role) {
    roleJoin = `
      INNER JOIN "UserRole" ur_filter ON u.id = ur_filter.user_id AND ur_filter.is_active = true
      INNER JOIN "Role" r_filter ON ur_filter.role_id = r_filter.id AND r_filter.name = $${paramIndex}
    `;
    values.push(role);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build query with pagination. User has only department_role_assignment_id; Department via dra.department_id -> d
  const query = `
    SELECT 
      u.id,
      u.email,
      u.username,
      u.tenant_id,
      u.first_name,
      u.last_name,
      u.display_name,
      u.phone,
      dra.department_id as department_id,
      d.id as department_id_full,
      d.code as department_code,
      d.name as department_name,
      d.display_name as department_display_name,
      u.department_role_assignment_id,
      dra.id as department_role_assignment_id_full,
      dra.code as department_role_code,
      dra.name as department_role_name,
      dra.display_name as department_role_display_name,
      u.position,
      u.employee_id,
      u.corporate_card_id,
      u.account_status,
      u.is_active,
      u.is_deleted,
      u.last_login_at,
      u.created_at,
      u.updated_at,
      array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
      COALESCE(
        (
          SELECT array_agg(DISTINCT perm_key ORDER BY perm_key)
          FROM (
            SELECT p2.resource || '.' || p2.action AS perm_key
            FROM "UserRole" ur2
            JOIN "Role" r2
              ON r2.id = ur2.role_id
             AND r2.is_deleted = false
             AND r2.is_active = true
            JOIN "RolePermission" rp2
              ON rp2.role_id = r2.id
             AND rp2.is_deleted = false
            JOIN "Permission" p2
              ON p2.id = rp2.permission_id
             AND p2.is_deleted = false
            WHERE ur2.user_id = u.id
              AND ur2.is_active = true
              AND (ur2.expires_at IS NULL OR ur2.expires_at > now())

            UNION

            SELECT p3.resource || '.' || p3.action AS perm_key
            FROM "UserPermission" up
            JOIN "Permission" p3
              ON p3.id = up.permission_id
             AND p3.is_deleted = false
            WHERE up.user_id = u.id
              AND up.is_deleted = false
              AND up.is_granted = true
              AND (up.expires_at IS NULL OR up.expires_at > now())
          ) effective_permissions
        ),
        ARRAY[]::text[]
      ) as permissions
    FROM "User" u
    LEFT JOIN "DepartmentRoleAssignment" dra ON u.department_role_assignment_id = dra.id AND dra.is_deleted = false
    LEFT JOIN "Department" d ON dra.department_id = d.id AND d.is_deleted = false
    LEFT JOIN "UserRole" ur ON u.id = ur.user_id AND ur.is_active = true
    LEFT JOIN "Role" r ON ur.role_id = r.id
    ${roleJoin}
    ${departmentJoin}
    ${whereClause}
    GROUP BY u.id, u.corporate_card_id, d.id, d.code, d.name, d.display_name, dra.id, dra.code, dra.name, dra.display_name, dra.department_id
    ORDER BY u.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  values.push(limit, offset);

  try {
    const result = await db.pg.query(query, values);

    // Get total count for pagination (same joins as main query)
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM "User" u
      LEFT JOIN "DepartmentRoleAssignment" dra ON u.department_role_assignment_id = dra.id AND dra.is_deleted = false
      LEFT JOIN "Department" d ON dra.department_id = d.id AND d.is_deleted = false
      LEFT JOIN "UserRole" ur ON u.id = ur.user_id AND ur.is_active = true
      LEFT JOIN "Role" r ON ur.role_id = r.id
      ${roleJoin}
      ${departmentJoin}
      ${whereClause
        .replace(
          'GROUP BY u.id, d.id, d.code, d.name, d.display_name, dra.id, dra.code, dra.name, dra.display_name, dra.department_id',
          '',
        )
        .replace('ORDER BY u.created_at DESC', '')
        .replace('LIMIT', '')
        .replace('OFFSET', '')}
    `;

    const countResult = await db.pg.query(countQuery, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].total || 0);

    // Transform results to include department and department_role objects
    const transformedData = result.rows.map((row) => {
      const {
        department_id_full,
        department_code,
        department_name,
        department_display_name,
        department_role_assignment_id_full,
        department_role_code,
        department_role_name,
        department_role_display_name,
        ...userData
      } = row;

      return {
        ...userData,
        department: department_code
          ? {
              id: department_id_full,
              code: department_code,
              name: department_name,
              display_name: department_display_name,
            }
          : null,
        department_role: department_role_code
          ? {
              id: department_role_assignment_id_full,
              code: department_role_code,
              name: department_role_name,
              display_name: department_role_display_name,
            }
          : null,
      };
    });

    return {
      data: transformedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('user/list query failed', { error });
    throw error;
  }
};
