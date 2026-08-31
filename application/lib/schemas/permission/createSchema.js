// =============================================================================
// PERMISSION CREATE SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    resource: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Resource name (e.g. user, department)',
    },
    action: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Action (e.g. read, create, update, delete)',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Optional description',
    },
    is_system: {
      type: 'boolean',
      description: 'System permission (protected from deletion)',
    },
  },
  required: ['resource', 'action'],
});
