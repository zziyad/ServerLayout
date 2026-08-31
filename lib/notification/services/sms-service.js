'use strict';

/**
 * SMS Notification Service
 * Handles sending SMS notifications via various providers
 *
 * Supports multiple providers:
 * - Twilio (default)
 * - Custom HTTP API
 * - AWS SNS
 */
class SMSService {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;
    this.provider = null;
    this._initialized = false;
  }

  /**
   * Initialize SMS provider
   */
  async initialize() {
    if (this._initialized) return;

    const { enabled = false, provider = 'twilio' } = this.config;

    if (!enabled) {
      this.logger.warn('[SMSService] SMS notifications are disabled');
      return;
    }

    try {
      switch (provider) {
        case 'twilio':
          await this._initializeTwilio(this.config.twilio || {});
          break;
        case 'http':
          await this._initializeHttp(this.config.http || {});
          break;
        case 'aws-sns':
          await this._initializeAwsSns(this.config.awsSns || {});
          break;
        default:
          throw new Error(`[SMSService] Unknown provider: ${provider}`);
      }

      this._initialized = true;
      this.logger.info(
        `[SMSService] SMS provider "${provider}" initialized successfully`,
      );
    } catch (error) {
      this.logger.error(
        '[SMSService] Failed to initialize SMS provider:',
        error,
      );
      throw error;
    }
  }

  /**
   * Initialize Twilio provider
   */
  async _initializeTwilio(config) {
    const { accountSid, authToken, fromNumber } = config;

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error(
        '[SMSService] Twilio configuration incomplete: accountSid, authToken, and fromNumber are required',
      );
    }

    // Lazy load Twilio to avoid requiring it if not used
    const twilio = require('twilio');
    this.provider = {
      type: 'twilio',
      client: twilio(accountSid, authToken),
      fromNumber,
    };
  }

  /**
   * Initialize HTTP API provider
   */
  async _initializeHttp(config) {
    const { url, method = 'POST', headers = {}, bodyTemplate } = config;

    if (!url) {
      throw new Error('[SMSService] HTTP provider requires url');
    }

    this.provider = {
      type: 'http',
      url,
      method,
      headers,
      bodyTemplate,
    };
  }

  /**
   * Initialize AWS SNS provider
   */
  async _initializeAwsSns(config) {
    const { region, accessKeyId, secretAccessKey } = config;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        '[SMSService] AWS SNS configuration incomplete: region, accessKeyId, and secretAccessKey are required',
      );
    }

    // Lazy load AWS SDK
    const AWS = require('aws-sdk');
    this.provider = {
      type: 'aws-sns',
      client: new AWS.SNS({
        region,
        accessKeyId,
        secretAccessKey,
      }),
    };
  }

  /**
   * Send SMS notification
   * @param {Object} options - SMS options
   * @param {string|string[]} options.to - Recipient phone number(s)
   * @param {string} options.message - SMS message text
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    if (!this._initialized || !this.config.enabled) {
      throw new Error(
        '[SMSService] SMS service is not initialized or disabled',
      );
    }

    const { to, message, metadata = {} } = options;

    if (!to || !message) {
      throw new Error('[SMSService] Missing required fields: to and message');
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
      switch (this.provider.type) {
        case 'twilio':
          return await this._sendTwilio(recipients, message, metadata);
        case 'http':
          return await this._sendHttp(recipients, message, metadata);
        case 'aws-sns':
          return await this._sendAwsSns(recipients, message, metadata);
        default:
          throw new Error(
            `[SMSService] Unknown provider type: ${this.provider.type}`,
          );
      }
    } catch (error) {
      this.logger.error('[SMSService] Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send via Twilio
   */
  async _sendTwilio(recipients, message, metadata) {
    const results = [];

    for (const phoneNumber of recipients) {
      try {
        const result = await this.provider.client.messages.create({
          body: message,
          from: this.provider.fromNumber,
          to: phoneNumber,
        });

        results.push({
          to: phoneNumber,
          success: true,
          sid: result.sid,
          status: result.status,
        });

        this.logger.info('[SMSService] SMS sent via Twilio', {
          to: phoneNumber,
          sid: result.sid,
        });
      } catch (error) {
        results.push({
          to: phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
  }

  /**
   * Send via HTTP API
   */
  async _sendHttp(recipients, message, metadata) {
    const http = require('http');
    const https = require('https');
    const { URL } = require('url');

    const url = new URL(this.provider.url);
    const client = url.protocol === 'https:' ? https : http;

    const results = [];

    for (const phoneNumber of recipients) {
      try {
        const body = this.provider.bodyTemplate
          ? this.provider.bodyTemplate
              .replace('{{to}}', phoneNumber)
              .replace('{{message}}', message)
          : JSON.stringify({ to: phoneNumber, message });

        const response = await new Promise((resolve, reject) => {
          const req = client.request(
            url,
            {
              method: this.provider.method,
              headers: {
                'Content-Type': 'application/json',
                ...this.provider.headers,
              },
            },
            (res) => {
              let data = '';
              res.on('data', (chunk) => {
                data += chunk;
              });
              res.on('end', () => {
                resolve({ status: res.statusCode, data });
              });
            },
          );

          req.on('error', reject);
          req.write(body);
          req.end();
        });

        results.push({
          to: phoneNumber,
          success: response.status >= 200 && response.status < 300,
          response: response.data,
        });
      } catch (error) {
        results.push({
          to: phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
  }

  /**
   * Send via AWS SNS
   */
  async _sendAwsSns(recipients, message, metadata) {
    const results = [];

    for (const phoneNumber of recipients) {
      try {
        const result = await this.provider.client
          .publish({
            PhoneNumber: phoneNumber,
            Message: message,
          })
          .promise();

        results.push({
          to: phoneNumber,
          success: true,
          messageId: result.MessageId,
        });
      } catch (error) {
        results.push({
          to: phoneNumber,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      success: results.every((r) => r.success),
      results,
    };
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
      provider: this.provider?.type || null,
    };
  }
}

module.exports = {
  SMSService,
};
