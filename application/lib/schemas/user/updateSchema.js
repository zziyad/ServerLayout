// =============================================================================
// USER UPDATE - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
    id: {
      type: 'string',
      format: 'uuid',
      description: 'User ID to update',
    },
    first_name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: "^[a-zA-Z\\s'-]+$",
      description: 'First name',
    },
    last_name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: "^[a-zA-Z\\s'-]+$",
      description: 'Last name',
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      description: 'Email address',
    },
    username: {
      type: ['string', 'null'],
      minLength: 3,
      maxLength: 64,
      pattern: '^[a-zA-Z0-9_-]+$',
      description: 'Username',
    },
    password: {
      anyOf: [
        { type: 'string', minLength: 6, maxLength: 128 },
        { type: 'null' },
      ],
      description:
        'Password (optional in update, minimum 6 characters if provided)',
    },
    phone: {
      anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }],
      description: 'Phone number',
    },
    department: {
      type: ['string', 'null'],
      maxLength: 100,
      description: 'Department code (backward compatibility)',
    },
    department_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Department ID (UUID)',
    },
    department_role: {
      type: ['string', 'null'],
      description: 'Department role code (backward compatibility)',
    },
    department_role_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description: 'Department role assignment ID (UUID)',
    },
    position: {
      type: ['string', 'null'],
      maxLength: 100,
      description: 'Job position',
    },
    employee_id: {
      type: ['string', 'null'],
      maxLength: 50,
      description: 'Employee ID',
    },
    corporate_card_id: {
      type: ['string', 'null'],
      maxLength: 100,
      description: 'Corporate card id for kiosk identification (nullable)',
    },
    profile_picture: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Profile picture URL',
    },
    avatar_url: {
      type: ['string', 'null'],
      maxLength: 500,
      description: 'Avatar URL',
    },
    hire_date: {
      anyOf: [
        { type: 'string', format: 'date' },
        { type: 'null' },
        { type: 'string', pattern: '^$' }, // Allow empty string
      ],
      description: 'Hire date (YYYY-MM-DD or empty)',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description: 'Gate Pass tenant this user belongs to',
    },
  },
  required: ['id'],
  additionalProperties: false,
});
