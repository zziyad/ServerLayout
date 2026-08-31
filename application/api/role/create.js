({
  access: 'role.create',
  method: async (payload) => {
    try {
      const role = await domain.role.create(payload);

      return {
        status: 'fulfilled',
        response: role,
      };
    } catch (error) {
      console.error('role/create error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to create role',
      };
    }
  },
});
