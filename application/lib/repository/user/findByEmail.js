// =============================================================================
// USER REPOSITORY - FindByEmail
// =============================================================================

async (email) => {
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  const result = await db.pg.query(
    `SELECT * FROM "User"
     WHERE is_deleted = false
       AND lower(email) = lower($1)
     LIMIT 1`,
    [normalized],
  );
  return result.rows[0] || null;
};
