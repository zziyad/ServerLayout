// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT DELETE SCHEMA
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
  },
  required: ['id'],
})
