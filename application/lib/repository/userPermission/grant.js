// Grant a direct permission to a user (insert or restore)

async ({
  userId,
  permissionId,
  grantedBy,
  isGranted = true,
  reason = null,
  expiresAt = null,
}) => {
  const existing = await db.pg.query(
    `SELECT id, is_deleted FROM "UserPermission"
     WHERE user_id = $1 AND permission_id = $2 LIMIT 1`,
    [userId, permissionId],
  );
  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.is_deleted) {
      const r = await db.pg.query(
        `UPDATE "UserPermission"
         SET is_deleted = false, deleted_at = NULL, is_granted = $1, granted_by = $2, granted_at = now(), reason = $3, expires_at = $4
         WHERE id = $5
         RETURNING *`,
        [isGranted, grantedBy, reason, expiresAt, row.id],
      );
      return r.rows[0];
    }
    const r = await db.pg.query(
      `UPDATE "UserPermission"
       SET is_granted = $1, granted_by = $2, granted_at = now(), reason = $3, expires_at = $4
       WHERE id = $5
       RETURNING *`,
      [isGranted, grantedBy, reason, expiresAt, row.id],
    );
    return r.rows[0];
  }
  const r = await db.pg.query(
    `INSERT INTO "UserPermission" (user_id, permission_id, is_granted, granted_by, reason, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, permissionId, isGranted, grantedBy, reason, expiresAt],
  );
  return r.rows[0];
};
