// =============================================================================
// NOTIFICATION SEND SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for sending notifications via Email/SMS/Push
//
// Required fields:
// - type: Notification type (e.g., 'fleet_updated', 'route_assigned')
// - recipientType: Type of recipient ('user', 'driver', 'guest')
// - recipientId: Recipient ID (UUID)
// - channels: Array of channels to use (['email'], ['sms'], ['push'], or combinations)
// - subject: Notification subject/title
// - message: Notification message body
//
// Optional fields:
// - recipientEmail: Email address (required if 'email' in channels)
// - recipientPhone: Phone number (required if 'sms' in channels)
// - recipientPushToken: Push token (required if 'push' in channels)
// - html: HTML content for email (optional)
// - data: Additional data for push notifications (optional)
// - metadata: Additional metadata (optional)
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
      description: 'Notification type (e.g., fleet_updated, route_assigned)',
    },
    recipientType: {
      type: 'string',
      enum: ['user', 'driver', 'guest'],
      description: 'Type of recipient',
    },
    recipientId: {
      type: 'string',
      format: 'uuid',
      description: 'Recipient ID (UUID)',
    },
    recipientEmail: {
      type: ['string', 'null'],
      format: 'email',
      description:
        'Recipient email address (required if email channel is used)',
    },
    recipientPhone: {
      type: ['string', 'null'],
      pattern: '^\\+?[1-9]\\d{1,14}$',
      description:
        'Recipient phone number in E.164 format (required if sms channel is used)',
    },
    recipientPushToken: {
      type: ['string', 'null'],
      minLength: 1,
      description: 'Recipient push token (required if push channel is used)',
    },
    channels: {
      type: 'array',
      items: {
        type: 'string',
        enum: ['email', 'sms', 'push'],
      },
      minItems: 1,
      uniqueItems: true,
      description: 'Array of notification channels to use',
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
    html: {
      type: ['string', 'null'],
      maxLength: 50000,
      description: 'HTML content for email notifications (optional)',
    },
    data: {
      type: 'object',
      additionalProperties: true,
      description: 'Additional data for push notifications (optional)',
    },
    metadata: {
      type: 'object',
      additionalProperties: true,
      description: 'Additional metadata (optional)',
    },
  },
  required: [
    'type',
    'recipientType',
    'recipientId',
    'channels',
    'subject',
    'message',
  ],
});
