// =============================================================================
// DEPARTMENT ROLE TEMPLATE UPDATE SCHEMA
// =============================================================================

async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'Department role template ID',
    },
    code: {
      type: 'string',
      minLength: 1,
      maxLength: 50,
      description: 'Template code',
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
  required: ['id'],
})
