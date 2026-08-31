// =============================================================================
// DEPARTMENT DELETE - Business Logic (Hard Delete)
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  // Проверка существования департамента (не проверяем is_deleted для hard delete)
  const existingDepartment = await db.pg.query(
    'SELECT id FROM "Department" WHERE id = $1',
    [payload.id],
  );
  if (!existingDepartment.rows || existingDepartment.rows.length === 0) {
    throw new Error('Department not found');
  }

  // Проверка зависимостей (пользователи с этим департаментом)
  const usersCount = await lib.repository.department.checkDependencies(
    payload.id,
  );
  if (usersCount > 0) {
    throw new Error(
      `Cannot delete department: ${usersCount} user(s) are assigned to this department`,
    );
  }

  // 2. REPOSITORY: Hard delete department (will cascade delete all role assignments)
  const department = await lib.repository.department.delete(payload.id);

  // 3. LOG: Department deletion

  // 4. RETURN: Result
  return department;
};
