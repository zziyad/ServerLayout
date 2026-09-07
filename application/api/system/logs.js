({
  access: 'private',
  method: async (payload) => {
    const validatedData = await common.validateEndpoint(
      payload,
      'system',
      'logs',
      lib,
    );
    try {
      const res = await domain.system.logs(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('system/logs error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to read logs',
      };
    }
  },
});
