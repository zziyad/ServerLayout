// =============================================================================
// NOTIFICATION SEND WEB PUSH - Send Web Push to user's subscriptions
// =============================================================================

async (payload, context) => {
  const notificationManager =
    context?.notificationManager || context?.application?.notificationManager;

  if (!notificationManager) {
    throw new Error('NotificationManager is not available');
  }

  const {
    type,
    recipientId,
    subject,
    message,
    data = {},
    metadata = {},
  } = payload;

  // Validate required fields
  if (!type || !recipientId || !subject || !message) {
    throw new Error(
      'Missing required fields: type, recipientId, subject, message',
    );
  }

  // REPOSITORY: Get user's active push subscriptions
  const subscriptions = await lib.repository.notification.getUserSubscriptions(
    recipientId,
  );

  if (subscriptions.length === 0) {
    return {
      success: false,
      message: 'User has no active push subscriptions',
      sent: 0,
    };
  }

  // Filter subscriptions by category preference
  const category = getCategoryFromNotificationType(type);
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!category) return true; // If no category, send to all

    const preferences = sub.notification_preferences;
    // If preferences is null, default to enabled (backward compatible)
    if (!preferences) return true;

    // Check if this category is enabled
    return preferences[category] !== false;
  });

  if (filteredSubscriptions.length === 0) {
    return {
      success: false,
      message: `User has disabled ${category} notifications`,
      sent: 0,
    };
  }

  // NOTIFICATION MANAGER: Send push to filtered subscriptions
  const results = await notificationManager.send({
    type,
    recipientType: 'user',
    recipientId,
    recipientPushToken: filteredSubscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    })),
    channels: ['push'],
    subject,
    message,
    data,
    metadata: {
      ...metadata,
      sentBy: context?.session?.user?.id || null,
      sentAt: new Date().toISOString(),
    },
  });

  // Handle expired subscriptions (410 status)
  const expiredSubscriptions =
    results.channels.push?.results?.filter((r) => r.expired) || [];

  // Deactivate expired subscriptions
  for (const expired of expiredSubscriptions) {
    try {
      await lib.repository.notification.unsubscribe({
        endpoint: expired.to,
        user_id: recipientId,
      });
    } catch (error) {
      console.error('Failed to deactivate expired subscription:', error);
    }
  }

  return {
    ...results,
    sent: filteredSubscriptions.length,
    expired: expiredSubscriptions.length,
  };
};

// Helper: Map notification type to category
function getCategoryFromNotificationType(type) {
  if (!type) return null;

  const typeToCategory = {
    fleet_created: 'fleet',
    fleet_deleted: 'fleet',
    fleet_updated: 'fleet',
    driver_assigned: 'driver',
    driver_unassigned: 'driver',
    shuttle_departed: 'shuttle',
    shuttle_arrived: 'shuttle',
    guest_checked_in: 'guest',
    guest_checked_out: 'guest',
    route_assigned: 'route',
    route_completed: 'route',
    incident_created: 'incident',
    incident_resolved: 'incident',
  };

  return typeToCategory[type] || null;
}
