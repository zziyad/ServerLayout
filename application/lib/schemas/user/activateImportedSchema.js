// =============================================================================
// USER ACTIVATE IMPORTED - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    user_id: {
      type: 'string',
      format: 'uuid',
      description: 'Imported user ID to activate',
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      description: 'New login email for activated account',
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      description: 'New account password',
    },
    username: {
      type: ['string', 'null'],
      minLength: 3,
      maxLength: 64,
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Optional username for login',
    },
    role_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Optional global role to assign',
    },
    department_role_assignment_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Optional department role assignment',
    },
  },
  required: ['user_id', 'email', 'password'],
  additionalProperties: false,
});
