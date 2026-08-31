// =============================================================================
// NOTIFICATION LIST - Get list of notifications
// =============================================================================

async (payload, context) => {
  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь только бизнес-логика

  const {
    recipientType,
    recipientId,
    channel,
    status,
    notificationType,
    limit = 50,
    offset = 0,
  } = payload;

  // Users can only see their own notifications unless they have admin permission
  const userId = context?.session?.user?.id;
  const userPermissions = context?.session?.user?.permissions || [];

  // If not admin, filter by current user
  if (
    !userPermissions.includes('admin') &&
    !userPermissions.includes('view_all_notifications')
  ) {
    if (recipientId && recipientId !== userId) {
      throw new Error('You can only view your own notifications');
    }
    // Force filter by current user
    const result = await lib.repository.notification.list({
      recipientType: 'user',
      recipientId: userId,
      channel,
      status,
      notificationType,
      limit,
      offset,
    });
    return result;
  }

  // Admin can see all notifications
  const result = await lib.repository.notification.list({
    recipientType,
    recipientId,
    channel,
    status,
    notificationType,
    limit,
    offset,
  });

  return result;
};
