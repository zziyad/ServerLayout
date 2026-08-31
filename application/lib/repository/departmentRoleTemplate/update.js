// =============================================================================
// DEPARTMENT ROLE TEMPLATE REPOSITORY - Update
// =============================================================================

async (data) => {
  const { id, code, name, display_name, description, is_active } = data

  const existing = await db.pg.row('DepartmentRole', ['id'], {
    id,
    is_deleted: false,
  })
  if (!existing) {
    throw new Error('Department role template not found')
  }

  const updates = []
  const values = [id]
  let index = 2

  if (code !== undefined) {
    updates.push(`code = $${index++}`)
    values.push(code)
  }
  if (name !== undefined) {
    updates.push(`name = $${index++}`)
    values.push(name)
  }
  if (display_name !== undefined) {
    updates.push(`display_name = $${index++}`)
    values.push(display_name)
  }
  if (description !== undefined) {
    updates.push(`description = $${index++}`)
    values.push(description || null)
  }
  if (is_active !== undefined) {
    updates.push(`is_active = $${index++}`)
    values.push(is_active)
  }

  if (updates.length === 0) {
    throw new Error('No fields provided for update')
  }

  const sql = `
    UPDATE "DepartmentRole"
    SET ${updates.join(', ')}, updated_at = now()
    WHERE id = $1 AND is_deleted = false
    RETURNING *
  `
  const result = await db.pg.query(sql, values)
  try {
    db.optimized.clearCache()
  } catch {}

  return result.rows[0]
}
