// =============================================================================
// USER DOMAIN - Update Preferences
// =============================================================================

async (userId, preferences) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  // Validate preferences structure
  if (typeof preferences !== 'object' || Array.isArray(preferences)) {
    throw new Error('Preferences must be an object');
  }

  return await lib.repository.user.updatePreferences(userId, preferences);
};
