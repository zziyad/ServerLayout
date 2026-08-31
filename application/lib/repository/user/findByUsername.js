// =============================================================================
// USER REPOSITORY - FindByUsername
// =============================================================================

async (username) => {
  const normalized = String(username || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  const result = await db.pg.query(
    `SELECT * FROM "User"
     WHERE is_deleted = false
       AND lower(username) = lower($1)
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] || null;
};
