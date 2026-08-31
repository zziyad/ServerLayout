({
  access: 'private', // User can only access their own preferences
  method: async () => {
    try {
      await common.validateEndpoint(payload || {}, 'user', 'getPreferences', lib);
      const sessionData = context.client.session?.state;
      if (!sessionData?.id) {
        return {
          status: 'rejected',
          response: 'Unauthorized',
        };
      }

      const preferences = await domain.user.getPreferences(sessionData.id);

      return {
        status: 'fulfilled',
        response: preferences,
      };
    } catch (error) {
      console.error('user/getPreferences error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch preferences',
      };
    }
  },
});
