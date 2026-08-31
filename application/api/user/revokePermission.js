({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'revokePermission',
        lib,
      );
      const data = await domain.user.revokePermission(validatedData);
      return { status: 'fulfilled', response: data };
    } catch (err) {
      console.error('user/revokePermission error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to revoke permission',
      };
    }
  },
});
