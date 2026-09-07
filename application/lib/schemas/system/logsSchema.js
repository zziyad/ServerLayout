// =============================================================================
// SYSTEM LOGS SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    lines: {
      type: 'integer',
      minimum: 1,
      maximum: 500,
      default: 200,
      description: 'How many trailing lines to return',
    },
    date: {
      type: 'string',
      pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
      description: 'Log file date YYYY-MM-DD. Default: today',
    },
  },
  required: [],
});
