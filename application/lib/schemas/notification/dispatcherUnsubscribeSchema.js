// =============================================================================
// NOTIFICATION DISPATCHER UNSUBSCRIBE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for unsubscribing from Web Push notifications for dispatcher portal
//
// Required fields:
// - endpoint: Push service endpoint URL
// - event_id: Event ID (UUID)
// - point: Point identifier (A or B)
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  required: ['endpoint', 'event_id', 'point'],
  properties: {
    endpoint: {
      type: 'string',
      format: 'uri',
      minLength: 1,
      description: 'Push service endpoint URL',
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
