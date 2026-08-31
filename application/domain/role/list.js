// =============================================================================
// ROLE LIST
// =============================================================================

async ({ includeSystem }) => {
  try {
    let query = `
      SELECT *
      FROM "Role"
      WHERE is_deleted = false
    `;

    const values = [];

    if (!includeSystem) {
      query += ` AND is_system = false`;
    }

    query += ` ORDER BY display_name ASC`;

    const result = await db.pg.query(query, values);

    return result.rows;
  } catch (error) {
    console.error('role/list failed', { error });
    throw error;
  }
};
