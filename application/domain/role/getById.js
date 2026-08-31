// =============================================================================
// ROLE - GET BY ID
// =============================================================================

async ({ id }) => {
  try {
    const query = `
      SELECT *
      FROM "Role"
      WHERE id = $1 AND is_deleted = false
    `;

    const result = await db.pg.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('role/getById failed', { error });
    throw error;
  }
};
