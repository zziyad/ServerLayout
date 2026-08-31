({
  access: 'public',
  method: async (payload) => {
    const { serializeErrorResponse } = lib.errors;
    try {
      const validatedData = await common.validateEndpoint(
        payload,
        'user',
        'register',
        lib,
      );
      const user = await domain.user.create(validatedData, context);
      const roles = await lib.provider.getUserRoles(user.id);
      const permissions = await lib.provider.getUserPermissions(user.id);
      const userData = {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.display_name,
        is_active: user.is_active,
        roles: (roles || []).map((role) => ({
          id: role.id,
          name: role.name,
          display_name: role.display_name,
          description: role.description,
        })),
        permissions: (permissions || []).map(
          (permission) => `${permission.resource}.${permission.action}`,
        ),
      };
      const started = await context.client.startSession(userData, {
        createdBy: 'register',
        rotate: true,
        rotationReason: 'register',
        authLevel: 1,
      });
      if (!started) {
        throw new Error('Failed to create session');
      }
      return {
        status: 'fulfilled',
        response: { message: 'Registration successful', user: userData },
      };
    } catch (err) {
      console.error('auth/register error:', err);
      const { response, error } = serializeErrorResponse(
        err,
        'Registration failed',
      );
      return { status: 'rejected', response, error };
    }
  },
});
