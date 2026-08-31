// =============================================================================
// DEPARTMENT REPOSITORY - Get Structure with Roles and User Counts
// =============================================================================

async (data = {}) => {
  const {
    include_inactive = false,
    include_deleted = false,
    event_id = null, // Optional: if provided, also count EventStaff
  } = data;

  // Build WHERE conditions
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (!include_deleted) {
    conditions.push(`d.is_deleted = false`);
  }

  if (!include_inactive) {
    conditions.push(`d.is_active = true`);
  }

  // Filter by event_id: show event-specific departments + global departments (event_id IS NULL)
  if (event_id) {
    params.push(event_id);
    const eventIdParamIndex = paramIndex;
    paramIndex++;
    conditions.push(
      `(d.event_id = $${eventIdParamIndex}::uuid OR d.event_id IS NULL)`,
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Build user_count subquery with optional event_id
  let userCountSubquery = `
    (
      -- Count users from User table
      (SELECT COUNT(*)::integer
      FROM "User" u
      WHERE u.department_role_assignment_id = dra.id 
        AND u.is_deleted = false
        AND u.is_active = true)
      +
      -- Count event staff from EventStaff table (if event_id provided)
      COALESCE((
        SELECT COUNT(*)::integer
        FROM "EventStaff" es
        WHERE es.department_role_assignment_id = dra.id
          AND es.is_deleted = false
          AND es.status = 'active'
  `;

  if (event_id) {
    params.push(event_id);
    const eventIdParamIndex = params.length;
    userCountSubquery += `\n          AND es.event_id = $${eventIdParamIndex}`;
  }

  userCountSubquery += `
      ), 0)
    )
  `;

  // Query to get departments with their roles and user counts
  const sql = `
    SELECT 
      d.id as department_id,
      d.code as department_code,
      d.name as department_name,
      d.display_name as department_display_name,
      d.is_active as department_is_active,
      d.event_id as department_event_id,
      COALESCE(
        json_agg(
          json_build_object(
            'id', dra.id,
            'code', dra.code,
            'name', dra.name,
            'display_name', dra.display_name,
            'user_count', ${userCountSubquery}
          )
          ORDER BY dra.display_name
        ) FILTER (WHERE dra.id IS NOT NULL AND dra.is_deleted = false),
        '[]'::json
      ) as roles
    FROM "Department" d
    LEFT JOIN "DepartmentRoleAssignment" dra ON d.id = dra.department_id AND dra.is_deleted = false
    ${whereClause}
    GROUP BY d.id, d.code, d.name, d.display_name, d.is_active, d.event_id
    ORDER BY d.display_name ASC
  `;

  const result = await db.pg.query(sql, params);

  return result.rows;
};
