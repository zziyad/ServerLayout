({
  access: 'user.create',
  method: async (payload) => {
    // 1. JSON Schema validation (API_ARCHITECTURE_GUIDE: validate in the beginning)
    const validatedData = await common.validateEndpoint(
      payload,
      'user',
      'register',
      lib,
    );

    try {
      const user = await domain.user.create(validatedData, context);
      return {
        status: 'fulfilled',
        response: {
          message: 'Registration successful',
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            display_name: user.display_name,
          },
        },
      };
    } catch (err) {
      console.error('user/register error:', err);
      return {
        status: 'rejected',
        response: err.message || 'Registration failed',
      };
    }
  },
});
