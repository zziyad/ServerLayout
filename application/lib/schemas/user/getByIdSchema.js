// =============================================================================
// USER GET BY ID - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'User UUID',
    },
  },
  required: ['id'],
  additionalProperties: false,
});
