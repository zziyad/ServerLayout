// =============================================================================
// DEPARTMENT UPDATE - Business Logic
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Проверка существования департамента
  const existingDepartment = await lib.repository.department.getById(
    payload.id,
  );
  if (!existingDepartment) {
    throw new Error('Department not found');
  }

  if (existingDepartment.is_deleted) {
    throw new Error('Cannot update deleted department');
  }

  // 2. REPOSITORY: Update department
  const department = await lib.repository.department.update(payload);

  // 3. LOG: Department update
  // 4. RETURN: Result
  return department;
};
