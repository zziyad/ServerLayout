// =============================================================================
// USER GRANT PERMISSION - Business Logic
// =============================================================================

async (payload, context) => {
  const grantedBy =
    context?.client?.session?.state?.auth?.user_id ||
    context?.session?.user?.id ||
    context?.session?.auth?.user_id;
  if (!grantedBy) throw new Error('Cannot determine granting user');

  const user = await lib.repository.user.exists(payload.userId);
  if (!user || user.is_deleted) throw new Error('User not found');

  const permission = await lib.repository.user.findPermission(
    payload.permissionId,
  );
  if (!permission) throw new Error('Permission not found');

  return lib.repository.userPermission.grant({
    userId: payload.userId,
    permissionId: payload.permissionId,
    grantedBy,
    isGranted: payload.isGranted !== false,
    reason: payload.reason || null,
    expiresAt: payload.expiresAt || null,
  });
};
