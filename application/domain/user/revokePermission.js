// =============================================================================
// USER REVOKE PERMISSION - Business Logic
// =============================================================================

async (payload) => {
  const user = await lib.repository.user.exists(payload.userId);
  if (!user || user.is_deleted) throw new Error('User not found');
  return lib.repository.userPermission.revoke({
    userId: payload.userId,
    permissionId: payload.permissionId,
  });
};
