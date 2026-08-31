// =============================================================================
// PERMISSION REPOSITORY - Get By ID
// =============================================================================

async (id) => {
  const result = await db.pg.query(
    `SELECT * FROM "Permission" WHERE id = $1 AND is_deleted = false`,
    [id],
  );
  return result.rows[0] || null;
};
