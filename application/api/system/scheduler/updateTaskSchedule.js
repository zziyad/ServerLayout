({
  access: 'private',
  method: async (payload) => {
    try {
      const task = application.scheduler.updateSchedule(payload?.name, {
        intervalSeconds: payload?.interval_seconds,
        enabled: payload?.enabled,
      });
      return { status: 'fulfilled', response: { task } };
    } catch (err) {
      console.error('system/scheduler/updateTaskSchedule error:', err);
      return {
        status: 'rejected',
        response: 'scheduler updateTaskSchedule failed',
        error: { message: err.message },
      };
    }
  },
});
