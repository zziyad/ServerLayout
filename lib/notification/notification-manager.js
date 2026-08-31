'use strict';

const { EmailService } = require('./services/email-service.js');
const { SMSService } = require('./services/sms-service.js');
const { PushService } = require('./services/push-service.js');

/**
 * Notification Manager
 * Coordinates all notification channels (Email, SMS, Push)
 * Note: Database operations are handled in Repository Layer, not here
 */
class NotificationManager {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;

    // Initialize services
    this.emailService = new EmailService(config.email || {}, logger);
    this.smsService = new SMSService(config.sms || {}, logger);
    this.pushService = new PushService(config.push || {}, logger);

    this._initialized = false;
  }

  /**
   * Initialize all notification services
   */
  async initialize() {
    if (this._initialized) return;

    try {
      const results = await Promise.allSettled([
        this.emailService.initialize(),
        this.smsService.initialize(),
        this.pushService.initialize(),
      ]);

      // Log initialization results
      results.forEach((result, index) => {
        const serviceNames = ['email', 'sms', 'push'];
        const serviceName = serviceNames[index];
        if (result.status === 'fulfilled') {
          this.logger.info(
            `[NotificationManager] ${serviceName} service initialized`,
          );
        } else {
          this.logger.error(
            `[NotificationManager] ${serviceName} service initialization failed:`,
            result.reason,
          );
        }
      });

      // Log push service status
      const pushStatus = this.pushService.getStatus();
      this.logger.info(
        '[NotificationManager] Push service status:',
        pushStatus,
      );

      this._initialized = true;
      this.logger.info(
        '[NotificationManager] All notification services initialized',
      );
    } catch (error) {
      this.logger.error(
        '[NotificationManager] Failed to initialize services:',
        error,
      );
      throw error;
    }
  }

  /**
   * Send notification via specified channels
   * @param {Object} notification - Notification data
   * @param {string} notification.type - Notification type (e.g., 'fleet_updated', 'route_assigned')
   * @param {string} notification.recipientType - 'user', 'driver', 'guest'
   * @param {string} notification.recipientId - Recipient ID
   * @param {string} [notification.recipientEmail] - Recipient email
   * @param {string} [notification.recipientPhone] - Recipient phone
   * @param {string} [notification.recipientPushToken] - Push token
   * @param {string[]} notification.channels - ['email', 'sms', 'push']
   * @param {string} notification.subject - Subject/title
   * @param {string} notification.message - Message body
   * @param {string} [notification.html] - HTML content (for email)
   * @param {Object} [notification.data] - Additional data
   * @param {Object} [notification.metadata] - Metadata
   * @returns {Promise<Object>} Send results
   */
  async send(notification) {
    if (!this._initialized) {
      throw new Error(
        '[NotificationManager] Not initialized. Call initialize() first.',
      );
    }

    const {
      type,
      recipientType,
      recipientId,
      recipientEmail,
      recipientPhone,
      recipientPushToken,
      channels = [],
      subject,
      message,
      html,
      data = {},
      metadata = {},
    } = notification;

    // Validate required fields
    // For dispatcher portal, recipientId can be null if recipientPushToken is provided
    const channelsArray = Array.isArray(channels) ? channels : [];
    if (
      !type ||
      !recipientType ||
      !channelsArray.length ||
      !subject ||
      !message
    ) {
      this.logger?.error('[NotificationManager] Validation failed:', {
        hasType: !!type,
        hasRecipientType: !!recipientType,
        hasChannels: !!channelsArray.length,
        hasSubject: !!subject,
        hasMessage: !!message,
        type,
        recipientType,
        channels: channels,
        channelsArray: channelsArray,
        channelsLength: channelsArray.length,
      });
      throw new Error(
        '[NotificationManager] Missing required fields: type, recipientType, channels, subject, message',
      );
    }

    // recipientId is required unless it's a dispatcher or vapp notification with push tokens
    if (
      !recipientId &&
      recipientType !== 'dispatcher' &&
      recipientType !== 'vapp'
    ) {
      throw new Error(
        '[NotificationManager] Missing required field: recipientId',
      );
    }

    // For dispatcher/VAPP portal, recipientPushToken is required instead of recipientId
    if (
      (recipientType === 'dispatcher' || recipientType === 'vapp') &&
      !recipientPushToken
    ) {
      this.logger?.error(
        `[NotificationManager] ${recipientType} notification missing recipientPushToken:`,
        {
          recipientType,
          hasRecipientPushToken: !!recipientPushToken,
          recipientPushTokenType: typeof recipientPushToken,
          isArray: Array.isArray(recipientPushToken),
          length: Array.isArray(recipientPushToken)
            ? recipientPushToken.length
            : 'N/A',
        },
      );
      throw new Error(
        `[NotificationManager] Missing required field: recipientPushToken for ${recipientType} notifications`,
      );
    }

    const results = {
      channels: {},
      success: false,
    };

    // Send via each channel
    const sendPromises = [];

    if (channelsArray.includes('email') && recipientEmail) {
      sendPromises.push(
        this._sendEmail({
          to: recipientEmail,
          subject,
          text: message,
          html,
          metadata,
        }).then((result) => {
          results.channels.email = result;
          return result;
        }),
      );
    }

    if (channelsArray.includes('sms') && recipientPhone) {
      sendPromises.push(
        this._sendSMS({
          to: recipientPhone,
          message: `${subject}\n\n${message}`,
          metadata,
        }).then((result) => {
          results.channels.sms = result;
          return result;
        }),
      );
    }

    if (channelsArray.includes('push') && recipientPushToken) {
      // Handle both single subscription and array of subscriptions
      const pushTokens = Array.isArray(recipientPushToken)
        ? recipientPushToken
        : [recipientPushToken];

      sendPromises.push(
        this._sendPush({
          to: pushTokens,
          title: subject,
          body: message,
          data,
          metadata,
        }).then((result) => {
          results.channels.push = result;
          return result;
        }),
      );
    }

    // Wait for all sends to complete
    const channelResults = await Promise.allSettled(sendPromises);

    // Check if all channels succeeded
    const allSuccess = channelResults.every(
      (r) => r.status === 'fulfilled' && r.value?.success !== false,
    );
    results.success = allSuccess;

    return results;
  }

  /**
   * Send email via EmailService
   */
  async _sendEmail(options) {
    try {
      if (!this.emailService.isReady()) {
        return { success: false, error: 'Email service not ready' };
      }
      return await this.emailService.send(options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS via SMSService
   */
  async _sendSMS(options) {
    try {
      if (!this.smsService.isReady()) {
        return { success: false, error: 'SMS service not ready' };
      }
      return await this.smsService.send(options);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push via PushService
   */
  async _sendPush(options) {
    try {
      const pushStatus = this.pushService.getStatus();
      this.logger.info(
        '[NotificationManager] Push service status:',
        pushStatus,
      );

      if (!this.pushService.isReady()) {
        this.logger.info(
          '[NotificationManager] Push service not ready:',
          pushStatus,
        );
        return {
          success: false,
          error: 'Push service not ready',
          status: pushStatus,
        };
      }

      this.logger.info('[NotificationManager] Sending push notification:', {
        toCount: Array.isArray(options.to) ? options.to.length : 1,
        title: options.title,
        body: options.body,
        hasData: !!options.data,
      });

      const result = await this.pushService.send(options);

      this.logger.info('[NotificationManager] Push notification result:', {
        success: result.success,
        resultsCount: result.results?.length || 0,
      });

      return result;
    } catch (error) {
      this.logger.error('[NotificationManager] Push send error:', error);
      this.logger.error(
        '[NotificationManager] Push send error stack:',
        error.stack,
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get service statuses
   */
  getStatus() {
    return {
      initialized: this._initialized,
      email: this.emailService.getStatus(),
      sms: this.smsService.getStatus(),
      push: this.pushService.getStatus(),
    };
  }
}

module.exports = {
  NotificationManager,
};
