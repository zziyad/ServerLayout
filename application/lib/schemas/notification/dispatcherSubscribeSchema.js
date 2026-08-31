// =============================================================================
// NOTIFICATION DISPATCHER SUBSCRIBE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for subscribing to Web Push notifications for dispatcher portal
// Based on PushSubscription table structure
//
// Required fields:
// - endpoint: Push service endpoint URL
// - keys: Object with p256dh and auth keys
// - event_id: Event ID (UUID)
// - point: Point identifier (A or B)
//
// Optional fields:
// - userAgent: User agent string
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  required: ['endpoint', 'keys', 'event_id', 'point'],
  properties: {
    endpoint: {
      type: 'string',
      format: 'uri',
      minLength: 1,
      description: 'Push service endpoint URL',
    },
    keys: {
      type: 'object',
      additionalProperties: false,
      required: ['p256dh', 'auth'],
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
      description: 'Push subscription keys',
    },
    userAgent: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'User agent string (optional)',
    },
    event_id: {
      type: 'string',
      format: 'uuid',
      description: 'Event ID (UUID)',
    },
    point: {
      type: 'string',
      enum: ['A', 'B'],
      description: 'Point identifier (A or B)',
    },
  },
});
