({
  access: 'user.assign_roles',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'changeRole',
        lib,
      );
      const sessionState = context.client.session?.state;
      const changedBy =
        sessionState?.id || sessionState?.auth?.user_id || null;
      const result = await domain.user.changeRole({
        ...validatedData,
        changedBy,
      });

      return {
        status: 'fulfilled',
        response: result,
      };
    } catch (error) {
      console.error('user/changeRole error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to change user role',
      };
    }
  },
});
