({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'update',
        lib,
      );
      const user = await domain.user.update(validatedData, context);

      return {
        status: 'fulfilled',
        response: {
          message: 'User updated successfully',
          user: user,
        },
      };
    } catch (error) {
      console.error('user/update error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to update user',
      };
    }
  },
});
