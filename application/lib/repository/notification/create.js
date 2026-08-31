// =============================================================================
// NOTIFICATION REPOSITORY - Create
// =============================================================================

async (data) => {
  const {
    notification_type,
    channel,
    recipient_type,
    recipient_id,
    recipient_contact,
    subject,
    message,
    status = 'pending',
    metadata = {},
  } = data;

  const sql = `
		INSERT INTO "NotificationLog" (
			notification_type, channel, recipient_type, recipient_id,
			recipient_contact, subject, message, status, metadata, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
		RETURNING *
	`;

  const result = await db.optimized.query(sql, [
    notification_type,
    channel,
    recipient_type,
    recipient_id,
    recipient_contact,
    subject,
    message,
    status,
    JSON.stringify(metadata),
  ]);

  return result.rows[0];
};
