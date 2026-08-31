// =============================================================================
// EMAIL SETTINGS - Get singleton global SMTP settings
// =============================================================================

async () => {
  const q = await db.pg.query(
    `
    SELECT *
    FROM public.notification_email_settings
    WHERE id = 1
    LIMIT 1
    `,
  );
  return q.rows[0] || null;
};
