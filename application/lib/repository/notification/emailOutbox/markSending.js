// =============================================================================
// EMAIL OUTBOX - Mark email as sending
// =============================================================================

async ({ id }) => {
  const q = await db.pg.query(
    `
    UPDATE public.notification_email_outbox
    SET status = 'sending', updated_at = now()
    WHERE id = $1
      AND status IN ('pending', 'failed')
      AND attempt_count < max_attempts
    RETURNING *
    `,
    [id],
  );
  return q.rows[0] || null;
};
