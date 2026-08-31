// =============================================================================
// NOTIFICATION UPDATE PREFERENCES SCHEMA - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    endpoint: {
      type: 'string',
      format: 'uri',
      description: 'Push service endpoint URL',
    },
    notificationPreferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fleet: { type: 'boolean' },
        driver: { type: 'boolean' },
        shuttle: { type: 'boolean' },
        guest: { type: 'boolean' },
        route: { type: 'boolean' },
        incident: { type: 'boolean' },
      },
      description: 'Notification category preferences',
    },
  },
  required: ['endpoint', 'notificationPreferences'],
});
