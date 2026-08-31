({
  access: 'role.read',
  method: async ({ roleId }) => {
    try {
      if (!roleId) {
        return {
          status: 'rejected',
          response: 'Role ID is required',
        };
      }

      const permissions = await domain.role.getPermissions({ roleId });

      return {
        status: 'fulfilled',
        response: permissions,
      };
    } catch (error) {
      console.error('role/getPermissions error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch role permissions',
      };
    }
  },
});
