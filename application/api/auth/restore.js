({
  access: 'public',
  method: async ({ token }) => {
    const { serializeErrorResponse } = lib.errors

    if (!token || typeof token !== 'string' || !token.trim()) {
      return {
        status: 'rejected',
        response: 'Session token is required',
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Missing restore session token',
          details: {},
          severity: 'error',
        },
      }
    }

    try {
      const restored = context.client.restoreSession(token)
      if (restored) {
        return { status: 'fulfilled', response: null }
      }

      const data = await api.auth.provider.restoreSession(token)
      if (!data) {
        return {
          status: 'rejected',
          response: 'Session expired. Please sign in again.',
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Restore session returned no data',
            details: {},
            severity: 'error',
          },
        }
      }

      context.client.startSession(token, data)
      return { status: 'fulfilled', response: null }
    } catch (err) {
      const { response, error } = serializeErrorResponse(
        err,
        'Could not restore session',
      )
      return {
        status: 'rejected',
        response: error?.user_message || response,
        error,
      }
    }
  },
});
