({
  access: 'department.update',
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале
    const schema = await lib.schemas.department.updateSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;

    // 2. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.department.update(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('department/update error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to update department',
      };
    }
  },
});
