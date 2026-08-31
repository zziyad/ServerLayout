// =============================================================================
// PERMISSION REPOSITORY - Soft Delete
// =============================================================================

async (id) => {
  const result = await db.pg.query(
    `UPDATE "Permission"
     SET is_deleted = true, deleted_at = now()
     WHERE id = $1 AND is_deleted = false
     RETURNING *`,
    [id],
  );
  if (result.rows.length === 0)
    throw new Error('Permission not found or already deleted');
  return result.rows[0];
};
