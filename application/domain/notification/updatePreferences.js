// =============================================================================
// NOTIFICATION UPDATE PREFERENCES - Update notification preferences for subscription
// =============================================================================

async (payload, context) => {
  const { endpoint, notificationPreferences } = payload;
  const userId = context?.client?.session?.state?.id;

  if (!userId) {
    throw new Error('User not authenticated');
  }

  // Validate preferences structure
  const validCategories = [
    'fleet',
    'driver',
    'shuttle',
    'guest',
    'route',
    'incident',
  ];
  const preferences = {};

  for (const category of validCategories) {
    if (notificationPreferences[category] !== undefined) {
      preferences[category] = Boolean(notificationPreferences[category]);
    } else {
      // Default to true if not specified (backward compatible)
      preferences[category] = true;
    }
  }

  // REPOSITORY: Update subscription preferences
  const result = await db.optimized.query(
    `UPDATE "PushSubscription"
		 SET notification_preferences = $1, updated_at = now()
		 WHERE endpoint = $2 AND user_id = $3 AND is_active = true
		 RETURNING *`,
    [JSON.stringify(preferences), endpoint, userId],
  );

  if (result.rows.length === 0) {
    throw new Error('Subscription not found or not active');
  }

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return { success: true, preferences };
};
