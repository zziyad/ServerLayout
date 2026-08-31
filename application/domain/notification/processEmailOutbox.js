// =============================================================================
// NOTIFICATION - Process pending email outbox items
// =============================================================================

const stripHtml = (html) => String(html || '').replace(/<[^>]+>/g, ' ');

const sandboxHtmlNotice = (originalTo) =>
  `<div style="padding:12px;margin:0 0 16px;border:1px solid #f59e0b;background:#fffbeb;color:#92400e;font-family:Arial,sans-serif;font-size:13px"><strong>SANDBOX DELIVERY</strong><br>Original recipient: ${String(originalTo || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`;

const resolveDelivery = (item, settings) => {
  const mode = settings.deliveryMode || 'sandbox';
  if (mode === 'sandbox') {
    const sandboxTo = String(settings.sandboxRecipientEmail || '').trim().toLowerCase();
    if (!sandboxTo) throw new Error('Sandbox recipient email is required in sandbox delivery mode');
    const originalTo = item.recipient_email;
    return {
      to: sandboxTo,
      subject: `[SANDBOX for ${originalTo}] ${item.subject}`,
      text: `SANDBOX DELIVERY\nOriginal recipient: ${originalTo}\n\n${item.text_body || stripHtml(item.html_body)}`,
      html: `${sandboxHtmlNotice(originalTo)}${item.html_body || `<pre>${item.text_body || ''}</pre>`}`,
      mode,
      originalTo,
    };
  }
  return {
    to: item.recipient_email,
    subject: item.subject,
    text: item.text_body,
    html: item.html_body,
    mode,
    originalTo: item.recipient_email,
  };
};

async ({ limit = 10 } = {}) => {
  const settings = await lib.notification.emailSettingsConfig.publicStatus();
  if (!settings.enabled || settings.deliveryMode === 'disabled') {
    return {
      processed: 0,
      skipped: true,
      reason: !settings.enabled ? 'Email notifications are disabled' : 'Email delivery mode is disabled',
      results: [],
    };
  }

  const items = await lib.repository.notification.emailOutbox.listPending({ limit });
  const results = [];

  for (const item of items) {
    const locked = await lib.repository.notification.emailOutbox.markSending({
      id: item.id,
    });
    if (!locked) continue;

    try {
      const delivery = resolveDelivery(locked, settings);
      const sent = await lib.notification.smtpEmailSender.send({
        to: delivery.to,
        subject: delivery.subject,
        text: delivery.text,
        html: delivery.html,
      });
      const updated = await lib.repository.notification.emailOutbox.markSent({
        id: locked.id,
        provider_response: sent.response,
        provider_message_id: sent.messageId,
      });
      results.push({
        id: locked.id,
        status: 'sent',
        message_id: sent.messageId,
        delivery_mode: delivery.mode,
        original_recipient: delivery.originalTo,
        actual_recipient: delivery.to,
        row: updated,
      });
    } catch (error) {
      const updated = await lib.repository.notification.emailOutbox.markFailed({
        id: locked.id,
        error_message: error?.message || String(error),
      });
      results.push({ id: locked.id, status: 'failed', error: error?.message || String(error), row: updated });
    }
  }

  return {
    processed: results.length,
    results,
  };
};
