// =============================================================================
// EMAIL SETTINGS - Upsert singleton global SMTP settings
// =============================================================================

async (data) => {
  const q = await db.pg.query(
    `
    INSERT INTO public.notification_email_settings (
      id,
      enabled,
      provider,
      host,
      port,
      secure,
      tls_reject_unauthorized,
      username,
      password_encrypted,
      from_email,
      from_name,
      delivery_mode,
      sandbox_recipient_email,
      auto_process_enabled,
      auto_process_interval_seconds,
      auto_process_batch_limit,
      updated_by,
      updated_at
    ) VALUES (1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,now())
    ON CONFLICT (id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      provider = EXCLUDED.provider,
      host = EXCLUDED.host,
      port = EXCLUDED.port,
      secure = EXCLUDED.secure,
      tls_reject_unauthorized = EXCLUDED.tls_reject_unauthorized,
      username = EXCLUDED.username,
      password_encrypted = COALESCE(EXCLUDED.password_encrypted, notification_email_settings.password_encrypted),
      from_email = EXCLUDED.from_email,
      from_name = EXCLUDED.from_name,
      delivery_mode = EXCLUDED.delivery_mode,
      sandbox_recipient_email = EXCLUDED.sandbox_recipient_email,
      auto_process_enabled = EXCLUDED.auto_process_enabled,
      auto_process_interval_seconds = EXCLUDED.auto_process_interval_seconds,
      auto_process_batch_limit = EXCLUDED.auto_process_batch_limit,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
    RETURNING *
    `,
    [
      !!data.enabled,
      data.provider || 'smtp',
      data.host || 'smtp.office365.com',
      Number(data.port || 587),
      !!data.secure,
      data.tls_reject_unauthorized !== false,
      data.username || '',
      data.password_encrypted || null,
      data.from_email || '',
      data.from_name || '',
      data.delivery_mode || 'sandbox',
      data.sandbox_recipient_email || '',
      !!data.auto_process_enabled,
      Number(data.auto_process_interval_seconds || 60),
      Number(data.auto_process_batch_limit || 10),
      data.updated_by || null,
    ],
  );
  return q.rows[0];
};
