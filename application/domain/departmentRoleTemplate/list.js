// =============================================================================
// DEPARTMENT ROLE TEMPLATE LIST - Business Logic
// =============================================================================

async (payload) => {
  return lib.repository.departmentRoleTemplate.list(payload || {})
}
