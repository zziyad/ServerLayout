// =============================================================================
// USER ASSIGN DEPARTMENT ROLE ASSIGNMENT - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    user_id: {
      type: 'string',
      format: 'uuid',
      description: 'Internal user ID',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description: 'Optional tenant ID for scope validation',
    },
    department_role_assignment_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description: 'Target DepartmentRoleAssignment ID (or null to clear)',
    },
  },
  required: ['user_id'],
  additionalProperties: false,
})
