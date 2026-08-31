#!/usr/bin/env node
'use strict';

/**
 * Microsoft 365 SMTP email smoke test.
 *
 * Usage:
 *   EMAIL_USER="system.notification@absheronhotelgroup.com" \
 *   EMAIL_PASS="<password-or-app-password>" \
 *   EMAIL_TO="ziyad.seykhanov@absheronhotelgroup.com" \
 *   node scripts/test-m365-email.js
 *
 * Optional:
 *   EMAIL_FROM="System Notification <system.notification@absheronhotelgroup.com>"
 *   EMAIL_SUBJECT="Test email from Gate Pass"
 */

const nodemailer = require('nodemailer');

const required = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_TO'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;
const to = process.env.EMAIL_TO;
const from = process.env.EMAIL_FROM || `System Notification <${user}>`;
const subject = process.env.EMAIL_SUBJECT || 'Test email from Gate Pass notification system';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.office365.com',
  port: Number(process.env.EMAIL_PORT || 587),
  secure: false,
  auth: { user, pass },
  requireTLS: true,
  tls: {
    minVersion: 'TLSv1.2',
  },
});

async function main() {
  console.log('Verifying SMTP connection...');
  await transporter.verify();
  console.log('SMTP connection verified. Sending test email...');

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: [
      'Hello,',
      '',
      'This is a test email from the Gate Pass notification system.',
      `Sent at: ${new Date().toISOString()}`,
      '',
      'If you received this, Microsoft 365 SMTP sending is working.',
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
        <h2>Gate Pass email test</h2>
        <p>This is a test email from the Gate Pass notification system.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you received this, Microsoft 365 SMTP sending is working.</p>
      </div>
    `,
  });

  console.log('Email sent successfully.');
  console.log(JSON.stringify({
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    response: info.response,
  }, null, 2));
}

main().catch((error) => {
  console.error('Email test failed:');
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
