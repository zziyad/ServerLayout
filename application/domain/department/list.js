// =============================================================================
// DEPARTMENT LIST - Business Logic
// =============================================================================

async (payload, context) => {
  // Основная валидация уже выполнена в API слое через JSON Schema
  // Подготовка параметров фильтрации

  // 2. REPOSITORY: Get departments list
  const departments = await lib.repository.department.list(payload);

  // 3. RETURN: Result
  return departments;
};
