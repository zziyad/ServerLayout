({
  access: 'user.update',
  method: async (payload) => {
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'activateImported',
        lib,
      );
      const sessionState = context.client.session?.state;
      const sessionUserId = sessionState?.id || sessionState?.auth?.user_id || null;
      const user = await domain.user.activateImportedUser({
        ...validatedData,
        sessionUserId,
      });

      return {
        status: 'fulfilled',
        response: {
          message: 'Imported user activated successfully',
          user,
        },
      };
    } catch (error) {
      console.error('user/activateImported error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to activate imported user',
      };
    }
  },
});
