// =============================================================================
// USER CHANGE ROLE - Assign/Remove Role from User
// =============================================================================

async ({ userId, roleId, action, changedBy }) => {
  if (!userId || !roleId) throw new Error('User ID and Role ID are required');
  if (!changedBy) throw new Error('Changed by user ID is required');
  if (action !== 'assign' && action !== 'remove') {
    throw new Error('Invalid action. Must be "assign" or "remove"');
  }

  const role = await lib.repository.user.findRole(roleId);
  if (action === 'assign' && role?.name === 'super_admin') {
    throw new Error(
      'super_admin is protected and cannot be assigned from the admin dashboard',
    );
  }
  if (action === 'remove' && userId === changedBy) {
    throw new Error('Cannot remove role from yourself');
  }
  if (
    action === 'remove' &&
    role &&
    (role.name === 'admin' || role.name === 'super_admin')
  ) {
    const adminCount = await lib.repository.user.countActiveAdmins();
    if (adminCount <= 1) throw new Error('Cannot remove the last admin role');
  }

  await lib.repository.user.changeRole({ userId, roleId, action, changedBy });
  const updatedUser = await domain.user.getById(userId);
  return {
    message: `Role ${action}ed successfully`,
    user: updatedUser,
  };
};
