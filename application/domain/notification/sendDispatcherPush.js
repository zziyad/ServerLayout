// =============================================================================
// NOTIFICATION SEND DISPATCHER PUSH - Business Logic
// =============================================================================

async (payload, context) => {
  const notificationManager =
    context?.notificationManager || context?.application?.notificationManager;

  console.log('[sendDispatcherPush] NotificationManager check:', {
    hasNotificationManager: !!notificationManager,
    hasContextNotificationManager: !!context?.notificationManager,
    hasApplicationNotificationManager:
      !!context?.application?.notificationManager,
  });

  if (!notificationManager) {
    console.error(
      '[sendDispatcherPush] NotificationManager is not available in context',
    );
    throw new Error('NotificationManager is not available');
  }

  // Check PushService status
  const pushStatus = notificationManager.getStatus?.();
  console.log('[sendDispatcherPush] PushService status:', pushStatus);

  const {
    event_id,
    point,
    subject,
    message,
    data = {},
    metadata = {},
  } = payload;

  // 1. VALIDATION: Business rules
  if (!event_id || !point || !subject || !message) {
    throw new Error(
      'Missing required fields: event_id, point, subject, message',
    );
  }

  if (!['A', 'B'].includes(point)) {
    throw new Error('point must be A or B');
  }

  // 2. REPOSITORY: Get dispatcher subscriptions for this event_id + point
  console.log('[sendDispatcherPush] Looking for subscriptions:', {
    event_id,
    point,
  });

  const subscriptions =
    await lib.repository.notification.getSubscriptionsByEventAndPoint(
      event_id,
      point,
    );

  console.log('[sendDispatcherPush] Found subscriptions:', {
    event_id,
    point,
    count: subscriptions.length,
    endpoints: subscriptions.map((s) => s.endpoint.substring(0, 50) + '...'),
  });

  if (subscriptions.length === 0) {
    console.log(
      '[sendDispatcherPush] No active dispatcher subscriptions for this event and point',
    );
    return {
      success: true,
      message: 'No active dispatcher subscriptions for this event and point',
      sent: 0,
    };
  }

  // 3. NOTIFICATION MANAGER: Send push to all subscriptions
  const notificationPayload = {
    type: 'shuttle-trip-updated',
    recipientType: 'dispatcher',
    recipientId: null, // No user_id for dispatcher portal
    recipientPushToken: subscriptions.map((sub) => ({
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    })),
    channels: ['push'],
    subject,
    message,
    data: {
      ...data,
      eventId: event_id,
      event_id, // Support both formats
      point,
    },
    metadata: {
      ...metadata,
      event_id,
      point,
      dispatcher: true,
      sentAt: new Date().toISOString(),
    },
  };

  // Validate payload before sending
  if (
    !notificationPayload.type ||
    !notificationPayload.recipientType ||
    !notificationPayload.channels?.length ||
    !notificationPayload.subject ||
    !notificationPayload.message
  ) {
    console.error('[sendDispatcherPush] Invalid payload:', {
      hasType: !!notificationPayload.type,
      hasRecipientType: !!notificationPayload.recipientType,
      hasChannels: !!notificationPayload.channels?.length,
      hasSubject: !!notificationPayload.subject,
      hasMessage: !!notificationPayload.message,
      hasRecipientPushToken: !!notificationPayload.recipientPushToken?.length,
    });
    throw new Error('Invalid notification payload');
  }

  console.log(
    '[sendDispatcherPush] Sending notification via NotificationManager:',
    {
      subscriptionCount: subscriptions.length,
      hasRecipientPushToken: !!notificationPayload.recipientPushToken?.length,
      channels: notificationPayload.channels,
    },
  );

  const results = await notificationManager.send(notificationPayload);

  console.log('[sendDispatcherPush] NotificationManager result:', {
    success: results.success,
    channels: Object.keys(results.channels || {}),
    pushResults: results.channels?.push,
  });

  // 4. HANDLE EXPIRED: Deactivate expired subscriptions (410 status)
  const expiredSubscriptions =
    results.channels?.push?.results?.filter((r) => r.expired) || [];

  if (expiredSubscriptions.length > 0) {
    console.log(
      '[sendDispatcherPush] Found expired subscriptions:',
      expiredSubscriptions.length,
    );
  }

  for (const expired of expiredSubscriptions) {
    try {
      await lib.repository.notification.unsubscribe({
        endpoint: expired.to,
        user_id: null,
        event_id,
        point,
      });
    } catch (error) {
      console.error(
        'Failed to deactivate expired dispatcher subscription:',
        error,
      );
    }
  }

  // 5. RETURN: Result
  const finalResult = {
    ...results,
    sent: subscriptions.length,
    expired: expiredSubscriptions.length,
  };

  console.log('[sendDispatcherPush] Final result:', finalResult);

  return finalResult;
};
