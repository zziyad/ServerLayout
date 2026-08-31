({
  access: 'private', // User can only update their own preferences
  method: async (payload) => {
    try {
      const sessionData = context.client.session?.state;
      if (!sessionData?.id) {
        return {
          status: 'rejected',
          response: 'Unauthorized',
        };
      }

      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'updatePreferences',
        lib,
      );
      const preferences = await domain.user.updatePreferences(
        sessionData.id,
        validatedData,
      );

      return {
        status: 'fulfilled',
        response: preferences,
      };
    } catch (error) {
      console.error('user/updatePreferences error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to update preferences',
      };
    }
  },
});
