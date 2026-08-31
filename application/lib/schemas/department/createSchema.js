// =============================================================================
// DEPARTMENT CREATE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for create department
// Based on Department table structure
//
// Required fields:
// - code: Unique department code (e.g., 'airport', 'hotel', 'venue')
// - name: Department name
// - display_name: Display name for UI
//
// Optional fields:
// - description: Department description
// - is_active: Active status (default: true)
// - event_id: Event ID (UUID) - if provided, department is event-specific; if null, department is global/shared
// - auto_create_roles_from_templates: Auto-create role assignments from templates (default: true)
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      pattern: '^[a-z0-9_]+$',
      description:
        'Unique department code (lowercase, alphanumeric, underscores only)',
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Department name',
    },
    display_name: {
      type: 'string',
      minLength: 1,
      maxLength: 150,
      description: 'Display name for UI',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 10000,
      description: 'Department description',
    },
    is_active: {
      type: 'boolean',
      description: 'Active status (default: true)',
    },
    event_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description:
        'Event ID (UUID) - if provided, department is event-specific; if null, department is global/shared',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description:
        'Gate Pass tenant this department belongs to (falls back to first active tenant when omitted)',
    },
    auto_create_roles_from_templates: {
      type: 'boolean',
      description:
        'Auto-create role assignments from templates (default: true)',
    },
  },
  required: ['code', 'name', 'display_name'],
});
