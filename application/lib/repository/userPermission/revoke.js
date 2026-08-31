// Revoke (soft delete) a direct user permission

async ({ userId, permissionId }) => {
  const result = await db.pg.query(
    `UPDATE "UserPermission"
     SET is_deleted = true, deleted_at = now()
     WHERE user_id = $1 AND permission_id = $2 AND is_deleted = false
     RETURNING *`,
    [userId, permissionId],
  );
  if (result.rows.length === 0) {
    throw new Error('User permission not found or already revoked');
  }
  return result.rows[0];
};
