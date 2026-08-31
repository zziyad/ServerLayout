({
  access: 'user.read',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'list',
        lib,
      );
      const users = await domain.user.list(validatedData);
      return {
        status: 'fulfilled',
        response: users,
      };
    } catch (error) {
      console.error('user/list error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch users',
      };
    }
  },
});
