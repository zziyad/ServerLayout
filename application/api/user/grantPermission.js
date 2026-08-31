({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'grantPermission',
        lib,
      );
      const data = await domain.user.grantPermission(validatedData, context);
      return { status: 'fulfilled', response: data };
    } catch (err) {
      console.error('user/grantPermission error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to grant permission',
      };
    }
  },
});
