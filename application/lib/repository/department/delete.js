// =============================================================================
// DEPARTMENT REPOSITORY - Delete (Hard Delete)
// =============================================================================

async (id) => {
  // First, hard delete all related DepartmentRoleAssignment records
  await db.pg.query(
    `DELETE FROM "DepartmentRoleAssignment" WHERE department_id = $1`,
    [id],
  );

  // Then, hard delete the department
  const sql = `
    DELETE FROM "Department"
    WHERE id = $1
    RETURNING *
  `;

  const params = [id];

  const result = await db.pg.query(sql, params);

  if (result.rows.length === 0) {
    throw new Error('Department not found');
  }

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
