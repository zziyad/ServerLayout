// =============================================================================
// USER CHANGE ROLE - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    userId: {
      type: 'string',
      format: 'uuid',
      description: 'User ID to change role',
    },
    roleId: {
      type: 'string',
      format: 'uuid',
      description: 'Role ID to assign or remove',
    },
    action: {
      type: 'string',
      enum: ['assign', 'remove'],
      default: 'assign',
      description: 'Action: assign or remove role',
    },
  },
  required: ['userId', 'roleId'],
  additionalProperties: false,
});
