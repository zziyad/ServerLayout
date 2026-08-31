({
  access: 'public',
  method: async (payload = {}) => {
    try {
      const cookies = context.client.getCookies?.() || {};
      const sessionId =
        cookies['session_id'] ||
        context.client.session?.sessionId ||
        context.client.session?.token;
      let userId =
        context.client.session?.state?.auth?.user_id ||
        context.client.session?.state?.id ||
        context.client.session?.state?.user_id ||
        null;
      const destroyAll = payload?.destroy_all === true;

      if (!userId && sessionId) {
        try {
          const session = await context.client.validateSession(sessionId);
          if (session) {
            userId = session.auth?.user_id || session.id || null;
          }
        } catch {}
      }

      if (userId && destroyAll) {
        try {
          await context.client.destroyAllUserSessions(userId);
        } catch {}
      } else if (sessionId) {
        try {
          await context.client.sessionManager.destroySession(sessionId);
        } catch {}
      }

      try {
        context.client.clearSessionCookies();
      } catch {}

      return { status: 'fulfilled', response: 'User has been signed out' };
    } catch (error) {
      try {
        context.client.clearSessionCookies();
      } catch {}
      return { status: 'fulfilled', response: 'User has been signed out' };
    }
  },
});
