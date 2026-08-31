({
  access: 'private', // Requires authentication
  method: async (payload) => {
    const { endpoint } = payload;

    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Endpoint is required');
    }

    const userId = context?.client?.session?.state?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    try {
      await lib.repository.notification.unsubscribe({
        endpoint,
        user_id: userId,
      });

      return { status: 'fulfilled', response: { success: true } };
    } catch (err) {
      console.error('notification/unsubscribe error:', err);
      return {
        status: 'rejected',
        response:
          err.message || 'Failed to unsubscribe from push notifications',
      };
    }
  },
});
