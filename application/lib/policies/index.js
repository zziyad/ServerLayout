// =============================================================================
// DOMAIN POLICIES - Index
// =============================================================================

async () => ({
  errors: lib.policies.errors,
  helpers: lib.policies.helpers,

  rbac: {
    adminOnlyPolicy: lib.policies.rbac.adminOnlyPolicy,
  },

  scope: {
    eventScope: lib.policies.scope.eventScope,
    departmentScope: lib.policies.scope.departmentScope,
    ownershipScope: lib.policies.scope.ownershipScope,
    venueScope: lib.policies.scope.venueScope,
    ownerDepartmentScope: lib.policies.scope.ownerDepartmentScope,
  },

  audit: {
    auditPolicy: lib.policies.audit.auditPolicy,
  },
});
