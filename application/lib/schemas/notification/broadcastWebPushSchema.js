// =============================================================================
// NOTIFICATION BROADCAST WEB PUSH SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for broadcasting Web Push notifications to all users
// with active subscriptions
//
// Required fields:
// - type: Notification type (e.g., 'fleet_created', 'route_assigned')
// - subject: Notification subject/title
// - message: Notification message body
//
// Optional fields:
// - data: Additional data for push notifications (object)
// - metadata: Additional metadata (object)
// - batchSize: Number of users to process in each batch (default: 50)
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    type: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Notification type (e.g., fleet_created, route_assigned)',
    },
    subject: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Notification subject/title',
    },
    message: {
      type: 'string',
      minLength: 1,
      maxLength: 10000,
      description: 'Notification message body',
    },
    data: {
      type: 'object',
      additionalProperties: true,
      description: 'Additional data for push notifications (optional)',
      default: {},
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Additional metadata (optional)',
      default: {},
    },
    batchSize: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      description: 'Number of users to process in each batch (default: 50)',
      default: 50,
    },
  },
  required: ['type', 'subject', 'message'],
});
