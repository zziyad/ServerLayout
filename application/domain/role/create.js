// =============================================================================
// ROLE - CREATE
// =============================================================================

async (payload) => {
  const { name, display_name, description, is_system = false } = payload;

  // Validate required fields
  if (!name || !display_name) {
    throw new Error('Name and display_name are required');
  }

  // Check if role name already exists
  const existingRole = await db.pg.row('Role', ['id'], { name });
  if (existingRole) {
    throw new Error('Role with this name already exists');
  }

  try {
    const query = `
      INSERT INTO "Role" (
        name, display_name, description, is_system, is_active
      )
      VALUES ($1, $2, $3, $4, true)
      RETURNING *
    `;

    const values = [name, display_name, description || null, is_system];

    const result = await db.pg.query(query, values);
    const role = result.rows[0];

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return role;
  } catch (error) {
    console.error('role/create failed', { error });
    throw error;
  }
};
