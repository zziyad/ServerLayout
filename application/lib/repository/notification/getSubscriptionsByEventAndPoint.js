// =============================================================================
// NOTIFICATION REPOSITORY - Get Subscriptions by Event ID and Point
// =============================================================================

async (event_id, point) => {
  const result = await db.optimized.query(
    `SELECT id, endpoint, p256dh, auth, event_id, point, created_at, updated_at
		 FROM "PushSubscription"
		 WHERE event_id = $1 AND point = $2 AND is_active = true
		 ORDER BY created_at DESC`,
    [event_id, point],
  );

  return result.rows;
};
