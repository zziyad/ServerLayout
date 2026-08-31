// =============================================================================
// NOTIFICATION SUBSCRIBE - Subscribe to Web Push notifications
// =============================================================================

async (payload, context) => {
  const { endpoint, keys, userAgent } = payload;
  const userId = context?.client?.session?.state?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // REPOSITORY: Сохранить или обновить подписку
  const subscription = await lib.repository.notification.saveSubscription({
    user_id: userId,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent || null,
    notification_preferences: payload.notificationPreferences || null,
  });

  return { subscriptionId: subscription.id };
};
