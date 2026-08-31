// =============================================================================
// USER UPDATE - Business Logic
// =============================================================================

async (payload, maybeOptions) =>
  lib.repository.user.update(payload, maybeOptions);
