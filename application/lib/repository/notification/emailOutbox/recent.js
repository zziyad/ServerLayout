// =============================================================================
// EMAIL OUTBOX - Recent emails for admin/status views
// =============================================================================

async ({ limit = 50 } = {}) => {
  const q = await db.pg.query(
    `
    SELECT *
    FROM public.notification_email_outbox
    ORDER BY created_at DESC
    LIMIT $1
    `,
    [Math.max(1, Math.min(Number(limit || 50), 100))],
  );
  return q.rows;
};
