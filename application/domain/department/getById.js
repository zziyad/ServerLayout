// =============================================================================
// DEPARTMENT GET BY ID - Business Logic
// =============================================================================

async (payload, context) => {
  const { id } = payload;

  // Get department from repository
  const department = await lib.repository.department.getById(id);

  if (!department) {
    throw new Error('Department not found');
  }

  if (department.is_deleted) {
    throw new Error('Department is deleted');
  }

  return department;
};
