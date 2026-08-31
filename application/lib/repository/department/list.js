// =============================================================================
// DEPARTMENT REPOSITORY - List
// =============================================================================

async (data = {}) => {
  const {
    is_active,
    include_deleted = false,
    search,
    event_id = null, // Optional: filter by event_id (show event-specific + global)
    tenant_id = null,
    limit = 100,
    offset = 0,
  } = data;

  // Build WHERE conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (tenant_id) {
    conditions.push(`d.tenant_id = $${paramIndex++}`);
    params.push(tenant_id);
  }

  if (!include_deleted) {
    conditions.push(`d.is_deleted = false`);
  }

  if (is_active !== undefined && is_active !== null) {
    conditions.push(`d.is_active = $${paramIndex++}`);
    params.push(is_active);
  }

  // Filter by event_id: show event-specific departments + global departments (event_id IS NULL)
  if (event_id) {
    params.push(event_id);
    conditions.push(`(d.event_id = $${paramIndex++} OR d.event_id IS NULL)`);
  }

  if (search) {
    conditions.push(`(
      d.code ILIKE $${paramIndex} OR
      d.name ILIKE $${paramIndex} OR
      d.display_name ILIKE $${paramIndex}
    )`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT d.*
    FROM "Department" d
    ${whereClause}
    ORDER BY d.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  params.push(limit, offset);

  const result = await db.pg.query(sql, params);

  return result.rows;
};
