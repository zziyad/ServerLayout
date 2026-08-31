({
  access: 'role.remove_permission',
  method: async ({ roleId, permissionId }) => {
    try {
      if (!roleId || !permissionId) {
        return {
          status: 'rejected',
          response: 'Role ID and Permission ID are required',
        };
      }

      await domain.role.removePermission({ roleId, permissionId });

      return {
        status: 'fulfilled',
        response: { message: 'Permission removed successfully' },
      };
    } catch (error) {
      console.error('role/removePermission error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to remove permission',
      };
    }
  },
});
