// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT LIST SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    department_id: {
      type: 'string',
      format: 'uuid',
      description: 'Department ID to get role assignments for',
    },
    status: {
      type: ['string', 'null'],
      enum: ['all', 'active', 'inactive', null],
      description: 'Filter by status',
    },
    page: {
      type: 'integer',
      minimum: 1,
      default: 1,
      description: 'Page number',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 50,
      description: 'Items per page',
    },
  },
  required: ['department_id'],
})
