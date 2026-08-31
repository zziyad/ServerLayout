// =============================================================================
// DEPARTMENT REPOSITORY - Create
// =============================================================================

async (data) => {
  const {
    code,
    name,
    display_name,
    description,
    is_active = true,
    event_id = null,
    tenant_id = null,
  } = data;

  let resolvedTenantId = tenant_id || null;
  if (resolvedTenantId) {
    const t = await db.pg.query(
      `SELECT id FROM "Tenant" WHERE id = $1 AND is_active = true`,
      [resolvedTenantId],
    );
    if (t.rows.length === 0) {
      throw new Error('Tenant not found');
    }
  } else {
    const t = await db.pg.query(
      `SELECT id FROM "Tenant" WHERE is_active = true ORDER BY created_at ASC, id ASC LIMIT 1`,
    );
    if (t.rows.length === 0) {
      throw new Error('No active tenant found. Create a tenant first');
    }
    resolvedTenantId = t.rows[0].id;
  }

  // Check if code already exists (considering event_id uniqueness)
  // Code must be unique per event (or globally if event_id is null)
  let existingCheck;
  if (event_id) {
    // Check for event-specific department: code must be unique within this event
    existingCheck = await db.pg.query(
      `SELECT id FROM "Department" 
       WHERE code = $1 
         AND event_id = $2 
         AND tenant_id = $3
         AND is_deleted = false`,
      [code, event_id, resolvedTenantId],
    );
  } else {
    // Check for global department: code must be unique per tenant (where event_id IS NULL)
    existingCheck = await db.pg.query(
      `SELECT id FROM "Department" 
       WHERE code = $1 
         AND event_id IS NULL 
         AND tenant_id = $2
         AND is_deleted = false`,
      [code, resolvedTenantId],
    );
  }

  if (existingCheck.rows.length > 0) {
    throw new Error('Department with this code already exists for this event');
  }

  const sql = `
    INSERT INTO "Department" (
      code, name, display_name, description, is_active, event_id, tenant_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const params = [
    code,
    name,
    display_name,
    description || null,
    is_active,
    event_id || null,
    resolvedTenantId,
  ];

  const result = await db.pg.query(sql, params);

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
