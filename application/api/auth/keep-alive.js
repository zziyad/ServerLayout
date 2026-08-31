/**
 * Session Keep-Alive Endpoint
 *
 * ⚠️ CRITICAL: This is the ONLY way to extend sessions.
 * Sessions do NOT auto-extend - they only extend via explicit user action.
 *
 * Rules:
 * - Must be called explicitly by user (not background polling)
 * - Rotates session ID (mandatory)
 * - Extends idle TTL only if absolute TTL not expired
 * - Returns new session metadata
 */
({
  access: 'private', // Requires authentication (but we handle expired sessions gracefully)
  method: async () => {
    const reject = (response, code, message = response, details = {}) => ({
      status: 'rejected',
      response,
      error: {
        code,
        message,
        details: details && typeof details === 'object' ? details : {},
        severity: 'error',
      },
    })

    try {
      // Get session ID from cookie (may be expired)
      const sessionId =
        context.client.getCookies()?.['session_id'] ||
        context.client.session?.sessionId ||
        context.client.session?.token;

      if (!sessionId) {
        // No session ID - clear any stale cookies and return error
        context.client.clearSessionCookies();
        return {
          ...reject('No session found', 'AUTH_REQUIRED', 'Missing session cookie'),
        }
      }

      // Call sessionManager.keepAlive() which:
      // 1. Validates session exists
      // 2. Checks absolute TTL (hard limit)
      // 3. Checks idle TTL
      // 4. Rotates session ID (mandatory)
      // 5. Extends idle TTL
      // 6. Returns new session data
      const result = await context.client.sessionManager.keepAlive(sessionId);

      if (!result.success) {
        // Session cannot be extended (absolute TTL expired or idle TTL expired)
        if (result.error === 'absolute_ttl_reached') {
          // Destroy session and clear cookie
          await context.client.sessionManager.destroySession(sessionId);
          context.client.clearSessionCookies();

          return {
            ...reject(
              'Session has reached maximum lifetime. Please login again.',
              'SESSION_EXPIRED',
              'Absolute session TTL reached',
              { reason: 'absolute_ttl_reached' },
            ),
          }
        }

        if (result.error === 'idle_ttl_expired') {
          // Session already destroyed
          context.client.clearSessionCookies();

          return {
            ...reject(
              'Session has expired due to inactivity. Please login again.',
              'SESSION_EXPIRED',
              'Idle session TTL expired',
              { reason: 'idle_ttl_expired' },
            ),
          }
        }

        return reject(
          'Failed to extend session',
          'SYSTEM_ERROR',
          'Keep-alive failed',
          { reason: result.error || 'unknown' },
        )
      }

      // Session extended successfully - update cookie with new session ID
      const sm = context.client.sessionManager;
      context.client.sendSessionCookie(result.newSessionId, sm.sessionTtl);

      // Update client session - create Session object manually
      // Session class structure: { sessionId, state: sessionData }
      context.client.session = {
        sessionId: result.newSessionId,
        state: result.session,
        // Helper getters
        get user() {
          return {
            id: this.state.auth?.user_id,
            roles: this.state.auth?.roles || [],
            permissions: this.state.auth?.permissions || [],
          };
        },
        get csrfToken() {
          return this.state.security?.csrf_token;
        },
        get token() {
          return this.sessionId; // Backward compatibility
        },
      };

      // Update client session (Session class is available via context.client)
      // The session will be set automatically by the RPC handler after this returns

      // Calculate and return new session metadata
      const now = Date.now();
      const expiresAt = new Date(result.session.meta.expires_at).getTime();
      const absoluteRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt - now) / 1000),
      );

      return {
        status: 'fulfilled',
        response: {
          session: {
            expires_at: result.session.meta.expires_at,
            idle_timeout_seconds: context.client.sessionManager.idleTtl,
            idle_remaining_seconds: context.client.sessionManager.idleTtl, // Full idle TTL from now
            absolute_expires_at: result.session.meta.expires_at,
            absolute_remaining_seconds: absoluteRemainingSeconds,
          },
        },
      };
    } catch (error) {
      console.error('Keep-alive error:', error);
      return {
        ...reject(
          'Server error occurred during keep-alive',
          'SYSTEM_ERROR',
          'Unhandled keep-alive error',
        ),
      }
    }
  },
});
