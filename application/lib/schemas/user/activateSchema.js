// =============================================================================
// USER ACTIVATE/DEACTIVATE - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'User ID to activate/deactivate',
    },
    activate: {
      type: 'boolean',
      default: true,
      description: 'true to activate, false to deactivate',
    },
  },
  required: ['id'],
  additionalProperties: false,
});
