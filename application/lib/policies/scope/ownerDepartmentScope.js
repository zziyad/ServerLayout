// =============================================================================
// POLICY - Owner Department Scope
// =============================================================================
//
// Rule (TYP-01):
// Only PermitType.owner_department_id can confirm distribution.
//
// Usage:
//   await lib.policies.scope.ownerDepartmentScope({
//     user,
//     permitType,
//   })
//
// =============================================================================

async (opts) => {
  const { user, permitType } = opts || {};

  if (!user?.id)
    throw await lib.policies.errors(
      'SCOPE_USER_REQUIRED',
      'user.id is required',
    );
  if (!permitType)
    throw await lib.policies.errors(
      'SCOPE_PERMIT_TYPE_REQUIRED',
      'permitType is required',
    );

  if (!user?.department_id) {
    throw await lib.policies.errors(
      'SCOPE_USER_DEPT_REQUIRED',
      'user.department_id is required',
    );
  }

  const ownerDeptId = permitType?.owner_department_id || null;

  if (!ownerDeptId) {
    throw await lib.policies.errors(
      'SCOPE_OWNER_DEPT_MISSING',
      'PermitType.owner_department_id is missing',
      { permit_type_id: permitType?.id, code: permitType?.code },
    );
  }

  if (String(ownerDeptId) !== String(user.department_id)) {
    throw await lib.policies.errors(
      'SCOPE_NOT_OWNER_DEPARTMENT',
      'Forbidden: only owner department can confirm distribution',
      {
        user_id: user.id,
        user_department_id: user.department_id,
        owner_department_id: ownerDeptId,
        permit_type_id: permitType?.id,
        permit_type_code: permitType?.code,
      },
    );
  }

  return true;
};
