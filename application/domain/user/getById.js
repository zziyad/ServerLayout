// =============================================================================
// USER GET BY ID - Business Logic
// =============================================================================

async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const user = await lib.repository.user.getById(userId);
  if (!user) return null;

  if (user.roles && Array.isArray(user.roles)) {
    user.roles = user.roles.filter((role) => role !== null);
  } else {
    user.roles = [];
  }

  user.direct_permissions = await lib.repository.userPermission.listByUser(
    userId,
  );
  return user;
};
