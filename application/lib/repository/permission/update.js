// =============================================================================
// PERMISSION REPOSITORY - Update
// =============================================================================

async (data) => {
  const { id, resource, action, description } = data;

  if (resource !== undefined || action !== undefined) {
    const current = await db.pg.query(
      'SELECT resource, action FROM "Permission" WHERE id = $1 AND is_deleted = false',
      [id],
    );
    if (!current.rows[0])
      throw new Error('Permission not found or already deleted');
    const r = resource !== undefined ? resource : current.rows[0].resource;
    const a = action !== undefined ? action : current.rows[0].action;
    const conflict = await db.pg.query(
      'SELECT id FROM "Permission" WHERE resource = $1 AND action = $2 AND id != $3 AND is_deleted = false',
      [r, a, id],
    );
    if (conflict.rows.length > 0) {
      throw new Error(
        'Another permission already exists with this resource and action',
      );
    }
  }

  const updates = [];
  const params = [];
  let n = 1;

  if (resource !== undefined) {
    updates.push(`resource = $${n++}`);
    params.push(resource);
  }
  if (action !== undefined) {
    updates.push(`action = $${n++}`);
    params.push(action);
  }
  if (description !== undefined) {
    updates.push(`description = $${n++}`);
    params.push(description);
  }

  if (updates.length === 0) {
    const existing = await db.pg.query(
      'SELECT * FROM "Permission" WHERE id = $1 AND is_deleted = false',
      [id],
    );
    return existing.rows[0] || null;
  }

  params.push(id);
  const result = await db.pg.query(
    `UPDATE "Permission"
     SET ${updates.join(', ')}
     WHERE id = $${n} AND is_deleted = false
     RETURNING *`,
    params,
  );
  if (result.rows.length === 0)
    throw new Error('Permission not found or already deleted');
  return result.rows[0];
};
