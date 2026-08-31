// =============================================================================
// DEPARTMENT ROLE TEMPLATE DELETE SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Department role template ID',
    },
  },
  required: ['id'],
})
