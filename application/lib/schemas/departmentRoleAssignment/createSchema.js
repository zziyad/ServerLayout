// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT CREATE SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    department_id: {
      type: 'string',
      format: 'uuid',
      description: 'Department ID (UUID)',
    },
    role_template_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Optional: reference to DepartmentRole template',
    },
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: 'Role assignment code (unique within department)',
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Role assignment name',
    },
    display_name: {
      type: 'string',
      minLength: 1,
      maxLength: 150,
      description: 'Role assignment display name',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 1000,
      description: 'Role assignment description',
    },
    is_active: {
      type: 'boolean',
      description: 'Is role assignment active',
    },
  },
  required: ['department_id', 'code', 'name', 'display_name'],
})
