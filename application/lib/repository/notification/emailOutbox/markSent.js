// =============================================================================
// EMAIL OUTBOX - Mark sent and record attempt
// =============================================================================

async ({ id, provider_response = null, provider_message_id = null }) => {
  return db.optimized.transaction(async (client) => {
    const updated = await client.query(
      `
      UPDATE public.notification_email_outbox
      SET status = 'sent',
          attempt_count = attempt_count + 1,
          sent_at = now(),
          last_error = NULL,
          provider_message_id = $2,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, provider_message_id],
    );
    const row = updated.rows[0];
    await client.query(
      `
      INSERT INTO public.notification_email_delivery_attempt (
        outbox_id, attempt_number, status, provider_response, provider_message_id
      ) VALUES ($1,$2,'sent',$3,$4)
      `,
      [id, row?.attempt_count || 1, provider_response, provider_message_id],
    );
    return row;
  });
};
