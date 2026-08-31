// =============================================================================
// NOTIFICATION - Effective email settings from DB with env fallback
// =============================================================================

const formatFrom = ({ fromName, fromEmail, username }) => {
  const email = String(fromEmail || username || '').trim();
  const name = String(fromName || '').trim();
  if (!email) return '';
  return name ? `${name} <${email}>` : email;
};

const envConfig = () => {
  const cfg = config?.notifications?.email || {};
  return {
    source: 'env',
    enabled: !!cfg.enabled,
    provider: 'smtp',
    host: cfg.host || 'smtp.office365.com',
    port: Number(cfg.port || 587),
    secure: !!cfg.secure,
    tlsRejectUnauthorized: cfg.tls?.rejectUnauthorized !== false,
    username: cfg.auth?.user || node.process.env.EMAIL_USER || '',
    password: cfg.auth?.pass || node.process.env.EMAIL_PASS || '',
    from: cfg.from || cfg.auth?.user || node.process.env.EMAIL_USER || '',
    fromEmail: cfg.from || cfg.auth?.user || node.process.env.EMAIL_USER || '',
    fromName: '',
    updatedAt: null,
    passwordConfigured: !!(cfg.auth?.pass || node.process.env.EMAIL_PASS),
    deliveryMode: node.process.env.EMAIL_DELIVERY_MODE || 'sandbox',
    sandboxRecipientEmail: node.process.env.EMAIL_SANDBOX_RECIPIENT || '',
    autoProcessEnabled: node.process.env.EMAIL_AUTO_PROCESS_ENABLED === 'true',
    autoProcessIntervalSeconds: Number(node.process.env.EMAIL_AUTO_PROCESS_INTERVAL_SECONDS || 60),
    autoProcessBatchLimit: Number(node.process.env.EMAIL_AUTO_PROCESS_BATCH_LIMIT || 10),
  };
};

const fromRow = (row) => {
  const username = row?.username || '';
  const password = row?.password_encrypted
    ? lib.notification.emailSettingsCrypto.decrypt(row.password_encrypted)
    : '';
  const fromEmail = row?.from_email || username;
  return {
    source: 'database',
    enabled: !!row.enabled,
    provider: row.provider || 'smtp',
    host: row.host || 'smtp.office365.com',
    port: Number(row.port || 587),
    secure: !!row.secure,
    tlsRejectUnauthorized: row.tls_reject_unauthorized !== false,
    username,
    password,
    from: formatFrom({ fromName: row.from_name, fromEmail, username }),
    fromEmail,
    fromName: row.from_name || '',
    updatedAt: row.updated_at || null,
    updatedBy: row.updated_by || null,
    passwordConfigured: !!row.password_encrypted,
    deliveryMode: row.delivery_mode || 'sandbox',
    sandboxRecipientEmail: row.sandbox_recipient_email || '',
    autoProcessEnabled: !!row.auto_process_enabled,
    autoProcessIntervalSeconds: Number(row.auto_process_interval_seconds || 60),
    autoProcessBatchLimit: Number(row.auto_process_batch_limit || 10),
  };
};

const getEffective = async () => {
  const row = await lib.repository.notification.emailSettings.get();
  if (row) return fromRow(row);
  return envConfig();
};

const publicStatus = async () => {
  const effective = await getEffective();
  return {
    source: effective.source,
    enabled: effective.enabled,
    provider: effective.provider,
    host: effective.host,
    port: effective.port,
    secure: effective.secure,
    tlsRejectUnauthorized: effective.tlsRejectUnauthorized,
    userConfigured: !!effective.username,
    passwordConfigured: !!effective.passwordConfigured,
    username: effective.username || '',
    from: effective.from || '',
    fromEmail: effective.fromEmail || '',
    fromName: effective.fromName || '',
    updatedAt: effective.updatedAt || null,
    updatedBy: effective.updatedBy || null,
    deliveryMode: effective.deliveryMode || 'sandbox',
    sandboxRecipientEmail: effective.sandboxRecipientEmail || '',
    autoProcessEnabled: !!effective.autoProcessEnabled,
    autoProcessIntervalSeconds: Number(effective.autoProcessIntervalSeconds || 60),
    autoProcessBatchLimit: Number(effective.autoProcessBatchLimit || 10),
  };
};

({
  getEffective,
  publicStatus,
});
