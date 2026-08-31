({
  access: 'public',
  method: async (payload) => {
    const { serializeErrorResponse } = lib.errors;

    const reject = (response, code, message = response, details = {}) => ({
      status: 'rejected',
      response,
      error: {
        code,
        message,
        details,
        severity: 'error',
      },
    });

    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'auth',
        'signin',
        lib,
      );

      const identifier = String(validatedData.email || '')
        .trim()
        .toLowerCase();
      try {
        const ip = context.client.ip;
        const ipRes = await context.client.checkSlidingLimit(
          'signin',
          'ip',
          ip,
          60,
          10,
        );
        if (!ipRes.allowed) {
          try {
            console.security('login-rate-limited', { ip, acct: identifier });
          } catch {}
          return reject(
            'Too many login attempts. Please try again shortly.',
            'SYSTEM_ERROR',
            'Rate limit exceeded for signin by IP',
            { reason: 'rate_limited_ip', retry_after_sec: ipRes.retryAfterSec },
          );
        }
        const acctRes = await context.client.checkSlidingLimit(
          'signin',
          'acct',
          identifier,
          60,
          5,
        );
        if (!acctRes.allowed) {
          try {
            console.security('login-rate-limited', { ip, acct: identifier });
          } catch {}
          return reject(
            'Too many login attempts. Please try again shortly.',
            'SYSTEM_ERROR',
            'Rate limit exceeded for signin account',
            {
              reason: 'rate_limited_account',
              retry_after_sec: acctRes.retryAfterSec,
            },
          );
        }
      } catch {}

      const userData = await domain.auth.signin(validatedData, context);
      const started = await context.client.startSession(userData, {
        createdBy: 'login',
        rotate: true,
        rotationReason: 'login',
        authLevel: 1,
      });
      if (!started) {
        try {
          console.security('login-failed', {
            email: identifier,
            identifier,
            ip: context.client.ip,
            reason: 'session-start',
          });
        } catch {}
        return reject(
          'Failed to create session',
          'SYSTEM_ERROR',
          'Failed to start session',
        );
      }

      try {
        console.security('login-success', {
          email: identifier,
          identifier,
          userId: userData.id,
          ip: context.client.ip,
        });
      } catch {}

      return { status: 'fulfilled', response: userData };
    } catch (err) {
      console.error('auth/signin error:', err);
      const { response, error } = serializeErrorResponse(
        err,
        'Server error occurred during login',
      );
      return { status: 'rejected', response, error };
    }
  },
});
