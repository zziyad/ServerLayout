// =============================================================================
// USER ASSIGN DEPARTMENT ROLE ASSIGNMENT - Business Logic
// =============================================================================

async (payload) => {
  const checked = await lib.repository.user.assignDepartmentRoleAssignment({
    userId: payload.user_id,
    tenantId: payload.tenant_id,
    departmentRoleAssignmentId: payload.department_role_assignment_id,
  });
  const updated = await domain.user.update({
    id: payload.user_id,
    department_role_id: checked.nextAssignmentId,
  });
  return {
    user_id: payload.user_id,
    tenant_id: checked.effectiveTenantId,
    department_role_assignment_id: checked.nextAssignmentId,
    user: updated,
  };
};
