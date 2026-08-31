// =============================================================================
// NOTIFICATION - Enqueue a manual test email
// =============================================================================

async ({ to, subject, message } = {}, context) => {
  const recipient = String(to || '').trim().toLowerCase();
  if (!recipient) throw new Error('to is required');

  const text = String(
    message ||
      `This is a test email from the Gate Pass notification system.\nSent at: ${new Date().toISOString()}`,
  );

  const row = await lib.repository.notification.emailOutbox.create({
    recipient_email: recipient,
    subject: subject || 'Test email from Gate Pass notification system',
    text_body: text,
    html_body: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a"><h2>Gate Pass email test</h2><p>${text.replace(/\n/g, '<br>')}</p></div>`,
    module: 'notification',
    event_type: 'TEST_EMAIL',
    metadata: {
      requested_by: context?.client?.session?.state?.auth?.user_id || context?.client?.session?.state?.id || null,
    },
  });

  return { queued: true, email: row };
};
