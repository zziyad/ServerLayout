// =============================================================================
// DEPARTMENT CREATE - Business Logic
// =============================================================================

async (payload, context) => {
  const user = context?.client?.session?.state || context?.session?.user || {};

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь можно добавить дополнительную бизнес-логику (опционально)

  // 2. REPOSITORY: Create department
  const department = await lib.repository.department.create(payload);

  // 3. AUTO-CREATE: Create role assignments from templates (if enabled)
  // Check if auto-create is enabled (default: true if not specified)
  const autoCreateRoles = payload.auto_create_roles_from_templates !== false;

  if (autoCreateRoles) {
    // Get all active DepartmentRole templates
    const templatesResult = await db.pg.query(
      `SELECT id, code, name, display_name, description, is_active
       FROM "DepartmentRole"
       WHERE is_deleted = false AND is_active = true
       ORDER BY code ASC`,
    );

    const templates = templatesResult.rows || [];

    // Create role assignments for each template
    if (templates.length > 0) {
      const insertValues = templates
        .map((template, index) => {
          const baseIndex = index * 7;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${
            baseIndex + 4
          }, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7})`;
        })
        .join(', ');

      const params = templates.flatMap((template) => [
        department.id,
        template.id,
        template.code,
        template.name,
        template.display_name,
        template.description || null,
        template.is_active,
      ]);

      await db.pg.query(
        `INSERT INTO "DepartmentRoleAssignment" 
         (department_id, role_template_id, code, name, display_name, description, is_active)
         VALUES ${insertValues}
         ON CONFLICT (department_id, code) DO NOTHING`,
        params,
      );
    }
  }

  // 4. LOG: Department creation

  // 5. RETURN: Result
  return department;
};
