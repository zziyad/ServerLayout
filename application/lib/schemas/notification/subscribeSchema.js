// =============================================================================
// NOTIFICATION SUBSCRIBE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for subscribing to Web Push notifications
//
// Required fields:
// - endpoint: Push service endpoint URL
// - keys: Object with p256dh and auth keys
//
// Optional fields:
// - userAgent: User agent string
//
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
    keys: {
      type: 'object',
      additionalProperties: false,
      properties: {
        p256dh: {
          type: 'string',
          minLength: 1,
          description: 'P256DH public key (base64)',
        },
        auth: {
          type: 'string',
          minLength: 1,
          description: 'Auth secret (base64)',
        },
      },
      required: ['p256dh', 'auth'],
      description: 'Push subscription keys',
    },
    userAgent: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'User agent string (optional)',
    },
    notificationPreferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        fleet: { type: 'boolean', default: true },
        driver: { type: 'boolean', default: true },
        shuttle: { type: 'boolean', default: true },
        guest: { type: 'boolean', default: true },
        route: { type: 'boolean', default: true },
        incident: { type: 'boolean', default: true },
      },
      description:
        'Notification category preferences (optional, defaults to all enabled)',
    },
  },
  required: ['endpoint', 'keys'],
});
