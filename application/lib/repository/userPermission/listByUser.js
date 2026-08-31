// List direct UserPermissions for a user (not deleted)

async (userId) => {
  const result = await db.pg.query(
    `SELECT up.id, up.user_id, up.permission_id, up.is_granted, up.granted_at, up.expires_at, up.reason,
            p.resource, p.action, p.description
     FROM "UserPermission" up
     JOIN "Permission" p ON p.id = up.permission_id AND p.is_deleted = false
     WHERE up.user_id = $1 AND up.is_deleted = false
     ORDER BY p.resource, p.action`,
    [userId],
  );
  return result.rows;
};
