// =============================================================================
// USER ACTIVATE/DEACTIVATE - Change is_active Status
// =============================================================================

async ({ id, activate, sessionUserId }) => {
  if (!id) throw new Error('User ID is required');

  const user = await lib.repository.user.exists(id);
  if (!user) throw new Error('User not found');
  if (user.is_deleted) throw new Error('Cannot modify deleted user');
  if (!activate && id === sessionUserId) {
    throw new Error('Cannot deactivate yourself');
  }

  if (!activate && (await lib.repository.user.hasAdminRole(id))) {
    const totalActiveAdmins = await lib.repository.user.countActiveAdmins();
    if (totalActiveAdmins <= 1) {
      throw new Error('Cannot deactivate the last admin user');
    }
  }

  await lib.repository.user.activate(id, activate);
  return {
    message: `User ${activate ? 'activated' : 'deactivated'} successfully`,
    is_active: activate,
  };
};
