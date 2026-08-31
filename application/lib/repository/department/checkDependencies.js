// =============================================================================
// DEPARTMENT REPOSITORY - Check Dependencies (users assigned to this department)
// =============================================================================

async (departmentId) => {
  const result = await db.pg.query(
    `SELECT COUNT(*)::int as count
     FROM "User" u
     INNER JOIN "DepartmentRoleAssignment" dra ON u.department_role_assignment_id = dra.id
     WHERE dra.department_id = $1 AND u.is_deleted = false`,
    [departmentId],
  );
  return result.rows[0]?.count ?? 0;
};
