({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'activate',
        lib,
      );
      const sessionUserId = context.client.session?.state?.id;
      const result = await domain.user.activate({
        ...validatedData,
        sessionUserId,
      });

      return {
        status: 'fulfilled',
        response: result,
      };
    } catch (error) {
      console.error('user/activate error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to update user status',
      };
    }
  },
});
