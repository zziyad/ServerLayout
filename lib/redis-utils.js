'use strict';

const buildRedisConfig = (options = {}) => {
  const {
    REDIS_URL,
    REDIS_HOST = '127.0.0.1',
    REDIS_PORT = '6379',
    REDIS_PASSWORD,
    REDIS_DB = '0',
  } = process.env;

  const config = {
    socket: {
      reconnectStrategy:
        options.reconnectStrategy || ((retries) => Math.min(retries * 50, 500)),
      connectTimeout: options.connectTimeout || 10000,
      lazyConnect: options.lazyConnect !== false,
    },
    database: parseInt(REDIS_DB),
  };

  if (REDIS_URL) {
    config.url = REDIS_URL;
  } else {
    config.socket.host = REDIS_HOST;
    config.socket.port = parseInt(REDIS_PORT);
    if (REDIS_PASSWORD) {
      config.password = REDIS_PASSWORD;
    }
  }

  return config;
};

class RedisPipeline {
  constructor(client, options = {}) {
    this.client = client;
    this.metrics = options.metrics || {};
    this.logger = options.logger || console;
  }

  async execute(operations) {
    if (!this.isReady()) {
      throw new Error('Redis is not ready');
    }

    const startTime = Date.now();
    const pipeline = this.client.multi();

    operations.forEach((op) => {
      if (typeof pipeline[op.command] !== 'function') {
        throw new Error(`Invalid Redis command: ${op.command}`);
      }
      pipeline[op.command](...op.args);
    });

    try {
      const results = await pipeline.exec();
      const latency = Date.now() - startTime;

      this.updateMetrics(operations.length, latency);
      return results;
    } catch (err) {
      this.logger.error('Pipeline execution error:', err);
      this.metrics.redisErrors = (this.metrics.redisErrors || 0) + 1;
      throw err;
    }
  }

  isReady() {
    return this.client?.isReady;
  }

  updateMetrics(operationCount, latency) {
    this.metrics.operationsCount =
      (this.metrics.operationsCount || 0) + operationCount;
    this.metrics.averageLatency =
      (this.metrics.averageLatency *
        (this.metrics.operationsCount - operationCount) +
        latency) /
      this.metrics.operationsCount;
  }
}


const buildRateKey = (scope, dimension, id) => {
  const safe = String(id || '')
    .trim()
    .toLowerCase();
  return `rl:${scope}:${dimension}:${safe}`;
};

/**
 * Create sliding window rate limiter
 */
const createSlidingWindowRateLimit = (client, options = {}) => {
  return async (scope, dimension, id, windowSec, limit) => {
    const key = buildRateKey(scope, dimension, id);
    const now = Date.now();
    const windowMs = windowSec * 1000;
    const minScore = now - windowMs;

    const operations = [
      { command: 'zRemRangeByScore', args: [key, '-inf', `(${minScore}`] },
      { command: 'zAdd', args: [key, { score: now, value: String(now) }] },
      { command: 'zCount', args: [key, `(${minScore}`, now] },
      { command: 'expire', args: [key, windowSec] },
    ];

    try {
      const pipeline = client.multi();
      operations.forEach((op) => {
        pipeline[op.command](...op.args);
      });

      const results = await pipeline.exec();
      const count = Number(results?.[2]) || 0;
      const allowed = count <= Number(limit || 0);

      return {
        allowed,
        count,
        retryAfterSec: allowed ? 0 : Math.max(1, Math.floor(windowSec / 4)),
      };
    } catch (err) {
      return { allowed: true, count: 0, retryAfterSec: 0 };
    }
  };
};


module.exports = {
  buildRedisConfig,
  RedisPipeline,
  buildRateKey,
  createSlidingWindowRateLimit,
};
