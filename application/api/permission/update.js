({
  access: 'permission.update',
  method: async (payload) => {
    const schema = await lib.schemas.permission.updateSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;
    try {
      const res = await domain.permission.update(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('permission/update error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to update permission',
      };
    }
  },
});
