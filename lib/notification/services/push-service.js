'use strict';

/**
 * Push Notification Service
 * Handles sending push notifications to mobile devices
 *
 * Supports:
 * - Firebase Cloud Messaging (FCM) for Android/iOS
 * - Apple Push Notification Service (APNS)
 * - Web Push (for browsers)
 */
class PushService {
  constructor(config = {}, logger) {
    this.config = config;
    this.logger = logger;
    this.provider = null;
    this._initialized = false;
  }

  /**
   * Initialize push notification provider
   */
  async initialize() {
    if (this._initialized) return;

    const { enabled = false, provider = 'fcm' } = this.config;

    this.logger.info('[PushService] Initialization check:', {
      enabled,
      provider,
      config: {
        hasFcm: !!this.config.fcm,
        hasApns: !!this.config.apns,
        hasWebPush: !!this.config.webPush,
        webPushPublicKey: this.config.webPush?.publicKey
          ? 'present'
          : 'missing',
        webPushPrivateKey: this.config.webPush?.privateKey
          ? 'present'
          : 'missing',
      },
    });

    if (!enabled) {
      this.logger.info('[PushService] Push notifications are disabled');
      return;
    }

    try {
      this.logger.info(`[PushService] Initializing provider: ${provider}`);
      switch (provider) {
        case 'fcm':
          await this._initializeFCM(this.config.fcm || {});
          break;
        case 'apns':
          await this._initializeAPNS(this.config.apns || {});
          break;
        case 'web-push':
          await this._initializeWebPush(this.config.webPush || {});
          break;
        default:
          throw new Error(`[PushService] Unknown provider: ${provider}`);
      }

      this._initialized = true;
      this.logger.info(
        `[PushService] Push provider "${provider}" initialized successfully`,
      );
    } catch (error) {
      this.logger.error(
        '[PushService] Failed to initialize push provider:',
        error,
      );
      this.logger.error('[PushService] Error details:', {
        message: error.message,
        stack: error.stack,
        provider,
        enabled: this.config.enabled,
      });
      // Don't throw - allow service to continue without push
      this.logger.warn('[PushService] Continuing without push notifications');
    }
  }

  /**
   * Initialize Firebase Cloud Messaging
   */
  async _initializeFCM(config) {
    const { serverKey, projectId } = config;

    if (!serverKey) {
      throw new Error(
        '[PushService] FCM configuration incomplete: serverKey is required',
      );
    }

    // FCM uses HTTP API, no SDK needed
    this.provider = {
      type: 'fcm',
      serverKey,
      projectId,
      apiUrl: 'https://fcm.googleapis.com/fcm/send',
    };
  }

  /**
   * Initialize Apple Push Notification Service
   */
  async _initializeAPNS(config) {
    const {
      keyId,
      teamId,
      bundleId,
      privateKeyPath,
      production = false,
    } = config;

    if (!keyId || !teamId || !bundleId || !privateKeyPath) {
      throw new Error(
        '[PushService] APNS configuration incomplete: keyId, teamId, bundleId, and privateKeyPath are required',
      );
    }

    // Lazy load apn library
    const apn = require('apn');
    const fs = require('fs');

    this.provider = {
      type: 'apns',
      client: new apn.Provider({
        token: {
          key: fs.readFileSync(privateKeyPath),
          keyId,
          teamId,
        },
        production,
      }),
      bundleId,
    };
  }

  /**
   * Initialize Web Push
   */
  async _initializeWebPush(config) {
    const { publicKey, privateKey, email } = config;

    if (!publicKey || !privateKey) {
      throw new Error(
        '[PushService] Web Push configuration incomplete: publicKey and privateKey are required',
      );
    }

    // Lazy load web-push library
    const webpush = require('web-push');

    webpush.setVapidDetails(
      email || 'mailto:notifications@trs.com',
      publicKey,
      privateKey,
    );

    this.provider = {
      type: 'web-push',
      webpush,
    };
  }

  /**
   * Send push notification
   * @param {Object} options - Push options
   * @param {string|string[]} options.to - Device token(s) or subscription(s)
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Object} [options.data] - Additional data payload
   * @param {Object} [options.metadata] - Additional metadata
   * @returns {Promise<Object>} Send result
   */
  async send(options) {
    if (!this._initialized || !this.config.enabled) {
      throw new Error(
        '[PushService] Push service is not initialized or disabled',
      );
    }

    const { to, title, body, data = {}, metadata = {} } = options;

    if (!to || !title || !body) {
      throw new Error(
        '[PushService] Missing required fields: to, title, and body',
      );
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
      switch (this.provider.type) {
        case 'fcm':
          return await this._sendFCM(recipients, title, body, data, metadata);
        case 'apns':
          return await this._sendAPNS(recipients, title, body, data, metadata);
        case 'web-push':
          return await this._sendWebPush(
            recipients,
            title,
            body,
            data,
            metadata,
          );
        default:
          throw new Error(
            `[PushService] Unknown provider type: ${this.provider.type}`,
          );
      }
    } catch (error) {
      this.logger.error(
        '[PushService] Failed to send push notification:',
        error,
      );
      throw error;
    }
  }

  /**
   * Send via FCM
   */
  async _sendFCM(recipients, title, body, data, metadata) {
    const https = require('https');
    const results = [];

    for (const token of recipients) {
      try {
        const payload = JSON.stringify({
          to: token,
          notification: {
            title,
            body,
          },
          data: {
            ...data,
            ...metadata,
          },
        });

        const response = await new Promise((resolve, reject) => {
          const req = https.request(
            this.provider.apiUrl,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `key=${this.provider.serverKey}`,
              },
            },
            (res) => {
              let responseData = '';
              res.on('data', (chunk) => {
                responseData += chunk;
              });
              res.on('end', () => {
                resolve({
                  status: res.statusCode,
                  data: JSON.parse(responseData),
                });
              });
            },
          );

          req.on('error', reject);
          req.write(payload);
          req.end();
        });

        results.push({
          to: token,
          success: response.status === 200 && response.data.success === 1,
          messageId: response.data.message_id,
          response: response.data,
        });
      } catch (error) {
        results.push({
          to: token,
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
   * Send via APNS
   */
  async _sendAPNS(recipients, title, body, data, metadata) {
    const results = [];

    const notification = new this.provider.client.Notification();
    notification.alert = { title, body };
    notification.badge = data.badge;
    notification.sound = data.sound || 'default';
    notification.payload = { ...data, ...metadata };
    notification.topic = this.provider.bundleId;

    for (const token of recipients) {
      try {
        const result = await this.provider.client.send(notification, token);

        results.push({
          to: token,
          success: result.sent.length > 0,
          sent: result.sent,
          failed: result.failed,
        });
      } catch (error) {
        results.push({
          to: token,
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
   * Send via Web Push
   * @param {Array} recipients - Array of PushSubscription objects or subscription data
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {Object} data - Additional data
   * @param {Object} metadata - Metadata
   */
  async _sendWebPush(recipients, title, body, data, metadata) {
    const results = [];

    this.logger.info('[PushService] _sendWebPush called:', {
      recipientsCount: recipients.length,
      title,
      body,
      hasData: !!data,
    });

    // Structure payload to match Service Worker expectations
    // Service Worker expects: { title, body, data: { url, ... } }
    const payload = JSON.stringify({
      title,
      body,
      data: {
        ...data,
        ...metadata,
      },
    });

    this.logger.info('[PushService] Payload prepared:', {
      payloadLength: payload.length,
      payloadPreview: payload.substring(0, 200),
    });

    for (const subscription of recipients) {
      try {
        this.logger.info('[PushService] Processing subscription:', {
          hasEndpoint: !!subscription.endpoint,
          hasKeys: !!subscription.keys,
          hasP256dh: !!subscription.p256dh,
          hasAuth: !!subscription.auth,
          endpointPreview: subscription.endpoint?.substring(0, 50) + '...',
        });

        // Convert subscription format if needed
        // subscription can be:
        // 1. PushSubscription object from browser { endpoint, keys: { p256dh, auth } }
        // 2. Database record { endpoint, p256dh, auth }
        let pushSubscription;

        if (subscription.endpoint && subscription.keys) {
          // Format from browser (PushSubscription object)
          pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          };
          this.logger.info('[PushService] Using browser format subscription');
        } else if (
          subscription.endpoint &&
          subscription.p256dh &&
          subscription.auth
        ) {
          // Format from database
          pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };
          this.logger.info('[PushService] Using database format subscription');
        } else {
          this.logger.error('[PushService] Invalid subscription format:', {
            subscription: Object.keys(subscription),
          });
          throw new Error('Invalid subscription format');
        }

        this.logger.info(
          '[PushService] Sending notification to:',
          pushSubscription.endpoint.substring(0, 50) + '...',
        );
        const result = await this.provider.webpush.sendNotification(
          pushSubscription,
          payload,
        );

        this.logger.info('[PushService] Notification sent successfully:', {
          endpoint: pushSubscription.endpoint.substring(0, 50) + '...',
          statusCode: result.statusCode,
        });

        results.push({
          to: pushSubscription.endpoint,
          success: true,
          statusCode: result.statusCode,
        });
      } catch (error) {
        this.logger.error('[PushService] Failed to send notification:', {
          error: error.message,
          statusCode: error.statusCode,
          endpoint: subscription?.endpoint?.substring(0, 50) + '...',
        });
        // Handle expired/invalid subscriptions
        const isExpired =
          error.statusCode === 410 || // Gone - subscription expired
          error.statusCode === 404; // Not Found - subscription invalid

        results.push({
          to: subscription?.endpoint || 'unknown',
          success: false,
          error: error.message,
          statusCode: error.statusCode,
          expired: isExpired,
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
  PushService,
};
