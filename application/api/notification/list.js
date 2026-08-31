({
  access: 'private', // Requires authentication
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале
    const schema = await lib.schemas.notification.listSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;

    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.notification.list(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('notification/list error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to list notifications',
      };
    }
  },
});
