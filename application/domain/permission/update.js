// =============================================================================
// PERMISSION UPDATE - Business Logic
// =============================================================================

async (payload, context) => {
  const existing = await lib.repository.permission.getById(payload.id);
  if (!existing) throw new Error('Permission not found');
  if (existing.is_system) {
    throw new Error('Cannot modify system permission');
  }
  return await lib.repository.permission.update(payload);
};
