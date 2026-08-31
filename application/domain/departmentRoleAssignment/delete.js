// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT DELETE - Business Logic
// =============================================================================

async (payload) => {
  const { id } = payload
  const existing = await db.pg.row('DepartmentRoleAssignment', ['id'], {
    id,
    is_deleted: false,
  })
  if (!existing) {
    throw new Error('Department role assignment not found')
  }
  return lib.repository.departmentRoleAssignment.delete({ id })
}
