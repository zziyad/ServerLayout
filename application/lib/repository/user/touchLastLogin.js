// =============================================================================
// USER REPOSITORY - TouchLastLogin
// =============================================================================

async (userId) => {
  await db.pg.update(
    'User',
    { last_login_at: new Date().toISOString() },
    { id: userId },
  );
};
