({
  access: 'role.delete',
  method: async ({ id }) => {
    try {
      if (!id) {
        return {
          status: 'rejected',
          response: 'Role ID is required',
        };
      }

      await domain.role.delete({ id });

      return {
        status: 'fulfilled',
        response: { message: 'Role deleted successfully' },
      };
    } catch (error) {
      console.error('role/delete error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to delete role',
      };
    }
  },
});
