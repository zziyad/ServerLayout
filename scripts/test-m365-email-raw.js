#!/usr/bin/env node
'use strict';

const net = require('node:net');
const tls = require('node:tls');

const required = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const host = process.env.EMAIL_HOST || 'smtp.office365.com';
const port = Number(process.env.EMAIL_PORT || 587);
const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const to = process.env.EMAIL_TO;
const fromAddress = process.env.EMAIL_FROM_ADDRESS || user;
const fromName = process.env.EMAIL_FROM_NAME || 'System Notification';
const subject = process.env.EMAIL_SUBJECT || 'Test email from Gate Pass notification system';

function b64(value) {
  return Buffer.from(String(value), 'utf8').toString('base64');
}

function formatDate() {
  return new Date().toUTCString();
}

function dotStuff(message) {
  return message.replace(/^\./gm, '..');
}

function createClient(socket) {
  let buffer = '';
  const waiters = [];

  socket.on('data', (chunk) => {
    buffer += chunk.toString('utf8');
    flush();
  });

  socket.on('error', (error) => {
    while (waiters.length) waiters.shift().reject(error);
  });

  function flush() {
    const lines = buffer.split(/\r?\n/);
    if (!buffer.match(/\r?\n$/)) {
      buffer = lines.pop();
    } else {
      buffer = '';
    }

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
  }

  function read() {
    return new Promise((resolve, reject) => {
      waiters.push({ resolve, reject, lines: [] });
      flush();
    });
  }

  function write(command) {
    socket.write(command + '\r\n');
  }

  async function expect(command, okCodes) {
    if (command) write(command);
    const response = await read();
    const code = Number(response.slice(0, 3));
    if (!okCodes.includes(code)) {
      throw new Error(`SMTP command failed${command ? ` after ${command.split(' ')[0]}` : ''}: ${response}`);
    }
    return response;
  }

  return { socket, read, write, expect };
}

async function main() {
  console.log(`Connecting to ${host}:${port}...`);
  const rawSocket = net.createConnection({ host, port });
  let client = createClient(rawSocket);

  await client.expect(null, [220]);
  await client.expect('EHLO gatepass.local', [250]);
  await client.expect('STARTTLS', [220]);

  const secureSocket = tls.connect({ socket: rawSocket, host, servername: host });
  await new Promise((resolve, reject) => {
    secureSocket.once('secureConnect', resolve);
    secureSocket.once('error', reject);
  });
  client = createClient(secureSocket);

  await client.expect('EHLO gatepass.local', [250]);
  await client.expect('AUTH LOGIN', [334]);
  await client.expect(b64(user), [334]);
  await client.expect(b64(pass), [235]);

  await client.expect(`MAIL FROM:<${fromAddress}>`, [250]);
  await client.expect(`RCPT TO:<${to}>`, [250, 251]);
  await client.expect('DATA', [354]);

  const bodyText = [
    'Hello,',
    '',
    'This is a test email from the Gate Pass notification system.',
    `Sent at: ${new Date().toISOString()}`,
    '',
    'If you received this, Microsoft 365 SMTP sending is working.',
  ].join('\r\n');

  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">',
    '<h2>Gate Pass email test</h2>',
    '<p>This is a test email from the Gate Pass notification system.</p>',
    `<p><strong>Sent at:</strong> ${new Date().toISOString()}</p>`,
    '<p>If you received this, Microsoft 365 SMTP sending is working.</p>',
    '</div>',
  ].join('');

  const boundary = `gatepass-${Date.now()}`;
  const message = [
    `From: ${fromName} <${fromAddress}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Date: ${formatDate()}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    bodyText,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    '',
    `--${boundary}--`,
    '',
  ].join('\r\n');

  client.write(dotStuff(message) + '\r\n.');
  const queued = await client.read();
  const queuedCode = Number(queued.slice(0, 3));
  if (queuedCode !== 250) throw new Error(`SMTP DATA failed: ${queued}`);

  await client.expect('QUIT', [221]);
  console.log('Email accepted by Microsoft 365 SMTP.');
  console.log(queued);
}

main().catch((error) => {
  console.error('Email test failed:');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
