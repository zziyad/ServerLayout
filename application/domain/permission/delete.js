// =============================================================================
// PERMISSION DELETE - Business Logic (soft delete)
// =============================================================================

async (payload, context) => {
  const existing = await lib.repository.permission.getById(payload.id);
  if (!existing) throw new Error('Permission not found');
  if (existing.is_system) {
    throw new Error('Cannot delete system permission');
  }
  return await lib.repository.permission.delete(payload.id);
};
