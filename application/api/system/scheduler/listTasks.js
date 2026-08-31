({
  access: 'private',
  method: async () => {
    try {
      const tasks = application.scheduler?.list?.() || [];
      return { status: 'fulfilled', response: { tasks } };
    } catch (err) {
      console.error('system/scheduler/listTasks error:', err);
      return {
        status: 'rejected',
        response: 'scheduler listTasks failed',
        error: { message: err.message },
      };
    }
  },
});
