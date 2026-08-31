// =============================================================================
// DEPARTMENT GET STRUCTURE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for getting department structure with roles and user counts
//
// Optional fields:
// - include_inactive: Include inactive departments (default: false)
// - include_deleted: Include deleted departments (default: false)
// - event_id: Event ID (UUID) - if provided, also counts EventStaff for this event
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    include_inactive: {
      type: 'boolean',
      description: 'Include inactive departments (default: false)',
    },
    include_deleted: {
      type: 'boolean',
      description: 'Include deleted departments (default: false)',
    },
    event_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description:
        'Event ID (UUID) - if provided, also counts EventStaff for this event',
    },
    eventId: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Event ID (UUID) - alternative name',
    },
  },
  required: [],
});
