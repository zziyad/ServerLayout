({
  access: 'private', // Requires authentication
  method: async (payload) => {
    // 1. JSON SCHEMA VALIDATION: Валидация в самом начале
    const schema = await lib.schemas.notification.sendSchema();
    const validation = await common.validateSchema(payload, schema);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }
    const validatedData = validation.data;

    // 2. Additional validation: Check that required contact methods are provided for requested channels
    if (
      validatedData.channels.includes('email') &&
      !validatedData.recipientEmail
    ) {
      throw new Error('Email channel requested but recipientEmail is missing');
    }
    if (
      validatedData.channels.includes('sms') &&
      !validatedData.recipientPhone
    ) {
      throw new Error('SMS channel requested but recipientPhone is missing');
    }
    if (
      validatedData.channels.includes('push') &&
      !validatedData.recipientPushToken
    ) {
      throw new Error(
        'Push channel requested but recipientPushToken is missing',
      );
    }

    // 3. DOMAIN: Вызов доменной функции с валидированными данными
    try {
      const res = await domain.notification.send(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('notification/send error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to send notification',
      };
    }
  },
});
