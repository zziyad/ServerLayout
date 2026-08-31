/**
 * @deprecated REMOVED - This endpoint is no longer needed.
 *
 * User sessions now use session-based authentication with explicit keep-alive.
 * Sessions do NOT auto-extend - they only extend via explicit user-initiated keep-alive.
 *
 * This endpoint returns an error to inform clients to use the new session model.
 */
({
  access: 'public',
  method: async () => {
    return {
      status: 'rejected',
      response:
        'This endpoint has been removed. Use /auth/keep-alive to extend active sessions.',
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Deprecated endpoint auth/refresh was called',
        details: {
          oldEndpoint: '/api/auth/refresh',
          newEndpoint: '/api/auth/keep-alive',
          note: 'Sessions do not auto-extend. Keep-alive is explicit.',
        },
        severity: 'error',
      },
    }
  },
});
