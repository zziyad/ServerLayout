// =============================================================================
// USER LIST - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    page: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      default: 1,
      description: 'Page number for pagination',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Items per page',
    },
    search: {
      type: 'string',
      maxLength: 255,
      description: 'Search in email, username, first_name, last_name',
    },
    department: {
      type: 'string',
      maxLength: 100,
      description:
        'Filter by department code or department UUID (Department.id)',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description:
        'When set, only users belonging to this Gate Pass tenant are returned',
    },
    status: {
      type: 'string',
      enum: ['active', 'inactive', 'deleted', ''],
      description: 'Filter by status',
    },
    role: {
      type: 'string',
      maxLength: 100,
      description: 'Filter by role name',
    },
    account_scope: {
      type: 'string',
      enum: ['all', 'system', 'imported'],
      description:
        'Filter by account status bucket: system excludes imported users, imported includes only imported users',
    },
  },
  required: [],
  additionalProperties: false,
});
