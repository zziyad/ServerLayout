// =============================================================================
// DEPARTMENT ROLE TEMPLATE REPOSITORY - List
// =============================================================================

async (filterData = {}) => {
  const { status = 'all', page = 1, limit = 50 } = filterData
  const offset = (page - 1) * limit

  const queryParams = []
  const whereClauses = ['is_deleted = false']
  let paramIndex = 1

  if (status && status !== 'all') {
    whereClauses.push(`is_active = $${paramIndex}`)
    queryParams.push(status === 'active')
    paramIndex += 1
  }

  const whereSql = whereClauses.join(' AND ')
  const dataQuery = `
    SELECT *
    FROM "DepartmentRole"
    WHERE ${whereSql}
    ORDER BY code ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `
  const dataParams = [...queryParams, limit, offset]
  const dataResult = await db.pg.query(dataQuery, dataParams)

  const countQuery = `
    SELECT COUNT(*)::int AS total
    FROM "DepartmentRole"
    WHERE ${whereSql}
  `
  const countResult = await db.pg.query(countQuery, queryParams)

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0]?.total || 0,
      pages: Math.ceil((countResult.rows[0]?.total || 0) / limit),
    },
  }
}
