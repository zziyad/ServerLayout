// =============================================================================
// PERMISSION UPDATE SCHEMA - JSON Schema
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
    resource: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Resource name',
    },
    action: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Action',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Optional description',
    },
  },
  required: ['id'],
});
