// =============================================================================
// DEPARTMENT ROLE TEMPLATE UPDATE - Business Logic
// =============================================================================

async (payload) => {
  const next = { ...payload }
  if (next.code !== undefined) {
    next.code = String(next.code || '').trim().toUpperCase()
    if (!next.code) {
      throw new Error('code cannot be empty')
    }
  }

  if (next.code) {
    const clash = await db.pg.query(
      `
      SELECT id
      FROM "DepartmentRole"
      WHERE code = $1
        AND is_deleted = false
        AND id <> $2
      LIMIT 1
      `,
      [next.code, next.id],
    )
    if (clash.rows.length > 0) {
      throw new Error(`Department role template '${next.code}' already exists`)
    }
  }

  return lib.repository.departmentRoleTemplate.update(next)
}
