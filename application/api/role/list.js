({
  access: 'role.read',
  method: async ({ includeSystem = false }) => {
    try {
      const roles = await domain.role.list({ includeSystem });

      return {
        status: 'fulfilled',
        response: roles,
      };
    } catch (error) {
      console.error('role/list error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch roles',
      };
    }
  },
});
