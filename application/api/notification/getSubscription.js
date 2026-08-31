// =============================================================================
// NOTIFICATION GET SUBSCRIPTION API - Get current subscription with preferences
// =============================================================================

({
  access: 'private', // Requires authentication
  method: async (payload) => {
    try {
      const userId = context?.client?.session?.state?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get user's active subscriptions
      const subscriptions =
        await lib.repository.notification.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        return { status: 'fulfilled', response: null };
      }

      // Return the most recent subscription (or all if needed)
      const subscription = subscriptions[0];

      return {
        status: 'fulfilled',
        response: {
          endpoint: subscription.endpoint,
          notification_preferences: subscription.notification_preferences || {
            fleet: true,
            driver: true,
            shuttle: true,
            guest: true,
            route: true,
            incident: true,
          },
        },
      };
    } catch (err) {
      console.error('notification/getSubscription error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to get subscription',
      };
    }
  },
});
