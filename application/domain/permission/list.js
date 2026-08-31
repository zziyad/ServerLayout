// =============================================================================
// PERMISSION LIST
// =============================================================================

async ({ resource, action }) => {
  try {
    const conditions = ['is_deleted = false'];
    const values = [];
    let paramIndex = 1;

    if (resource) {
      conditions.push(`resource = $${paramIndex}`);
      values.push(resource);
      paramIndex++;
    }

    if (action) {
      conditions.push(`action = $${paramIndex}`);
      values.push(action);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    const query = `
      SELECT *
      FROM "Permission"
      WHERE ${whereClause}
      ORDER BY resource, action
    `;

    const result = await db.pg.query(query, values);

    return result.rows;
  } catch (error) {
    console.error('permission/list failed', { error });
    throw error;
  }
};
