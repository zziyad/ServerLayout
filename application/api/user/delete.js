({
  access: 'user.delete',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'delete',
        lib,
      );
      const result = await domain.user.delete(validatedData.id);

      return {
        status: 'fulfilled',
        response: result,
      };
    } catch (error) {
      console.error('user/delete error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to delete user',
      };
    }
  },
});
