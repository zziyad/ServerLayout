({
  access: 'private',
  method: async (payload) => {
    try {
      const res = await domain.notification.emailStatus(payload || {});
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('notification/emailStatus error:', err);
      return { status: 'rejected', response: err.message || 'Failed to load email status' };
    }
  },
});
