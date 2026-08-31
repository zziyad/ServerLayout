// =============================================================================
// NOTIFICATION REPOSITORY - Get User Push Subscriptions
// =============================================================================

async (userId) => {
  const sql = `
		SELECT *
		FROM "PushSubscription"
		WHERE user_id = $1 AND is_active = true
		ORDER BY created_at DESC
	`;

  const result = await db.optimized.query(sql, [userId]);

  return result.rows;
};
