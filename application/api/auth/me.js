({
  access: 'public', // This endpoint requires authentication
  method: async () => {
    try {
      // Get session data (canonical or legacy format)
      const session = context.client.session?.state;

      if (!session) {
        return {
          status: 'fulfilled',
          response: null,
        };
      }

      // Support both canonical session model and legacy format
      // Canonical: session.auth.user_id, session.auth.roles, session.auth.permissions
      // Legacy: session.id, session.roles, session.permissions
      const userId = session.auth?.user_id || session.id;

      if (!userId) {
        return {
          status: 'rejected',
          response: 'Authentication is required',
          error: {
            code: 'AUTH_REQUIRED',
            message: 'No user ID found in session',
            details: {},
            severity: 'error',
          },
        };
      }

      // Get user data from database (session only stores snapshot)
      // Use domain layer to get user (proper way to access database)
      const user = await domain.user.getById(userId);
      if (!user) {
        return {
          status: 'rejected',
          response: 'Session expired. Please sign in again.',
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Session user not found',
            details: { user_id: userId },
            severity: 'error',
          },
        };
      }

      // Department and department_role: getById already populates these from department_role_assignment_id
      const department = user.department || null;
      const department_role = user.department_role || null;

      // Always fetch fresh roles + permissions from DB so changes made after
      // login (e.g. super_admin promotion) take effect without re-login.
      // Session snapshot is kept in sync below.
      const sessionRoles = session.auth?.roles || session.roles || [];
      const sessionPermissions =
        session.auth?.permissions || session.permissions || [];

      let roles = sessionRoles;
      let permissions = sessionPermissions;
      try {
        const freshRoleRows = await lib.provider.getUserRoles(userId);
        const freshPermissionRows = await lib.provider.getUserPermissions(
          userId,
        );
        roles = freshRoleRows.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          description: r.description,
        }));
        permissions = freshPermissionRows.map(
          (p) => `${p.resource}.${p.action}`,
        );

        // Persist refreshed snapshot back into the session so downstream
        // middleware that reads session.auth.roles/permissions stays correct.
        if (session.auth) {
          session.auth.roles = roles;
          session.auth.permissions = permissions;
        } else {
          session.roles = roles;
          session.permissions = permissions;
        }
      } catch (refreshError) {
        console.error('me: failed to refresh roles/permissions', refreshError);
      }

      // Get CSRF token from session (needed for state-changing operations)
      const csrfToken =
        session.security?.csrf_token ||
        context.client.session?.csrfToken ||
        null;

      // Get session timing metadata (for frontend UX - not secrets)
      const sessionManager = context.client.sessionManager;
      const now = Date.now();
      const expiresAt = new Date(session.meta?.expires_at || 0).getTime();
      const lastSeenAt = new Date(session.meta?.last_seen_at || 0).getTime();

      // Calculate remaining idle time (based on last_seen_at + idleTtl)
      const idleAge = now - lastSeenAt;
      const idleTimeoutSeconds = sessionManager.idleTtl;
      const idleRemainingSeconds = Math.max(
        0,
        idleTimeoutSeconds - Math.floor(idleAge / 1000),
      );

      // Calculate idle expiry time (when session will expire due to inactivity)
      // This is last_seen_at + idleTtl, not the absolute expires_at
      const idleExpiresAt = new Date(
        lastSeenAt + idleTimeoutSeconds * 1000,
      ).toISOString();

      // Calculate remaining absolute time
      const absoluteRemainingSeconds = Math.max(
        0,
        Math.floor((expiresAt - now) / 1000),
      );

      // Return user information (excluding sensitive data)
      // This is a snapshot for frontend UI rendering - backend validates permissions on every API call
      const userInfo = {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.display_name,
        department,
        department_role,
        position: user.position,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        roles, // From session (backend is the authority)
        permissions, // From session (backend is the authority)
        csrfToken, // CSRF token for state-changing operations
        // Session timing metadata (for UX - not secrets)
        session: {
          expires_at: idleExpiresAt, // When session expires due to idle timeout (last_seen_at + idleTtl)
          idle_timeout_seconds: idleTimeoutSeconds, // Idle timeout duration
          idle_remaining_seconds: idleRemainingSeconds, // Remaining idle time (calculated)
          absolute_expires_at: session.meta?.expires_at || null, // Absolute expiry (24h from creation)
          absolute_remaining_seconds: absoluteRemainingSeconds, // Remaining absolute time
        },
      };

      // console.log({ userInfo,role: userInfo.roles });

      return {
        status: 'fulfilled',
        response: userInfo,
      };
    } catch (error) {
      console.error('Me endpoint error:', error);
      return {
        status: 'rejected',
        response: 'Server error occurred',
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Unhandled auth/me error',
          details: {},
          severity: 'error',
        },
      };
    }
  },
});
