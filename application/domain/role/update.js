// =============================================================================
// ROLE - UPDATE
// =============================================================================

async (payload) => {
  const { id, name, display_name, description, is_active } = payload;

  if (!id) {
    throw new Error('Role ID is required');
  }

  // Check if role exists
  const existingRole = await db.pg.row('Role', ['id', 'name', 'is_system'], { id });
  if (!existingRole) {
    throw new Error('Role not found');
  }

  if (existingRole.is_system) {
    const err = new Error('System roles are protected and cannot be edited from the admin dashboard');
    err.code = 'ROLE_SYSTEM_PROTECTED';
    err.userMessage = 'System roles are protected and cannot be edited from the admin dashboard.';
    throw err;
  }

  // If name is changing, check if new name already exists
  if (name && name !== existingRole.name) {
    const nameExists = await db.pg.row('Role', ['id'], { name });
    if (nameExists) {
      throw new Error('Role with this name already exists');
    }
  }

  try {
    // Build update query dynamically
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (display_name !== undefined) updates.display_name = display_name;
    if (description !== undefined) updates.description = description;
    if (is_active !== undefined) updates.is_active = is_active;

    if (Object.keys(updates).length === 0) {
      throw new Error('No fields to update');
    }

    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    const query = `UPDATE "Role" SET ${setClause}, updated_at = now() WHERE id = $1 AND is_deleted = false RETURNING *`;
    const values = [id, ...Object.values(updates)];

    const result = await db.pg.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Role not found or no changes made');
    }

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    console.error('role/update failed', { error });
    throw error;
  }
};
