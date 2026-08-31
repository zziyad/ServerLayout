// =============================================================================
// DEPARTMENT UPDATE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for update department
// Based on Department table structure
//
// Required fields:
// - id: Department ID (UUID)
//
// Optional fields:
// - code: Unique department code
// - name: Department name
// - display_name: Display name for UI
// - description: Department description
// - is_active: Active status
//
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Department ID (UUID)',
    },
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
      description: 'Active status',
    },
  },
  required: ['id'],
});
