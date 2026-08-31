({
  access: 'public', // Public endpoint to get VAPID public key
  method: async () => {
    try {
      const pushConfig = config?.notifications?.push || {};
      const webPushConfig = pushConfig.webPush || {};

      if (!webPushConfig.publicKey) {
        return {
          status: 'rejected',
          response: 'Web Push public key is not configured',
        };
      }

      return {
        status: 'fulfilled',
        response: {
          publicKey: webPushConfig.publicKey,
        },
      };
    } catch (err) {
      console.error('notification/push-key error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Failed to get VAPID public key',
      };
    }
  },
});
