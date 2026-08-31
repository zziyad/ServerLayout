// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT REPOSITORY - Update
// =============================================================================

async (data) => {
  const { id, name, display_name, description, is_active } = data

  const sql = `
    UPDATE "DepartmentRoleAssignment"
    SET
      name = $2,
      display_name = $3,
      description = $4,
      is_active = $5,
      updated_at = now()
    WHERE id = $1 AND is_deleted = false
    RETURNING *
  `
  const params = [id, name, display_name, description || null, is_active]
  const result = await db.pg.query(sql, params)
  if (result.rows.length === 0) {
    throw new Error('Department role assignment not found')
  }
  try {
    db.optimized.clearCache()
  } catch {}
  return result.rows[0]
}
