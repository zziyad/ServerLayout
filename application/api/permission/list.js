({
  access: 'permission.read',
  method: async ({ resource = '', action = '' }) => {
    try {
      const permissions = await domain.permission.list({ resource, action });

      return {
        status: 'fulfilled',
        response: permissions,
      };
    } catch (error) {
      console.error('permission/list error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch permissions',
      };
    }
  },
});
