// =============================================================================
// USER REPOSITORY - GetDepartmentContext
// =============================================================================

async (user) => {
  let department = null;
  let department_role = null;
  let department_id = null;

  if (user.department_role_assignment_id) {
    const draResult = await db.pg.query(
      `SELECT dra.id, dra.code, dra.name, dra.display_name, dra.department_id,
              d.id AS dept_id, d.code AS dept_code, d.name AS dept_name,
              d.display_name AS dept_display_name
       FROM "DepartmentRoleAssignment" dra
       LEFT JOIN "Department" d ON d.id = dra.department_id AND d.is_deleted = false
       WHERE dra.id = $1 AND dra.is_deleted = false`,
      [user.department_role_assignment_id],
    );
    if (draResult.rows[0]) {
      const row = draResult.rows[0];
      department_id = row.department_id;
      department_role = {
        id: row.id,
        code: row.code,
        name: row.name,
        display_name: row.display_name,
      };
      if (row.dept_id) {
        department = {
          id: row.dept_id,
          code: row.dept_code,
          name: row.dept_name,
          display_name: row.dept_display_name,
        };
      }
    }
  }

  if (!department_id && user.department_id) {
    department_id = user.department_id;
    const deptResult = await db.pg.query(
      `SELECT id, code, name, display_name FROM "Department"
       WHERE id = $1 AND is_deleted = false`,
      [user.department_id],
    );
    if (deptResult.rows[0]) {
      const dept = deptResult.rows[0];
      department = {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        display_name: dept.display_name,
      };
    }
  }

  return {
    department_id: department_id || department?.id || null,
    department,
    department_role,
  };
};
