'use strict';

const nodemailer = require('nodemailer');

/**
 * Email Notification Service
 * Handles sending email notifications via SMTP
 */
class EmailService {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;
    this.transporter = null;
    this._initialized = false;
  }

  /**
   * Initialize email transporter
   */
  async initialize() {
    if (this._initialized) return;

    const {
      enabled = false,
      host,
      port = 587,
      secure = false,
      auth = {},
      tls = {},
    } = this.config;

    if (!enabled) {
      this.logger.warn('[EmailService] Email notifications are disabled');
      return;
    }

    if (!host || !auth.user || !auth.pass) {
      throw new Error(
        '[EmailService] SMTP configuration incomplete: host, auth.user, and auth.pass are required',
      );
    }

    try {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
          user: auth.user,
          pass: auth.pass,
        },
        tls,
      });

      // Verify connection
      await this.transporter.verify();
      this._initialized = true;
      this.logger.info(
        '[EmailService] Email transporter initialized successfully',
      );
    } catch (error) {
      this.logger.error(
        '[EmailService] Failed to initialize email transporter:',
        error,
      );
      throw error;
    }
  }

  /**
   * Send email notification
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content
   * @param {string} [options.html] - HTML content
   * @param {string} [options.from] - Sender email (defaults to config)
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    if (!this._initialized || !this.config.enabled) {
      throw new Error(
        '[EmailService] Email service is not initialized or disabled',
      );
    }

    const { to, subject, text, html, from, metadata = {} } = options;

    if (!to || !subject || (!text && !html)) {
      throw new Error(
        '[EmailService] Missing required fields: to, subject, and (text or html)',
      );
    }

    const mailOptions = {
      from: from || this.config.from || this.config.auth?.user,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
      headers: {
        'X-Notification-Type': 'email',
        ...(metadata.headers || {}),
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.info('[EmailService] Email sent successfully', {
        to,
        subject,
        messageId: info.messageId,
      });

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      this.logger.error('[EmailService] Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Check if service is enabled and initialized
   */
  isReady() {
    return this._initialized && this.config.enabled;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      enabled: this.config.enabled || false,
      initialized: this._initialized,
      ready: this.isReady(),
    };
  }
}

module.exports = {
  EmailService,
};
