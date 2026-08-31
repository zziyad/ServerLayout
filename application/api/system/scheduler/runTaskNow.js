({
  access: 'private',
  method: async (payload) => {
    try {
      const task = await application.scheduler.runNow(payload?.name);
      return { status: 'fulfilled', response: { task } };
    } catch (err) {
      console.error('system/scheduler/runTaskNow error:', err);
      return {
        status: 'rejected',
        response: 'scheduler runTaskNow failed',
        error: { message: err.message },
      };
    }
  },
});
