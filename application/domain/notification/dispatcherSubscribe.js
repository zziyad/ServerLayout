// =============================================================================
// NOTIFICATION DISPATCHER SUBSCRIBE - Business Logic
// =============================================================================

async (payload, context) => {
  const { endpoint, keys, userAgent, event_id, point } = payload;

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь только бизнес-правила (если нужны)

  // 1. REPOSITORY: Сохранить или обновить подписку
  const subscription =
    await lib.repository.notification.saveDispatcherSubscription({
      event_id,
      point,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: userAgent || null,
    });

  // 2. RETURN: Result
  return { subscriptionId: subscription.id };
};
