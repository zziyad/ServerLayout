async () => ({
  type: 'object',
  additionalProperties: false,
  properties: {
    userId: { type: 'string', format: 'uuid' },
    permissionId: { type: 'string', format: 'uuid' },
  },
  required: ['userId', 'permissionId'],
});
