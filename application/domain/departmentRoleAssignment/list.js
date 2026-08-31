// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT LIST - Business Logic
// =============================================================================

async (payload) => {
  const { department_id, status, page = 1, limit = 50 } = payload

  const department = await db.pg.row('Department', ['id'], {
    id: department_id,
    is_deleted: false,
  })
  if (!department) {
    throw new Error('Department not found')
  }

  return lib.repository.departmentRoleAssignment.list({
    department_id,
    status,
    page,
    limit,
  })
}
