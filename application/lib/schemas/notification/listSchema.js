// =============================================================================
// NOTIFICATION LIST SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for listing notifications
// Based on NotificationLog table structure
//
// Optional fields (all filters are optional):
// - recipientType: Filter by recipient type ('user', 'driver', 'guest')
// - recipientId: Filter by recipient ID (UUID)
// - channel: Filter by channel ('email', 'sms', 'push')
// - status: Filter by status ('pending', 'sent', 'delivered', 'failed', 'bounced')
// - notificationType: Filter by notification type
// - limit: Number of records per page (1-1000, default: 50)
// - offset: Offset for pagination (default: 0)
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    recipientType: {
      type: ['string', 'null'],
      enum: ['user', 'driver', 'guest', null],
      description: 'Filter by recipient type',
    },
    recipientId: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Filter by recipient ID (UUID)',
    },
    channel: {
      type: ['string', 'null'],
      enum: ['email', 'sms', 'push', 'in_app', null],
      description: 'Filter by channel',
    },
    status: {
      type: ['string', 'null'],
      enum: ['pending', 'sent', 'delivered', 'failed', 'bounced', null],
      description: 'Filter by status',
    },
    notificationType: {
      type: ['string', 'null'],
      minLength: 1,
      maxLength: 100,
      description: 'Filter by notification type',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      default: 50,
      description: 'Number of records per page',
    },
    offset: {
      type: 'integer',
      minimum: 0,
      default: 0,
      description: 'Offset for pagination',
    },
  },
  required: [],
});
