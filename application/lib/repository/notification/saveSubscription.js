// =============================================================================
// NOTIFICATION REPOSITORY - Save Push Subscription
// =============================================================================

async (data) => {
  const {
    user_id,
    endpoint,
    p256dh,
    auth,
    user_agent,
    notification_preferences,
  } = data;

  // Default preferences: all enabled (backward compatible)
  const defaultPreferences = {
    fleet: true,
    driver: true,
    shuttle: true,
    guest: true,
    route: true,
    incident: true,
  };
  const preferences = notification_preferences || defaultPreferences;

  // 1. Проверить, существует ли подписка с таким endpoint (независимо от is_active)
  // Endpoint уникален для браузера/устройства, поэтому если он уже есть - обновляем
  const existing = await db.optimized.query(
    'SELECT id, is_active FROM "PushSubscription" WHERE endpoint = $1',
    [endpoint],
  );

  if (existing.rows.length > 0) {
    // Обновить существующую подписку (активируем и обновляем user_id/ключи)
    // Это тот же браузер/устройство - просто обновляем подписку
    console.log(
      `[PushSubscription] Updating existing subscription for endpoint: ${endpoint.substring(
        0,
        50,
      )}...`,
    );
    const result = await db.optimized.query(
      `UPDATE "PushSubscription"
			 SET user_id = $1, p256dh = $2, auth = $3, user_agent = $4, notification_preferences = $5, is_active = true, updated_at = now()
			 WHERE endpoint = $6
			 RETURNING *`,
      [
        user_id,
        p256dh,
        auth,
        user_agent,
        JSON.stringify(preferences),
        endpoint,
      ],
    );
    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  }

  // 2. Endpoint новый - это может быть:
  //    - Новое устройство/браузер (создаем новую подписку)
  //    - Тот же браузер после unsubscribe (переиспользуем неактивную подписку)

  // Проверить, есть ли неактивные подписки этого пользователя
  // Если есть - переиспользуем последнюю (браузер переподписался)
  const inactiveSubscription = await db.optimized.query(
    `SELECT id FROM "PushSubscription" 
		 WHERE user_id = $1 AND is_active = false 
		 ORDER BY updated_at DESC 
		 LIMIT 1`,
    [user_id],
  );

  if (inactiveSubscription.rows.length > 0) {
    // Обновить последнюю неактивную подписку новым endpoint
    // Это тот же пользователь, который переподписался в том же браузере
    console.log(
      `[PushSubscription] Reusing inactive subscription ${
        inactiveSubscription.rows[0].id
      } with new endpoint: ${endpoint.substring(0, 50)}...`,
    );
    const result = await db.optimized.query(
      `UPDATE "PushSubscription"
			 SET endpoint = $1, p256dh = $2, auth = $3, user_agent = $4, notification_preferences = $5, is_active = true, updated_at = now()
			 WHERE id = $6
			 RETURNING *`,
      [
        endpoint,
        p256dh,
        auth,
        user_agent,
        JSON.stringify(preferences),
        inactiveSubscription.rows[0].id,
      ],
    );

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  }

  // 3. Нет неактивных подписок - создать новую подписку
  // Это новое устройство/браузер - пользователь может иметь несколько активных подписок
  console.log(
    `[PushSubscription] Creating new subscription for user ${user_id} (new device/browser) with endpoint: ${endpoint.substring(
      0,
      50,
    )}...`,
  );
  try {
    const result = await db.optimized.query(
      `INSERT INTO "PushSubscription" (user_id, endpoint, p256dh, auth, user_agent, notification_preferences, is_active)
			 VALUES ($1, $2, $3, $4, $5, $6, true)
			 RETURNING *`,
      [
        user_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        JSON.stringify(preferences),
      ],
    );

    console.log(
      `[PushSubscription] Created new subscription with id: ${result.rows[0].id} (user can have multiple active subscriptions for different devices)`,
    );

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    // Если ошибка из-за UNIQUE constraint - значит миграция не применена
    if (
      error.code === '23505' ||
      error.message?.includes('unique') ||
      error.message?.includes('duplicate')
    ) {
      console.error(
        '[PushSubscription] UNIQUE constraint error - migration may not be applied!',
      );
      console.error('[PushSubscription] Error:', error.message);
      console.error(
        '[PushSubscription] Please run: ALTER TABLE "PushSubscription" DROP CONSTRAINT IF EXISTS "PushSubscription_endpoint_key";',
      );
      throw new Error(
        'PushSubscription endpoint UNIQUE constraint still exists. Please apply migration: migrations/remove_push_subscription_endpoint_unique.sql',
      );
    }
    throw error;
  }
};
