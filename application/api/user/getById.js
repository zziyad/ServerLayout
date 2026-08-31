({
  access: 'user.read',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'getById',
        lib,
      );
      const user = await domain.user.getById(validatedData.id);

      if (!user) {
        return {
          status: 'rejected',
          response: 'User not found',
        };
      }

      return {
        status: 'fulfilled',
        response: user,
      };
    } catch (error) {
      console.error('user/getById error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch user',
      };
    }
  },
});
