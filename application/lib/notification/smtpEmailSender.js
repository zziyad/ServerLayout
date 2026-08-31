// =============================================================================
// Dependency-free SMTP email sender for Microsoft 365 / STARTTLS SMTP.
// =============================================================================

const b64 = (value) => node.buffer.from(String(value), 'utf8').toString('base64');

const dotStuff = (message) => String(message || '').replace(/^\./gm, '..');

const escapeHtml = (value) =>
  String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const headerSafe = (value) => String(value || '').replace(/[\r\n]+/g, ' ').trim();

const addressOnly = (value) => {
  const text = String(value || '').trim();
  const match = text.match(/<([^>]+)>/);
  return (match ? match[1] : text).trim();
};

const createClient = (socket) => {
  let buffer = '';
  const waiters = [];

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    flush();
  });

  socket.on('error', (error) => {
    while (waiters.length) waiters.shift().reject(error);
  });

  const flush = () => {
    const lines = buffer.split(/\r?\n/);
    if (!buffer.match(/\r?\n$/)) buffer = lines.pop();
    else buffer = '';

    for (const line of lines) {
      if (!line) continue;
      const waiter = waiters[0];
      if (!waiter) continue;
      waiter.lines.push(line);
      if (/^\d{3} /.test(line)) {
        waiters.shift();
        waiter.resolve(waiter.lines.join('\n'));
      }
    }
  };

  const read = () =>
    new Promise((resolve, reject) => {
      waiters.push({ resolve, reject, lines: [] });
      flush();
    });

  const write = (command) => socket.write(command + '\r\n');

  const expect = async (command, okCodes) => {
    if (command) write(command);
    const response = await read();
    const code = Number(response.slice(0, 3));
    if (!okCodes.includes(code)) {
      throw new Error(
        `SMTP command failed${command ? ` after ${command.split(' ')[0]}` : ''}: ${response}`,
      );
    }
    return response;
  };

  return { socket, read, write, expect };
};

const timeoutPromise = (ms, label) =>
  new Promise((_, reject) => {
    const timer = node.setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    timer.unref?.();
  });

const withTimeout = (promise, ms, label) =>
  Promise.race([promise, timeoutPromise(ms, label)]);

const buildMessage = ({ from, to, subject, text, html }) => {
  const boundary = `gatepass-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const textBody = String(text || '').replace(/\n/g, '\r\n');
  const htmlBody = html || `<pre>${escapeHtml(textBody)}</pre>`;

  return [
    `From: ${headerSafe(from)}`,
    `To: ${headerSafe(to)}`,
    `Subject: ${headerSafe(subject)}`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    textBody,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');
};

const send = async ({ to, subject, text, html, from }) => {
  const cfg = await lib.notification.emailSettingsConfig.getEffective();
  if (!cfg.enabled) throw new Error('Email notifications are disabled');

  const host = cfg.host || 'smtp.office365.com';
  const port = Number(cfg.port || 587);
  const user = cfg.username || node.process.env.EMAIL_USER;
  const pass = cfg.password || node.process.env.EMAIL_PASS;
  const fromHeader = from || cfg.from || user;
  const fromAddress = addressOnly(fromHeader);
  const timeoutMs = Number(node.process.env.EMAIL_TIMEOUT_MS || 30000);

  if (!user || !pass) throw new Error('SMTP username and password are required');
  if (!to || !subject || !text) throw new Error('to, subject, and text are required');

  const rawSocket = node.net.createConnection({ host, port });
  let client = createClient(rawSocket);

  try {
    await withTimeout(client.expect(null, [220]), timeoutMs, 'SMTP greeting');
    await withTimeout(client.expect('EHLO gatepass.local', [250]), timeoutMs, 'SMTP EHLO');
    await withTimeout(client.expect('STARTTLS', [220]), timeoutMs, 'SMTP STARTTLS');

    const secureSocket = node.tls.connect({
      socket: rawSocket,
      host,
      servername: host,
      rejectUnauthorized: cfg.tlsRejectUnauthorized !== false,
    });
    await withTimeout(
      new Promise((resolve, reject) => {
        secureSocket.once('secureConnect', resolve);
        secureSocket.once('error', reject);
      }),
      timeoutMs,
      'SMTP TLS handshake',
    );

    client = createClient(secureSocket);
    await withTimeout(client.expect('EHLO gatepass.local', [250]), timeoutMs, 'SMTP EHLO TLS');
    await withTimeout(client.expect('AUTH LOGIN', [334]), timeoutMs, 'SMTP AUTH');
    await withTimeout(client.expect(b64(user), [334]), timeoutMs, 'SMTP AUTH user');
    await withTimeout(client.expect(b64(pass), [235]), timeoutMs, 'SMTP AUTH pass');

    await withTimeout(client.expect(`MAIL FROM:<${fromAddress}>`, [250]), timeoutMs, 'SMTP MAIL FROM');
    await withTimeout(client.expect(`RCPT TO:<${addressOnly(to)}>`, [250, 251]), timeoutMs, 'SMTP RCPT TO');
    await withTimeout(client.expect('DATA', [354]), timeoutMs, 'SMTP DATA');

    const message = buildMessage({ from: fromHeader, to, subject, text, html });
    client.write(dotStuff(message) + '\r\n.');
    const response = await withTimeout(client.read(), timeoutMs, 'SMTP DATA response');
    const code = Number(response.slice(0, 3));
    if (code !== 250) throw new Error(`SMTP DATA failed: ${response}`);

    try {
      await client.expect('QUIT', [221]);
    } catch {}

    const idMatch = response.match(/<([^>]+)>/);
    return {
      success: true,
      response,
      messageId: idMatch ? idMatch[1] : null,
    };
  } finally {
    try {
      client.socket.end();
    } catch {}
  }
};

const status = async () => lib.notification.emailSettingsConfig.publicStatus();

({
  send,
  status,
});
