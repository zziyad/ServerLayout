// =============================================================================
// EMAIL OUTBOX - List pending/failed due emails
// =============================================================================

async ({ limit = 10 } = {}) => {
  const q = await db.pg.query(
    `
    SELECT *
    FROM public.notification_email_outbox
    WHERE status IN ('pending', 'failed')
      AND attempt_count < max_attempts
      AND next_attempt_at <= now()
    ORDER BY priority ASC, created_at ASC
    LIMIT $1
    `,
    [Math.max(1, Math.min(Number(limit || 10), 50))],
  );
  return q.rows;
};
