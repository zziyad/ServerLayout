// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT UPDATE SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Department role assignment ID',
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
  required: ['id'],
})
