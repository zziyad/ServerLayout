// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT CREATE - Business Logic
// =============================================================================

async (payload) => {
  const {
    department_id,
    role_template_id,
    code,
    name,
    display_name,
    description,
    is_active = true,
  } = payload

  const department = await db.pg.row('Department', ['id', 'code', 'name'], {
    id: department_id,
    is_deleted: false,
  })
  if (!department) {
    throw new Error('Department not found')
  }

  const existing = await db.pg.row('DepartmentRoleAssignment', ['id'], {
    department_id,
    code,
    is_deleted: false,
  })
  if (existing) {
    throw new Error(
      `Role assignment with code '${code}' already exists for this department`,
    )
  }

  if (role_template_id) {
    const template = await db.pg.row('DepartmentRole', ['id'], {
      id: role_template_id,
      is_deleted: false,
    })
    if (!template) {
      throw new Error('Role template not found')
    }
  }

  return lib.repository.departmentRoleAssignment.create({
    department_id,
    role_template_id: role_template_id || null,
    code,
    name,
    display_name,
    description,
    is_active,
  })
}
