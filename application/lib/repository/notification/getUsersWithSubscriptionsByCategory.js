// =============================================================================
// NOTIFICATION REPOSITORY - Get Users with Active Push Subscriptions for Specific Category
// =============================================================================
// Returns user IDs who have subscriptions with the specified category enabled
// category: 'fleet', 'driver', 'shuttle', 'guest', 'route', 'incident'

async (category) => {
  if (!category) {
    // If no category specified, return all users (backward compatible)
    const sql = `
			SELECT DISTINCT user_id
			FROM "PushSubscription"
			WHERE is_active = true
				AND user_id IS NOT NULL
			ORDER BY user_id
		`;
    const result = await db.optimized.query(sql, [], {
      useCache: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes TTL
    });
    return result.rows.map((row) => row.user_id).filter(Boolean);
  }

  // Filter by category preference
  // Check if notification_preferences->category is true OR notification_preferences is NULL (default: all enabled)
  // Handle both JSONB boolean and string 'true'/'false' values
  const sql = `
		SELECT DISTINCT user_id
		FROM "PushSubscription"
		WHERE is_active = true
			AND user_id IS NOT NULL
			AND (
				notification_preferences IS NULL
				OR notification_preferences->>$1 IS NULL
				OR notification_preferences->>$1 = 'true'
				OR (notification_preferences->>$1)::text = 'true'
				OR (notification_preferences->>$1)::boolean = true
			)
		ORDER BY user_id
	`;

  // Use cached query with 5 minutes TTL to reduce DB load
  const result = await db.optimized.query(sql, [category], {
    useCache: true,
    cacheTTL: 5 * 60 * 1000, // 5 minutes TTL
  });

  const userIds = result.rows.map((row) => row.user_id).filter(Boolean);

  console.log(
    `[getUsersWithSubscriptionsByCategory] Found users with ${category} notifications enabled:`,
    {
      count: userIds.length,
      category,
      userIds: userIds.slice(0, 10), // Log first 10 for debugging
    },
  );

  return userIds;
};
