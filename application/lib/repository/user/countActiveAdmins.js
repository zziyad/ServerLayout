// =============================================================================
// USER REPOSITORY - CountActiveAdmins
// =============================================================================

async () => {
  const result = await db.pg.query(
    `SELECT COUNT(DISTINCT u.id) as count
     FROM "User" u
     INNER JOIN "UserRole" ur ON u.id = ur.user_id
     INNER JOIN "Role" r ON ur.role_id = r.id
     WHERE r.name IN ('admin', 'super_admin')
       AND ur.is_active = true
       AND r.is_active = true
       AND u.is_deleted = false
       AND u.is_active = true`,
  );
  return parseInt(result.rows[0]?.count || 0, 10);
};
