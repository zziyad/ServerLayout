// =============================================================================
// NOTIFICATION REPOSITORY - Unsubscribe from Push
// =============================================================================

async (data) => {
  console.log({ 'Unsubscribe Data': data });
  const { endpoint, user_id, event_id, point } = data;

  // Build WHERE clause based on provided parameters
  const conditions = ['endpoint = $1'];
  const params = [endpoint];
  let paramIndex = 2;

  // For user subscriptions (user_id is not null)
  if (user_id !== null && user_id !== undefined) {
    conditions.push(`user_id = $${paramIndex++}`);
    params.push(user_id);
  } else {
    // For dispatcher/VAPP subscriptions (user_id is null, but event_id is provided)
    if (event_id) {
      conditions.push(`event_id = $${paramIndex++}`);
      params.push(event_id);
    }
    // For dispatcher subscriptions (point is provided)
    if (point !== null && point !== undefined) {
      conditions.push(`point = $${paramIndex++}`);
      params.push(point);
    } else {
      // For VAPP subscriptions (point is null)
      conditions.push(`point IS NULL`);
    }
    // Ensure user_id is null for dispatcher/VAPP subscriptions
    conditions.push(`user_id IS NULL`);
  }

  const sql = `
		UPDATE "PushSubscription"
		SET is_active = false, updated_at = now()
		WHERE ${conditions.join(' AND ')}
		RETURNING *
	`;

  const result = await db.optimized.query(sql, params);

  if (result.rows.length === 0) {
    throw new Error('Subscription not found');
  }

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
