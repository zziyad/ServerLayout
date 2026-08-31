// =============================================================================
// POLICY - Department Scope (VLO rules)
// =============================================================================
//
// VLO can access only department requests.
// Reviewer/Admin may bypass in domain use-cases.

async (opts) => {
  const { user, request, allowBypass = false } = opts || {};

  console.log('USER', user);
  if (!user?.id)
    throw await lib.policies.errors(
      'SCOPE_USER_REQUIRED',
      'user.id is required',
    );
  if (!request)
    throw await lib.policies.errors(
      'SCOPE_REQUEST_REQUIRED',
      'request is required',
    );

  if (allowBypass) return true;

  if (!user?.department_id) {
    throw await lib.policies.errors(
      'SCOPE_USER_DEPT_REQUIRED',
      'user.department_id is required',
    );
  }

  if (String(request.department_id) !== String(user.department_id)) {
    throw await lib.policies.errors(
      'SCOPE_DEPARTMENT_MISMATCH',
      'Forbidden: request belongs to another department',
      {
        user_department_id: user.department_id,
        request_department_id: request.department_id,
      },
    );
  }

  return true;
};
