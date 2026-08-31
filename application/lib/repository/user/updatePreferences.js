// =============================================================================
// USER REPOSITORY - Update Preferences
// =============================================================================

async (userId, preferences) => {
  const sql = `
    UPDATE "User" 
    SET preferences = $1::jsonb, updated_at = now()
    WHERE id = $2 AND is_deleted = false
    RETURNING preferences
  `;

  const preferencesJson = JSON.stringify(preferences);
  const result = await db.pg.query(sql, [preferencesJson, userId]);

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  // Clear cache after write
  try {
    db.optimized.clearCache();
  } catch (e) {
    // ignore cache errors
  }

  return result.rows[0].preferences;
};
