// =============================================================================
// NOTIFICATION REPOSITORY - Get All Users with Active Push Subscriptions
// =============================================================================

async () => {
  const sql = `
		SELECT DISTINCT user_id
		FROM "PushSubscription"
		WHERE is_active = true
			AND user_id IS NOT NULL
		ORDER BY user_id
	`;

  // Use cached query with 5 minutes TTL to reduce DB load
  // Cache is automatically invalidated when subscriptions change (via clearCache in saveSubscription/unsubscribe)
  const result = await db.optimized.query(sql, [], {
    useCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes TTL
  });

  const userIds = result.rows.map((row) => row.user_id).filter(Boolean);

  console.log(
    '[getAllUsersWithSubscriptions] Found users with push subscriptions:',
    {
      count: userIds.length,
      userIds: userIds.slice(0, 10), // Log first 10 for debugging
    },
  );

  return userIds;
};
