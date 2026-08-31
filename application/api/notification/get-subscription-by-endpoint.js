({
  access: 'public',
  method: async (payload) => {
    const { endpoint } = payload;

    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Endpoint is required');
    }

    try {
      const subscription =
        await lib.repository.notification.getSubscriptionByEndpoint(endpoint);
      return { status: 'fulfilled', response: subscription };
    } catch (err) {
      console.error('notification/get-subscription-by-endpoint error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to get subscription',
      };
    }
  },
});
