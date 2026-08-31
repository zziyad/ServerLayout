// =============================================================================
// USER REPOSITORY - HasAdminRole
// =============================================================================

async (userId) => {
  const result = await db.pg.query(
    `SELECT COUNT(*) as count
     FROM "UserRole" ur
     INNER JOIN "Role" r ON ur.role_id = r.id
     WHERE ur.user_id = $1
       AND r.name IN ('admin', 'super_admin')
       AND ur.is_active = true
       AND r.is_active = true`,
    [userId],
  );
  return parseInt(result.rows[0]?.count || 0, 10) > 0;
};
