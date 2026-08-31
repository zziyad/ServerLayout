// =============================================================================
// NOTIFICATION REPOSITORY - Update Status
// =============================================================================

async (updateData) => {
  const { notification_id, status, error_message, metadata } = updateData;

  const setClauses = ['status = $2', 'updated_at = now()'];
  const values = [notification_id, status];
  let paramIndex = 3;

  if (status === 'sent') {
    setClauses.push('sent_at = now()');
  }

  if (status === 'delivered') {
    setClauses.push('delivered_at = now()');
  }

  if (error_message !== undefined) {
    setClauses.push(`error_message = $${paramIndex++}`);
    values.push(error_message);
  }

  if (metadata !== undefined) {
    setClauses.push(`metadata = $${paramIndex++}`);
    values.push(JSON.stringify(metadata));
  }

  const sql = `
		UPDATE "NotificationLog"
		SET ${setClauses.join(', ')}
		WHERE id = $1
		RETURNING *
	`;

  const result = await db.optimized.query(sql, values);

  if (result.rows.length === 0) {
    throw new Error('Notification not found');
  }

  // Clear cache
  try {
    db.optimized.clearCache();
  } catch {}

  return result.rows[0];
};
