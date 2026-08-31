// =============================================================================
// USER REPOSITORY - GetByEmail
// =============================================================================

async (email) => {
  const result = await db.pg.query(
    `SELECT
       u.*,
       array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) as roles,
       array_agg(DISTINCT p.resource || '.' || p.action)
         FILTER (WHERE p.resource IS NOT NULL) as permissions
     FROM "User" u
     LEFT JOIN "UserRole" ur ON u.id = ur.user_id AND ur.is_active = true
     LEFT JOIN "Role" r ON ur.role_id = r.id
     LEFT JOIN "RolePermission" rp ON r.id = rp.role_id AND rp.is_deleted = false
     LEFT JOIN "Permission" p ON rp.permission_id = p.id AND p.is_deleted = false
     WHERE u.email = $1
     GROUP BY u.id`,
    [email],
  );
  return result.rows[0] || null;
};
