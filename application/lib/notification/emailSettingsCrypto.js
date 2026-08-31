// =============================================================================
// NOTIFICATION - Email settings password encryption helpers
// =============================================================================

const PREFIX = 'aes-256-gcm:';

const getSecret = () =>
  node.process.env.EMAIL_SETTINGS_SECRET ||
  config?.sessions?.secret ||
  node.process.env.SESSION_SECRET ||
  '';

const getKey = () => {
  const secret = getSecret();
  if (!secret || String(secret).length < 12) {
    throw new Error('EMAIL_SETTINGS_SECRET or session secret is required to encrypt SMTP password');
  }
  return node.crypto.createHash('sha256').update(String(secret)).digest();
};

const encrypt = (value) => {
  const plain = String(value || '');
  if (!plain) return null;

  const iv = node.crypto.randomBytes(12);
  const cipher = node.crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = node.buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
};

const decrypt = (value) => {
  const packed = String(value || '');
  if (!packed) return '';
  if (!packed.startsWith(PREFIX)) {
    throw new Error('Unsupported SMTP password encryption format');
  }
  const [ivB64, tagB64, encryptedB64] = packed.slice(PREFIX.length).split(':');
  const decipher = node.crypto.createDecipheriv(
    'aes-256-gcm',
    getKey(),
    node.buffer.from(ivB64, 'base64'),
  );
  decipher.setAuthTag(node.buffer.from(tagB64, 'base64'));
  return node.buffer.concat([
    decipher.update(node.buffer.from(encryptedB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

({
  encrypt,
  decrypt,
});
