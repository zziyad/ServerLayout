// =============================================================================
// NOTIFICATION REPOSITORY - Get Subscription by Endpoint
// =============================================================================

async (endpoint) => {
  const result = await db.optimized.query(
    `SELECT id, endpoint, p256dh, auth, user_id, event_id, point, is_active, created_at, updated_at
		 FROM "PushSubscription"
		 WHERE endpoint = $1 AND is_active = true
		 LIMIT 1`,
    [endpoint],
  );

  return result.rows[0] || null;
};
