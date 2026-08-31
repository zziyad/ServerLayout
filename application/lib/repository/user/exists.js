// =============================================================================
// USER REPOSITORY - Exists
// =============================================================================

async (userId) => {
  if (!userId) return null;
  return db.pg.row('User', ['id', 'is_active', 'is_deleted', 'email', 'username'], {
    id: userId,
  });
};
