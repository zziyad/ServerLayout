// =============================================================================
// PERMISSION REPOSITORY - Create
// =============================================================================

async (data) => {
  const { resource, action, description = null, is_system = false } = data;

  const existing = await db.pg.query(
    `SELECT id FROM "Permission"
     WHERE resource = $1 AND action = $2 AND is_deleted = false`,
    [resource, action],
  );
  if (existing.rows.length > 0) {
    throw new Error('Permission with this resource and action already exists');
  }

  const result = await db.pg.query(
    `INSERT INTO "Permission" (resource, action, description, is_system)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [resource, action, description, is_system],
  );
  return result.rows[0];
};
