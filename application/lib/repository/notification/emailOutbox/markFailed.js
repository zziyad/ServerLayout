// =============================================================================
// EMAIL OUTBOX - Mark failed and schedule retry
// =============================================================================

async ({ id, error_message }) => {
  return db.optimized.transaction(async (client) => {
    const updated = await client.query(
      `
      UPDATE public.notification_email_outbox
      SET status = CASE WHEN attempt_count + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
          attempt_count = attempt_count + 1,
          last_error = $2,
          next_attempt_at = now() + make_interval(secs => LEAST(3600, (60 * GREATEST(1, attempt_count + 1)))) ,
          updated_at = now()
      WHERE id = $1
      RETURNING *
      `,
      [id, String(error_message || 'Email delivery failed')],
    );
    const row = updated.rows[0];
    await client.query(
      `
      INSERT INTO public.notification_email_delivery_attempt (
        outbox_id, attempt_number, status, error_message
      ) VALUES ($1,$2,'failed',$3)
      `,
      [id, row?.attempt_count || 1, String(error_message || 'Email delivery failed')],
    );
    return row;
  });
};
