// =============================================================================
// DEPARTMENT GET STRUCTURE - Business Logic
// =============================================================================

async (payload, context) => {
  // Основная валидация уже выполнена в API слое через JSON Schema
  // Подготовка параметров фильтрации

  // 2. REPOSITORY: Get department structure with roles and user counts
  const structure = await lib.repository.department.getStructure(payload);

  // 3. RETURN: Result
  return structure;
};
