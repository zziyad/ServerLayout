// =============================================================================
// NOTIFICATION REPOSITORY - List
// =============================================================================

async (filters = {}) => {
  const {
    recipientType,
    recipientId,
    channel,
    status,
    notificationType,
    limit = 50,
    offset = 0,
  } = filters;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (recipientType) {
    conditions.push(`recipient_type = $${paramIndex++}`);
    params.push(recipientType);
  }

  if (recipientId) {
    conditions.push(`recipient_id = $${paramIndex++}`);
    params.push(recipientId);
  }

  if (channel) {
    conditions.push(`channel = $${paramIndex++}`);
    params.push(channel);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (notificationType) {
    conditions.push(`notification_type = $${paramIndex++}`);
    params.push(notificationType);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
		SELECT *
		FROM "NotificationLog"
		${whereClause}
		ORDER BY created_at DESC
		LIMIT $${paramIndex++} OFFSET $${paramIndex++}
	`;

  params.push(limit, offset);

  const result = await db.optimized.query(sql, params);

  // Parse JSON metadata
  const notifications = result.rows.map((row) => ({
    ...row,
    metadata:
      typeof row.metadata === 'string'
        ? JSON.parse(row.metadata)
        : row.metadata,
  }));

  // Get total count
  const countSql = `
		SELECT COUNT(*) as total
		FROM "NotificationLog"
		${whereClause}
	`;

  const countResult = await db.optimized.query(countSql, params.slice(0, -2));
  const total = parseInt(countResult.rows[0]?.total || 0, 10);

  return {
    notifications,
    total,
    limit,
    offset,
  };
};
