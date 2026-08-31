// =============================================================================
// DEPARTMENT ROLE TEMPLATE DELETE - Business Logic
// =============================================================================

async (payload) => {
  const { id } = payload
  const inUse = await db.pg.query(
    `
    SELECT COUNT(*)::int AS c
    FROM "DepartmentRoleAssignment"
    WHERE role_template_id = $1
      AND is_deleted = false
    `,
    [id],
  )
  if ((inUse.rows[0]?.c || 0) > 0) {
    throw new Error('Cannot delete template used by department role assignments')
  }

  return lib.repository.departmentRoleTemplate.delete({ id })
}
