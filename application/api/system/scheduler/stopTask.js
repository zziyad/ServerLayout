({
  access: 'private',
  method: async (payload) => {
    try {
      const task = application.scheduler.stopTask(payload?.name);
      return { status: 'fulfilled', response: { task } };
    } catch (err) {
      console.error('system/scheduler/stopTask error:', err);
      return {
        status: 'rejected',
        response: 'scheduler stopTask failed',
        error: { message: err.message },
      };
    }
  },
});
