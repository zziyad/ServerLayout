// =============================================================================
// USER DOMAIN - Get Preferences
// =============================================================================

async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  return await lib.repository.user.getPreferences(userId);
};
