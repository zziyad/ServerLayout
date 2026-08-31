// =============================================================================
// USER DELETE - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'User ID to delete',
    },
  },
  required: ['id'],
  additionalProperties: false,
});
