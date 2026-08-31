// =============================================================================
// DEPARTMENT ROLE TEMPLATE REPOSITORY - Delete (Soft Delete)
// =============================================================================

async (data) => {
  const { id } = data

  const sql = `
    UPDATE "DepartmentRole"
    SET is_deleted = true,
        deleted_at = now(),
        is_active = false,
        updated_at = now()
    WHERE id = $1 AND is_deleted = false
    RETURNING *
  `
  const result = await db.pg.query(sql, [id])
  if (result.rows.length === 0) {
    throw new Error('Department role template not found')
  }

  try {
    db.optimized.clearCache()
  } catch {}

  return result.rows[0]
}
