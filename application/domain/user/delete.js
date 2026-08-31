// =============================================================================
// USER DELETE - Soft Delete
// =============================================================================

async (userId) => {
  if (!userId) throw new Error('User ID is required');

  const user = await lib.repository.user.exists(userId);
  if (!user) throw new Error('User not found');
  if (user.is_deleted) throw new Error('User is already deleted');

  if (await lib.repository.user.hasAdminRole(userId)) {
    const totalAdmins = await lib.repository.user.countActiveAdmins();
    if (totalAdmins <= 1) throw new Error('Cannot delete the last admin user');
  }

  await lib.repository.user.delete(userId);
  return {
    message: 'User deleted successfully',
    deleted_at: new Date(),
  };
};
