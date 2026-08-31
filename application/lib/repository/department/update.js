// =============================================================================
// DEPARTMENT REPOSITORY - Update
// =============================================================================

async (data) => {
  const { id, code, name, display_name, description, is_active } = data;

  // Build dynamic UPDATE query
  const updates = [];
  const params = [];
  let paramIndex = 1;

  if (code !== undefined) {
    // Check if code already exists (excluding current department)
    const existingCheck = await db.pg.query(
      'SELECT id FROM "Department" WHERE code = $1 AND id != $2 AND is_deleted = false',
      [code, id],
    );

    if (existingCheck.rows.length > 0) {
      throw new Error('Department with this code already exists');
    }

    updates.push(`code = $${paramIndex++}`);
    params.push(code);
  }

  if (name !== undefined) {
    updates.push(`name = $${paramIndex++}`);
    params.push(name);
  }

  if (display_name !== undefined) {
    updates.push(`display_name = $${paramIndex++}`);
    params.push(display_name);
  }

  if (description !== undefined) {
    updates.push(`description = $${paramIndex++}`);
    params.push(description);
  }

  if (is_active !== undefined) {
    updates.push(`is_active = $${paramIndex++}`);
    params.push(is_active);
  }

  if (updates.length === 0) {
    // No fields to update, return existing department
    return await db.pg
      .query('SELECT * FROM "Department" WHERE id = $1', [id])
      .then((result) => result.rows[0]);
  }

  // updated_at is automatically set by trigger
  params.push(id);

  const sql = `
    UPDATE "Department"
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex} AND is_deleted = false
    RETURNING *
  `;

  const result = await db.pg.query(sql, params);

  if (result.rows.length === 0) {
    throw new Error('Department not found or already deleted');
  }

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
