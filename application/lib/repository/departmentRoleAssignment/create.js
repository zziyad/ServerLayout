// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT REPOSITORY - Create
// =============================================================================

async (data, maybeOptions) => {
  const skipQueryCacheClear =
    maybeOptions &&
    typeof maybeOptions === 'object' &&
    Object.prototype.hasOwnProperty.call(maybeOptions, 'skipQueryCacheClear') &&
    maybeOptions.skipQueryCacheClear === true

  const {
    department_id,
    role_template_id,
    code,
    name,
    display_name,
    description,
    is_active = true,
  } = data

  const sql = `
    INSERT INTO "DepartmentRoleAssignment" (
      department_id, role_template_id, code, name, display_name, description, is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `

  const params = [
    department_id,
    role_template_id || null,
    code,
    name,
    display_name,
    description || null,
    is_active,
  ]
  const result = await db.pg.query(sql, params)

  if (!skipQueryCacheClear) {
    try {
      db.optimized.clearCache()
    } catch {}
  }

  return result.rows[0]
}
