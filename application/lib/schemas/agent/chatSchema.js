// =============================================================================
// AGENT CHAT SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 8000,
      description: 'User text for this turn',
    },
    messages: {
      type: 'array',
      maxItems: 40,
      description: 'Optional prior turns (user/assistant/tool)',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          role: {
            type: 'string',
            enum: ['user', 'assistant', 'tool'],
          },
          content: {
            type: 'string',
            maxLength: 16000,
          },
          tool_call_id: {
            type: 'string',
            maxLength: 128,
          },
        },
        required: ['role', 'content'],
      },
    },
  },
  anyOf: [{ required: ['message'] }, { required: ['messages'] }],
});
