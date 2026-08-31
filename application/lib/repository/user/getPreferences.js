// =============================================================================
// USER REPOSITORY - Get Preferences
// =============================================================================

async (userId) => {
  const user = await db.pg.row('User', ['preferences'], {
    id: userId,
    is_deleted: false,
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Return preferences object, defaulting to empty object if null
  return user.preferences || {};
};
