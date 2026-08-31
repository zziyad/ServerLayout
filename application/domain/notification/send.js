// =============================================================================
// NOTIFICATION SEND - Send notifications via Email/SMS/Push
// =============================================================================

async (payload, context) => {
  const notificationManager =
    context?.notificationManager || context?.application?.notificationManager;

  if (!notificationManager) {
    throw new Error('NotificationManager is not available');
  }

  // Основная валидация уже выполнена в API слое через JSON Schema
  // Здесь только бизнес-логика

  const {
    type,
    recipientType,
    recipientId,
    recipientEmail,
    recipientPhone,
    recipientPushToken,
    channels,
    subject,
    message,
    html,
    data = {},
    metadata = {},
  } = payload;

  // 1. REPOSITORY: Store notification in DB (one record per channel)
  const notificationRecords = [];
  for (const channel of channels) {
    const contact =
      channel === 'email'
        ? recipientEmail
        : channel === 'sms'
        ? recipientPhone
        : channel === 'push'
        ? recipientPushToken
        : null;

    if (contact) {
      const notificationRecord = await lib.repository.notification.create({
        notification_type: type,
        channel,
        recipient_type: recipientType,
        recipient_id: recipientId,
        recipient_contact: contact,
        subject,
        message,
        status: 'pending',
        metadata: {
          ...metadata,
          sentBy: context?.session?.user?.id || null,
          sentAt: new Date().toISOString(),
        },
      });
      notificationRecords.push(notificationRecord);
    }
  }

  // 2. NOTIFICATION MANAGER: Send notification via channels
  const result = await notificationManager.send({
    type,
    recipientType,
    recipientId,
    recipientEmail,
    recipientPhone,
    recipientPushToken,
    channels,
    subject,
    message,
    html,
    data,
    metadata: {
      ...metadata,
      sentBy: context?.session?.user?.id || null,
      sentAt: new Date().toISOString(),
    },
  });

  // 3. REPOSITORY: Update notification status in DB
  const errorMessage = result.success
    ? null
    : JSON.stringify(
        Object.entries(result.channels)
          .filter(([, r]) => !r.success)
          .map(([ch, r]) => ({ channel: ch, error: r.error })),
      );

  for (const record of notificationRecords) {
    try {
      await lib.repository.notification.updateStatus({
        notification_id: record.id,
        status: result.success ? 'sent' : 'failed',
        error_message: errorMessage,
        metadata: result,
      });
    } catch (error) {
      console.error('Failed to update notification status:', error);
    }
  }

  // 4. RETURN: Result with notification IDs
  return {
    ...result,
    notificationIds: notificationRecords.map((r) => r.id),
  };
};
