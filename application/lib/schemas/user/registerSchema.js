// =============================================================================
// USER REGISTER - JSON Schema
// =============================================================================

async () => ({
  type: 'object',
  properties: {
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
      type: 'string',
      minLength: 6,
      maxLength: 128,
      description: 'Password (minimum 6 characters)',
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
    display_name: {
      type: ['string', 'null'],
      maxLength: 150,
      description: 'Display name',
    },
    phone: {
      anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }],
      description: 'Phone number',
    },
    department_role_assignment_id: {
      type: ['string', 'null'],
      format: 'uuid',
      description:
        'Department role assignment ID (UUID). This is the ONLY way to define department roles - references DepartmentRoleAssignment which links Department + DepartmentRole template.',
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
      description:
        'Corporate card id for kiosk identification (nullable; unique among active users per DB)',
    },
    hire_date: {
      type: ['string', 'null'],
      format: 'date',
      description: 'Hire date (YYYY-MM-DD)',
    },
    tenant_id: {
      anyOf: [{ type: 'string', format: 'uuid' }, { type: 'null' }],
      description:
        'Tenant for this user (falls back to first active tenant when omitted)',
    },
  },
  required: ['email', 'password', 'first_name', 'last_name'],
  additionalProperties: false,
});
