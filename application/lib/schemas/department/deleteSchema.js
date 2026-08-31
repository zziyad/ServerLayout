// =============================================================================
// DEPARTMENT DELETE SCHEMA - JSON Schema
// =============================================================================
//
// Validates input for delete department
// Based on Department table structure
//
// Required fields:
// - id: Department ID (UUID)
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
  },
  required: ['id'],
});
