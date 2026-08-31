({
  access: 'role.assign_permission',
  method: async ({ roleId, permissionId }) => {
    try {
      if (!roleId || !permissionId) {
        return {
          status: 'rejected',
          response: 'Role ID and Permission ID are required',
        };
      }

      const sessionState = context.client.session?.state;
      const grantedBy =
        sessionState?.id || sessionState?.auth?.user_id || null;

      await domain.role.assignPermission({
        roleId,
        permissionId,
        grantedBy,
      });

      return {
        status: 'fulfilled',
        response: { message: 'Permission assigned successfully' },
      };
    } catch (error) {
      console.error('role/assignPermission error:', error);
      return {
        status: 'rejected',
        response: error.message || 'Failed to assign permission',
      };
    }
  },
});
