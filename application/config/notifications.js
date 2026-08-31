({
  // Email notifications configuration
  email: {
    enabled: node.process.env.EMAIL_ENABLED === 'true' || false,
    host: node.process.env.EMAIL_HOST || 'smtp.office365.com',
    port: parseInt(node.process.env.EMAIL_PORT || '587', 10),
    secure: node.process.env.EMAIL_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: node.process.env.EMAIL_USER || '',
      pass: node.process.env.EMAIL_PASS || '',
    },
    from: node.process.env.EMAIL_FROM || node.process.env.EMAIL_USER || '',
    tls: {
      // Reject unauthorized certificates
      rejectUnauthorized:
        node.process.env.EMAIL_TLS_REJECT_UNAUTHORIZED !== 'false',
    },
  },

  // SMS notifications configuration
  sms: {
    enabled: node.process.env.SMS_ENABLED === 'true' || false,
    provider: node.process.env.SMS_PROVIDER || 'twilio', // 'twilio', 'http', 'aws-sns'

    // Twilio configuration
    twilio: {
      accountSid: node.process.env.TWILIO_ACCOUNT_SID || '',
      authToken: node.process.env.TWILIO_AUTH_TOKEN || '',
      fromNumber: node.process.env.TWILIO_FROM_NUMBER || '',
    },

    // HTTP API configuration
    http: {
      url: node.process.env.SMS_HTTP_URL || '',
      method: node.process.env.SMS_HTTP_METHOD || 'POST',
      headers: {},
      bodyTemplate:
        node.process.env.SMS_HTTP_BODY_TEMPLATE || '{{to}}|{{message}}',
    },

    // AWS SNS configuration
    awsSns: {
      region: node.process.env.AWS_SNS_REGION || '',
      accessKeyId: node.process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: node.process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },

  // Push notifications configuration
  push: {
    enabled: node.process.env.PUSH_ENABLED === 'true' || true,
    provider: node.process.env.PUSH_PROVIDER || 'web-push', // 'fcm', 'apns', 'web-push'

    // Firebase Cloud Messaging (FCM)
    fcm: {
      serverKey: node.process.env.FCM_SERVER_KEY || '',
      projectId: node.process.env.FCM_PROJECT_ID || '',
    },

    // Apple Push Notification Service (APNS)
    apns: {
      keyId: node.process.env.APNS_KEY_ID || '',
      teamId: node.process.env.APNS_TEAM_ID || '',
      bundleId: node.process.env.APNS_BUNDLE_ID || '',
      privateKeyPath: node.process.env.APNS_PRIVATE_KEY_PATH || '',
      production: node.process.env.APNS_PRODUCTION === 'true' || false,
    },

    // Web Push
    webPush: {
      publicKey:
        node.process.env.WEB_PUSH_PUBLIC_KEY ||
        'BNJ4nsS-BTVgx1JLPr-RDXRJ9V9Nj2tWJfjDLnCgpl3PAQG1NcfhdBGP_P7jOOI1j6orvX09hUVkeiSBMBZBDLU',
      privateKey:
        node.process.env.WEB_PUSH_PRIVATE_KEY ||
        'rPDyCjtYjhx0zbyl2hqhrqXe9QQhuU1zoNfxw7wqmGU',
      email: node.process.env.WEB_PUSH_EMAIL || 'mailto:notifications@trs.com',
    },
  },
});
