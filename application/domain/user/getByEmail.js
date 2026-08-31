// =============================================================================
// USER GET BY EMAIL - Business Logic
// =============================================================================

async (email) => {
  if (!email) throw new Error('Email is required');
  return lib.repository.user.getByEmail(email);
};
