// =============================================================================
// NOTIFICATION REPOSITORY - Save Dispatcher Push Subscription
// =============================================================================

async (data) => {
  const { event_id, point, endpoint, p256dh, auth, user_agent } = data;

  // 1. Проверить, существует ли подписка с таким endpoint
  const existing = await db.optimized.query(
    'SELECT id, is_active, user_id FROM "PushSubscription" WHERE endpoint = $1',
    [endpoint],
  );

  if (existing.rows.length > 0) {
    const existingSub = existing.rows[0];

    // Если у существующей подписки есть user_id (не NULL), это подписка пользователя
    // Нельзя обновить её для dispatcher portal (нарушит constraint)
    if (existingSub.user_id !== null) {
      throw new Error(
        'This endpoint is already subscribed by a user. Cannot use for dispatcher portal.',
      );
    }

    // Обновить существующую dispatcher подписку (user_id уже NULL)
    console.log(
      `[PushSubscription] Updating existing dispatcher subscription for endpoint: ${endpoint.substring(
        0,
        50,
      )}...`,
    );
    const result = await db.optimized.query(
      `UPDATE "PushSubscription"
			 SET event_id = $1, point = $2, p256dh = $3, auth = $4, user_agent = $5, is_active = true, updated_at = now()
			 WHERE endpoint = $6 AND user_id IS NULL
			 RETURNING *`,
      [event_id, point, p256dh, auth, user_agent, endpoint],
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to update subscription');
    }

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  }

  // 2. Проверить, есть ли неактивные подписки для этого event_id + point
  const inactiveSubscription = await db.optimized.query(
    `SELECT id FROM "PushSubscription" 
		 WHERE event_id = $1 AND point = $2 AND is_active = false 
		 ORDER BY updated_at DESC 
		 LIMIT 1`,
    [event_id, point],
  );

  if (inactiveSubscription.rows.length > 0) {
    // Переиспользовать неактивную подписку
    console.log(
      `[PushSubscription] Reusing inactive dispatcher subscription ${
        inactiveSubscription.rows[0].id
      } with new endpoint: ${endpoint.substring(0, 50)}...`,
    );
    const result = await db.optimized.query(
      `UPDATE "PushSubscription"
			 SET endpoint = $1, p256dh = $2, auth = $3, user_agent = $4, is_active = true, updated_at = now()
			 WHERE id = $5
			 RETURNING *`,
      [endpoint, p256dh, auth, user_agent, inactiveSubscription.rows[0].id],
    );

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  }

  // 3. Создать новую подписку (user_id = null для dispatcher portal)
  console.log(
    `[PushSubscription] Creating new dispatcher subscription for event ${event_id}, point ${point} with endpoint: ${endpoint.substring(
      0,
      50,
    )}...`,
  );
  try {
    const result = await db.optimized.query(
      `INSERT INTO "PushSubscription" (user_id, event_id, point, endpoint, p256dh, auth, user_agent, is_active)
			 VALUES (NULL, $1, $2, $3, $4, $5, $6, true)
			 RETURNING *`,
      [event_id, point, endpoint, p256dh, auth, user_agent],
    );

    console.log(
      `[PushSubscription] Created new dispatcher subscription with id: ${result.rows[0].id}`,
    );

    // Clear cache
    try {
      db.optimized.clearCache();
    } catch {}

    return result.rows[0];
  } catch (error) {
    console.error(
      '[PushSubscription] Failed to create dispatcher subscription:',
      error,
    );
    throw error;
  }
};
