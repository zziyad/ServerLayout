'use strict';

const loger = require('../logger');

class NotificationDispatcher {
  constructor(options = {}) {
    this.logger = loger;
    this.channels = new Map();
    this._metrics = {
      dispatched: 0,
      succeeded: 0,
      failed: 0,
    };
  }

  registerChannel(name, handler) {
    if (!name || typeof name !== 'string')
      throw new TypeError('channel name must be a string');
    if (typeof handler !== 'function')
      throw new TypeError('channel handler must be a function');
    if (this.channels.has(name))
      throw new Error(`channel "${name}" already registered`);
    this.channels.set(name, handler);
  }

  unregisterChannel(name) {
    this.channels.delete(name);
  }

  async dispatch(message) {
    if (!message || typeof message !== 'object')
      throw new TypeError('message must be an object');
    const targets =
      Array.isArray(message.channels) && message.channels.length > 0
        ? message.channels
        : [{ type: 'broadcast', payload: message.payload ?? message.event }];

    const results = await Promise.allSettled(
      targets.map(async (target) => {
        const channel = target?.type;
        if (!channel || !this.channels.has(channel)) {
          throw new Error(`channel "${channel}" not registered`);
        }
        const handler = this.channels.get(channel);
        await handler({ ...message, target });
      }),
    );

    this._metrics.dispatched += results.length;
    for (const result of results) {
      if (result.status === 'fulfilled') this._metrics.succeeded++;
      else {
        this._metrics.failed++;
        this.logger.error(
          '[NotificationDispatcher] channel error:',
          result.reason,
        );
      }
    }

    return results;
  }

  getStats() {
    return {
      channelCount: this.channels.size,
      ...this._metrics,
    };
  }
}

module.exports = {
  NotificationDispatcher,
};
