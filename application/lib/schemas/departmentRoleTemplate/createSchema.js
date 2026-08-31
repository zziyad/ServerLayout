// =============================================================================
// DEPARTMENT ROLE TEMPLATE CREATE SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: 'Template code (global unique)',
    },
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'Template name',
    },
    display_name: {
      type: 'string',
      minLength: 1,
      maxLength: 150,
      description: 'Template display name',
    },
    description: {
      type: ['string', 'null'],
      maxLength: 1000,
      description: 'Template description',
    },
    is_active: {
      type: 'boolean',
      description: 'Is template active',
    },
  },
  required: ['code', 'name', 'display_name'],
})
