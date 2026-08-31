// =============================================================================
// USER REPOSITORY - AssignDepartmentRoleAssignment
// =============================================================================

async ({ userId, tenantId, departmentRoleAssignmentId }) => {
  const userTenantRow = await db.pg.query(
    `SELECT tenant_id FROM "User" WHERE id = $1 AND is_deleted = false LIMIT 1`,
    [userId],
  );
  if (!userTenantRow.rows[0]) throw new Error('User not found');
  const effectiveTenantId = tenantId || userTenantRow.rows[0].tenant_id;

  const userRow = await db.pg.query(
    `SELECT id FROM "User"
     WHERE id = $1 AND tenant_id = $2
       AND is_deleted = false AND is_active = true
       AND account_status = 'ACTIVE'::public.user_account_status`,
    [userId, effectiveTenantId],
  );
  if (!userRow.rows[0]) {
    throw new Error('User must be an ACTIVE internal system user in this tenant');
  }

  let nextAssignmentId = null;
  if (departmentRoleAssignmentId) {
    const assignment = await db.pg.query(
      `SELECT dra.id
       FROM "DepartmentRoleAssignment" dra
       JOIN "Department" d ON d.id = dra.department_id
       WHERE dra.id = $1 AND dra.is_deleted = false
         AND d.tenant_id = $2 AND d.is_deleted = false
       LIMIT 1`,
      [departmentRoleAssignmentId, effectiveTenantId],
    );
    if (!assignment.rows[0]) {
      throw new Error('Department role assignment not found in tenant scope');
    }
    nextAssignmentId = assignment.rows[0].id;
  }

  return { effectiveTenantId, nextAssignmentId };
};
