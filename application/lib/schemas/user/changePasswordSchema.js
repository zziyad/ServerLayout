// =============================================================================
// USER CHANGE PASSWORD - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'User ID to change password',
    },
    new_password: {
      type: 'string',
      minLength: 6,
      maxLength: 128,
      description: 'New password (minimum 6 characters)',
    },
  },
  required: ['id', 'new_password'],
  additionalProperties: false,
});
