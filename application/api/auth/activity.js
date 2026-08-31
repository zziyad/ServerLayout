/**
 * User Activity Endpoint
 *
 * Lightweight endpoint to extend session based on user activity.
 * This endpoint:
 * - Validates session (automatically extends via updateLastSeen)
 * - Does NOT return user data (unlike auth/me)
 * - Does NOT rotate session ID (unlike keep-alive)
 * - Can be called frequently by UI activity tracker
 *
 * This endpoint is NOT read-only, so it will trigger session extension
 * via the normal validateSession() flow.
 *
 * Made 'public' so it can be called even with expired sessions (graceful handling).
 * The session validation in validateSession() will still extend valid sessions.
 */
({
  access: 'public', // Public so it can handle expired sessions gracefully
  method: async () => {
    const { serializeErrorResponse } = lib.errors

    try {
      // Get session from context (may be null if expired)
      const session = context.client.session?.state;

      // If no session, return error (but not 401 - that's handled by RPC)
      if (!session) {
        return {
          status: 'rejected',
          response: 'No active session',
          error: {
            code: 'SESSION_EXPIRED',
            message: 'No active session in auth/activity',
            details: {
              extended: false,
            },
            severity: 'error',
          },
        }
      }

      // Session exists - validateSession() already extended it (if not read-only)
      // Just return success - session was extended automatically
      return {
        status: 'fulfilled',
        response: {
          extended: true,
          message: 'Session extended due to user activity',
        },
      }
    } catch (error) {
      console.error('Activity endpoint error:', error);
      const { response, error: serializedError } = serializeErrorResponse(
        error,
        'Failed to process activity',
      )
      return {
        status: 'rejected',
        response: serializedError?.user_message || response,
        error:
          serializedError ||
          {
            code: 'SYSTEM_ERROR',
            message: 'Unhandled auth/activity error',
            details: {
              extended: false,
            },
            severity: 'error',
          },
      }
    }
  },
});
