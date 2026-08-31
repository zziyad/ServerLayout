({
  access: 'role.update',
  method: async (payload) => {
    try {
      const role = await domain.role.update(payload);

      return {
        status: 'fulfilled',
        response: role,
      };
    } catch (error) {
      console.error('role/update error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to update role',
      };
    }
  },
});
