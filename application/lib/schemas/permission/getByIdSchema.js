// =============================================================================
// PERMISSION GET BY ID SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Permission ID (UUID)',
    },
  },
  required: ['id'],
});
