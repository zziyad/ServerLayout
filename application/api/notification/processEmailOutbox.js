({
  access: 'private',
  method: async (payload) => {
    try {
      const res = await domain.notification.processEmailOutbox(payload || {});
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('notification/processEmailOutbox error:', err);
      return { status: 'rejected', response: err.message || 'Failed to process email outbox' };
    }
  },
});
