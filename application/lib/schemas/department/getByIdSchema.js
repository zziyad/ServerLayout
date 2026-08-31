// =============================================================================
// DEPARTMENT GET BY ID SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Department ID (UUID)',
    },
  },
  required: ['id'],
});
