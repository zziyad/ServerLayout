// =============================================================================
// DEPARTMENT ROLE ASSIGNMENT REPOSITORY - List
// =============================================================================

async (filterData) => {
  const { department_id, status, page = 1, limit = 50 } = filterData
  const offset = (page - 1) * limit

  const queryParams = []
  const whereClauses = []
  let paramIndex = 1

  whereClauses.push(`dra.department_id = $${paramIndex++}`)
  queryParams.push(department_id)
  whereClauses.push(`dra.is_deleted = false`)

  if (status && status !== 'all') {
    if (status === 'active') {
      whereClauses.push(`dra.is_active = true`)
    } else if (status === 'inactive') {
      whereClauses.push(`dra.is_active = false`)
    }
  }

  const whereSQL = whereClauses.join(' AND ')
  const query = `
    SELECT
      dra.*,
      d.code as department_code,
      d.name as department_name,
      dr.code as template_code,
      dr.name as template_name
    FROM "DepartmentRoleAssignment" dra
    LEFT JOIN "Department" d ON dra.department_id = d.id
    LEFT JOIN "DepartmentRole" dr ON dra.role_template_id = dr.id
    WHERE ${whereSQL}
    ORDER BY dra.code ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  queryParams.push(limit, offset)
  const result = await db.pg.query(query, queryParams)

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "DepartmentRoleAssignment" dra
    WHERE ${whereSQL}
  `
  const countResult = await db.pg.query(countQuery, queryParams.slice(0, -2))
  const total = parseInt(countResult.rows[0].total || 0)

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}
