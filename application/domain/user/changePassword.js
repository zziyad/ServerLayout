// =============================================================================
// USER CHANGE PASSWORD - Business Logic
// =============================================================================

async (payload) => {
  const { id, new_password } = payload;
  const existingUser = await lib.repository.user.exists(id);
  if (!existingUser || existingUser.is_deleted) throw new Error('User not found');
  if (!new_password || new_password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  const password_hash = await metarhia.metautil.hashPassword(new_password);
  return lib.repository.user.changePassword(id, password_hash);
};
