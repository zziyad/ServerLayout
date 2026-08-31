async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    userId: { type: 'string', format: 'uuid' },
    permissionId: { type: 'string', format: 'uuid' },
    isGranted: { type: 'boolean', default: true },
    reason: { type: ['string', 'null'], maxLength: 500 },
    expiresAt: { type: ['string', 'null'], format: 'date-time' },
  },
  required: ['userId', 'permissionId'],
});
