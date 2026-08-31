// =============================================================================
// USER REPOSITORY - Activate
// =============================================================================

async (userId, isActive) => {
  await db.pg.update('User', { is_active: isActive }, { id: userId });
  try {
    db.optimized.clearCache();
  } catch {}
};
