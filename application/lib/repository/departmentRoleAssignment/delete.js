// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT REPOSITORY - Delete (Hard Delete)
// =============================================================================

async (data) => {
  const { id } = data

  const checkSql = `
    SELECT COUNT(*) as count
    FROM "User"
    WHERE department_role_assignment_id = $1 AND is_deleted = false
  `
  const checkResult = await db.pg.query(checkSql, [id])
  const userCount = parseInt(checkResult.rows[0].count || 0)
  if (userCount > 0) {
    throw new Error(
      `Cannot delete role assignment: ${userCount} user(s) are assigned to this role`,
    )
  }

  const sql = `
    DELETE FROM "DepartmentRoleAssignment"
    WHERE id = $1
    RETURNING *
  `
  const result = await db.pg.query(sql, [id])
  if (result.rows.length === 0) {
    throw new Error('Department role assignment not found')
  }
  try {
    db.optimized.clearCache()
  } catch {}
  return result.rows[0]
}
