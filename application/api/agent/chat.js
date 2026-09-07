({
  access: 'private',
  method: async (payload) => {
    const validatedData = await common.validateEndpoint(
      payload,
      'agent',
      'chat',
      lib,
    );
    try {
      const res = await domain.agent.chat(validatedData, context);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('agent/chat error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Agent failed',
        error: {
          code: err.code || 'AGENT_ERROR',
          message: err.message || 'Agent failed',
          details: err.trace ? { trace: err.trace } : {},
          severity: 'error',
        },
      };
    }
  },
});
