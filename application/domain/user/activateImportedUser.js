// =============================================================================
// USER ACTIVATE IMPORTED - Business Logic
// =============================================================================

async (payload) => {
  if (!payload.sessionUserId) throw new Error('Authentication required');
  if (!String(payload.email || '').trim()) throw new Error('Email is required');
  return lib.repository.user.activateImportedUser(payload);
};
