({
  access: 'private',
  method: async (payload) => {
    try {
      const res = await domain.notification.sendTestEmail(payload || {}, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('notification/sendTestEmail error:', err);
      return { status: 'rejected', response: err.message || 'Failed to queue test email' };
    }
  },
});
