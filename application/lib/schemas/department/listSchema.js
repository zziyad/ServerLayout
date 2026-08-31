// =============================================================================
// DEPARTMENT LIST SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for list departments
// Based on Department table structure
//
// Optional fields:
// - is_active: Filter by active status
// - include_deleted: Include deleted departments (default: false)
// - search: Search by code or name
// - limit: Limit results (default: 100)
// - offset: Offset for pagination (default: 0)
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    is_active: {
      type: ['boolean', 'null'],
      description: 'Filter by active status',
    },
    include_deleted: {
      type: 'boolean',
      description: 'Include deleted departments (default: false)',
    },
    search: {
      type: ['string', 'null'],
      minLength: 1,
      maxLength: 255,
      description: 'Search by code or name',
    },
    event_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description:
        'Event ID (UUID) - if provided, returns event-specific departments + global departments',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description:
        'When set, only departments for this Gate Pass tenant are returned',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      description: 'Limit results (default: 100)',
    },
    offset: {
      type: 'integer',
      minimum: 0,
      description: 'Offset for pagination (default: 0)',
    },
  },
  required: [],
});
