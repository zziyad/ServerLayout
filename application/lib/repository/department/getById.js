// =============================================================================
// DEPARTMENT REPOSITORY - Get By ID
// =============================================================================

async (id) => {
  const sql = `
    SELECT *
    FROM "Department"
    WHERE id = $1 AND is_deleted = false
  `;

  const params = [id];

  const result = await db.pg.query(sql, params);

  return result.rows[0] || null;
};
