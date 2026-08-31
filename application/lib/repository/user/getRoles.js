// =============================================================================
// USER REPOSITORY - GetRoles
// =============================================================================

async (userId) => {
  const result = await db.pg.query(
    `SELECT r.*
     FROM "Role" r
     JOIN "UserRole" ur ON r.id = ur.role_id
     WHERE ur.user_id = $1 AND ur.is_active = true
       AND (ur.expires_at IS NULL OR ur.expires_at > now())`,
    [userId],
  );
  return result.rows;
};
