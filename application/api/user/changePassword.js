({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'changePassword',
        lib,
      );
      const user = await domain.user.changePassword(validatedData);

      return {
        status: 'fulfilled',
        response: {
          message: 'Password changed successfully',
          user: user,
        },
      };
    } catch (error) {
      console.error('user/changePassword error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to change password',
      };
    }
  },
});
