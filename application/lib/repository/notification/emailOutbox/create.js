// =============================================================================
// EMAIL OUTBOX - Create pending email
// =============================================================================

async (data) => {
  const q = await db.pg.query(
    `
    INSERT INTO public.notification_email_outbox (
      recipient_user_id,
      recipient_email,
      recipient_name,
      subject,
      text_body,
      html_body,
      module,
      event_type,
      related_table,
      related_id,
      priority,
      metadata
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
    RETURNING *
    `,
    [
      data.recipient_user_id || null,
      String(data.recipient_email || '').trim().toLowerCase(),
      data.recipient_name || null,
      String(data.subject || '').trim(),
      String(data.text_body || '').trim(),
      data.html_body || null,
      data.module || 'general',
      data.event_type || 'manual',
      data.related_table || null,
      data.related_id || null,
      Number(data.priority || 100),
      JSON.stringify(data.metadata || {}),
    ],
  );
  return q.rows[0];
};
