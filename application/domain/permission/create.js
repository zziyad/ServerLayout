// =============================================================================
// PERMISSION CREATE - Business Logic
// =============================================================================

async (payload, context) => {
  const created = await lib.repository.permission.create(payload);
  return created;
};
