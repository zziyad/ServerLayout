({
  access: 'public',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале
    const schema = await lib.schemas.notification.dispatcherUnsubscribeSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;

    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      await domain.notification.dispatcherUnsubscribe(validatedData, context);
      return { status: 'fulfilled', response: { success: true } };
    } catch (err) {
      console.error('notification/dispatcher-unsubscribe error:', err);
      return {
        status: 'rejected',
        response:
          err.message || 'Failed to unsubscribe from push notifications',
      };
    }
  },
});
