// =============================================================================
// PERMISSION GET BY ID - Business Logic
// =============================================================================

async (payload, context) => {
  const { id } = payload;
  const permission = await lib.repository.permission.getById(id);
  if (!permission) throw new Error('Permission not found');
  return permission;
};
