// =============================================================================
// NOTIFICATION DISPATCHER UNSUBSCRIBE - Business Logic
// =============================================================================

async (payload, context) => {
  const { endpoint, event_id, point } = payload;

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь только бизнес-правила (если нужны)

  // 1. REPOSITORY: Деактивировать подписку
  await lib.repository.notification.unsubscribe({
    endpoint,
    user_id: null, // Для dispatcher portal user_id = null
    event_id,
    point,
  });

  // 2. RETURN: Result
  return { success: true };
};
