// =============================================================================
// NOTIFICATION - Email system status
// =============================================================================

async ({ limit = 20 } = {}) => {
  const recent = await lib.repository.notification.emailOutbox.recent({ limit });
  const countsQ = await db.pg.query(
    `
    SELECT status, COUNT(*)::int AS count
    FROM public.notification_email_outbox
    GROUP BY status
    ORDER BY status
    `,
  );

  return {
    smtp: await lib.notification.smtpEmailSender.status(),
    counts: countsQ.rows,
    recent,
  };
};
