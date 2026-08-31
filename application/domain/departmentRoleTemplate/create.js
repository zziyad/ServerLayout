// =============================================================================
// DEPARTMENT ROLE TEMPLATE CREATE - Business Logic
// =============================================================================

async (payload) => {
  const { code } = payload
  const normalizedCode = String(code || '').trim().toUpperCase()
  if (!normalizedCode) {
    throw new Error('code is required')
  }

  const existing = await db.pg.row('DepartmentRole', ['id'], {
    code: normalizedCode,
    is_deleted: false,
  })
  if (existing) {
    throw new Error(`Department role template '${normalizedCode}' already exists`)
  }

  return lib.repository.departmentRoleTemplate.create({
    ...payload,
    code: normalizedCode,
  })
}
