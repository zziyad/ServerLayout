// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT UPDATE - Business Logic
// =============================================================================

async (payload) => {
  const { id, name, display_name, description, is_active } = payload

  const existing = await db.pg.row(
    'DepartmentRoleAssignment',
    ['id', 'department_id', 'code'],
    {
      id,
      is_deleted: false,
    },
  )
  if (!existing) {
    throw new Error('Department role assignment not found')
  }

  return lib.repository.departmentRoleAssignment.update({
    id,
    name,
    display_name,
    description,
    is_active,
  })
}
