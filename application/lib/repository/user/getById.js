// =============================================================================
// USER REPOSITORY - GetById
// =============================================================================

async (userId) => {
  const result = await db.pg.query(
    `SELECT
       u.*,
       json_agg(DISTINCT jsonb_build_object(
         'id', r.id,
         'name', r.name,
         'display_name', r.display_name,
         'description', r.description
       )) FILTER (WHERE r.id IS NOT NULL) as roles,
       array_agg(DISTINCT p.resource || '.' || p.action)
         FILTER (WHERE p.resource IS NOT NULL) as permissions
     FROM "User" u
     LEFT JOIN "UserRole" ur ON u.id = ur.user_id AND ur.is_active = true
     LEFT JOIN "Role" r ON ur.role_id = r.id AND ur.is_active = true
     LEFT JOIN "RolePermission" rp ON r.id = rp.role_id AND rp.is_deleted = false
     LEFT JOIN "Permission" p ON rp.permission_id = p.id AND p.is_deleted = false
     WHERE u.id = $1 AND u.is_deleted = false
     GROUP BY u.id`,
    [userId],
  );
  const user = result.rows[0] || null;
  if (!user) return null;

  user.department = null;
  user.department_role = null;
  if (user.department_role_assignment_id) {
    const draResult = await db.pg.query(
      `SELECT dra.id, dra.code, dra.name, dra.display_name, dra.department_id,
              d.id as dept_id, d.code as dept_code, d.name as dept_name,
              d.display_name as dept_display_name
       FROM "DepartmentRoleAssignment" dra
       JOIN "Department" d ON d.id = dra.department_id AND d.is_deleted = false
       WHERE dra.id = $1 AND dra.is_deleted = false`,
      [user.department_role_assignment_id],
    );
    if (draResult.rows[0]) {
      const row = draResult.rows[0];
      user.department = {
        id: row.dept_id,
        code: row.dept_code,
        name: row.dept_name,
        display_name: row.dept_display_name,
      };
      user.department_role = {
        id: row.id,
        code: row.code,
        name: row.name,
        display_name: row.display_name,
      };
    }
  }

  try {
    db.optimized.clearCache();
  } catch {}

  return user;
};
