({
  access: 'user.read',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'listDirectPermissions',
        lib,
      );
      const list = await domain.user.listDirectPermissions(
        validatedData.userId,
      );
      return { status: 'fulfilled', response: list };
    } catch (err) {
      console.error('user/listDirectPermissions error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to list user permissions',
      };
    }
  },
});
