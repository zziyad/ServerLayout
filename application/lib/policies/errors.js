// =============================================================================
// DOMAIN POLICIES - Error Factory
// =============================================================================

async (code, message, meta) => {
  const err = new Error(message || 'Policy error');
  err.code = code || 'POLICY_ERROR';
  err.meta = meta || {};
  return err;
};
