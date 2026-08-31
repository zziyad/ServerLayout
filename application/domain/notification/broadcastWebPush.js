// =============================================================================
// NOTIFICATION BROADCAST WEB PUSH - Send Web Push to all users with active subscriptions
// =============================================================================

async (payload, context) => {
  const notificationManager =
    context?.notificationManager || context?.application?.notificationManager;

  if (!notificationManager) {
    throw new Error('NotificationManager is not available');
  }

  // JSON SCHEMA VALIDATION: Validate notification payload structure
  // All notifications use the same structure (type, subject, message, data, metadata)
  const notificationSchema =
    await lib.schemas.notification.broadcastWebPushSchema();
  const notificationValidation = await common.validateSchema(
    payload,
    notificationSchema,
  );

  if (!notificationValidation.valid) {
    throw new Error(
      `Notification validation failed: ${notificationValidation.errors.join(
        '; ',
      )}`,
    );
  }

  const {
    type,
    subject,
    message,
    data = {},
    metadata = {},
    batchSize = 50, // Configurable batch size
    category, // Optional: filter by notification category ('fleet', 'driver', 'shuttle', etc.)
  } = notificationValidation.data;

  // REPOSITORY: Get users with active push subscriptions, filtered by category if provided
  // Map notification type to category for filtering
  const notificationCategory =
    category || getCategoryFromNotificationType(type);
  const userIds =
    await lib.repository.notification.getUsersWithSubscriptionsByCategory(
      notificationCategory,
    );

  console.log('[BroadcastWebPush] Found users with push subscriptions:', {
    count: userIds.length,
    userIds: userIds.slice(0, 5), // Log first 5 for debugging
    type,
    subject,
  });

  if (userIds.length === 0) {
    console.log('[BroadcastWebPush] No users with active push subscriptions');
    return {
      success: true,
      message: 'No users with active push subscriptions',
      sent: 0,
    };
  }

  // Process in batches to avoid overwhelming the system
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);

    // Send to all users in batch in parallel
    const results = await Promise.allSettled(
      batch.map((recipientUserId) =>
        domain.notification
          .sendWebPush(
            {
              type,
              recipientId: recipientUserId,
              subject,
              message,
              data,
              metadata: {
                ...metadata,
                sentBy: context?.session?.user?.id || null,
                sentAt: new Date().toISOString(),
              },
            },
            context,
          )
          .catch((err) => {
            console.error(
              `[BroadcastWebPush] Failed to send notification to user ${recipientUserId}:`,
              err.message,
            );
            return { success: false, error: err.message };
          }),
      ),
    );

    // Count successful and failed
    const batchResults = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null,
    );
    totalSent += batchResults.filter((r) => r?.success !== false).length;
    totalFailed += batchResults.filter((r) => r?.success === false).length;

    // Small delay between batches to avoid overwhelming the system
    if (i + batchSize < userIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return {
    success: totalFailed === 0,
    sent: totalSent,
    failed: totalFailed,
    total: userIds.length,
  };
};

// Helper: Map notification type to category
function getCategoryFromNotificationType(type) {
  if (!type) return null;

  // Map notification types to categories
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
