// =============================================================================
// USER REPOSITORY - Delete
// =============================================================================

async (userId) => {
  await db.pg.update(
    'User',
    { is_deleted: true, deleted_at: new Date() },
    { id: userId },
  );
  try {
    db.optimized.clearCache();
  } catch {}
};
