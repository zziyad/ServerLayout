({
  access: 'role.read',
  method: async ({ id }) => {
    try {
      if (!id) {
        return {
          status: 'rejected',
          response: 'Role ID is required',
        };
      }

      const role = await domain.role.getById({ id });

      if (!role) {
        return {
          status: 'rejected',
          response: 'Role not found',
        };
      }

      return {
        status: 'fulfilled',
        response: role,
      };
    } catch (error) {
      console.error('role/getById error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to fetch role',
      };
    }
  },
});
