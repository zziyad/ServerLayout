'use strict';

const crypto = require('node:crypto');
const path = require('node:path');

const { DatabaseConnectionPool } = require('./database/connection-pool.js');
const { QueryOptimizer } = require('./database/query-optimizer.js');
const { OptimizedDatabase } = require('./database/optimized-db.js');
const {
  DatabasePerformanceMonitor,
} = require('./database/performance-monitor.js');

const http = require('./http.js');
const cookies = require('./cookies.js');
const redisUtils = require('./redis-utils.js');
const schemaValidate = require('./schema-validate.js');
const healthChecks = require('./health-checks.js');

const base64url = (buf) =>
  buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

function genRandomBuf(bytes = 32) {
  return crypto.randomBytes(bytes); // Buffer
}

// HMAC-SHA256 signature for access token
function signRandomBuf(secret, randomBuf) {
  const hmac = crypto.createHmac('sha256', secret).update(randomBuf).digest();
  return `${base64url(randomBuf)}.${base64url(hmac)}`; // string token
}

// verify signed token: returns Buffer randomBuf on success, null on failure
function verifySignedToken(secret, token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const rnd = Buffer.from(
      parts[0].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    );
    const sig = Buffer.from(
      parts[1].replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    );
    const expected = crypto.createHmac('sha256', secret).update(rnd).digest();
    if (expected.length !== sig.length) return null;
    if (!crypto.timingSafeEqual(expected, sig)) return null;
    return rnd;
  } catch (e) {
    return null;
  }
}

// Hash a token (refresh) for safe storage (hex)
function hashTokenHex(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const SCRYPT_PARAMS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const SCRYPT_PREFIX = '$scrypt$N=32768,r=8,p=1,maxmem=67108864$';

const serializeHash = (hash, salt) => {
  const saltString = salt.toString('base64').split('=')[0];
  const hashString = hash.toString('base64').split('=')[0];
  return `${SCRYPT_PREFIX}${saltString}$${hashString}`;
};

const parsePath = (relPath) => {
  const name = path.basename(relPath, '.js');
  const names = relPath.split(path.sep);
  names[names.length - 1] = name;
  return names;
};

const parseOptions = (options) => {
  const values = [];
  const items = options.split(',');
  for (const item of items) {
    const [key, val] = item.split('=');
    values.push([key, Number(val)]);
  }
  return Object.fromEntries(values);
};

const extractPath = (inputPath) => {
  const parts = inputPath.split('/');
  if (parts[2] === 'api') {
    const newPath = '/' + parts.slice(2).join('/');
    console.log({ inputPath, newPath });
    return newPath;
  } else {
    return "Second parameter is not 'api'";
  }
};

const deserializeHash = (phcString) => {
  const [, name, options, salt64, hash64] = phcString.split('$');
  if (name !== 'scrypt') {
    throw new Error('Node.js crypto module only supports scrypt');
  }
  const params = parseOptions(options);
  const salt = Buffer.from(salt64, 'base64');
  const hash = Buffer.from(hash64, 'base64');
  return { params, salt, hash };
};

const SALT_LEN = 32;
const KEY_LEN = 64;

const hashPassword = (password) =>
  new Promise((resolve, reject) => {
    crypto.randomBytes(SALT_LEN, (err, salt) => {
      if (err) {
        reject(err);
        return;
      }
      crypto.scrypt(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, hash) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(serializeHash(hash, salt));
      });
    });
  });

const validatePassword = (password, serHash) => {
  const { params, salt, hash } = deserializeHash(serHash);
  return new Promise((resolve, reject) => {
    const callback = (err, hashedPassword) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(crypto.timingSafeEqual(hashedPassword, hash));
    };
    crypto.scrypt(password, salt, hash.length, params, callback);
  });
};


const generateUniqueFileName = (fileName) => {
  const sanitizedFileName = fileName.replace(/\s+/g, '_');
  const uniqueFN = `${crypto.randomUUID()}_${sanitizedFileName}`;
  return uniqueFN;
};

// IPv4 helpers
const IPV4_OCTETS = 4;
const MAX_32_BIT = 0xffffffff;

const ipToInt = (ip) => {
  if (typeof ip !== 'string') return Number.NaN;
  const bytes = ip.split('.');
  if (bytes.length !== IPV4_OCTETS) return Number.NaN;
  let res = 0;
  for (const byte of bytes) res = res * 256 + parseInt(byte, 10);
  return res;
};

const intToIp = (int) => {
  if (!Number.isInteger(int) || int < 0 || int > MAX_32_BIT) {
    throw new Error('Invalid integer for IPv4 address');
  }
  const octets = new Array(IPV4_OCTETS);
  for (let i = 0; i < IPV4_OCTETS; i++) {
    const shift = 8 * (IPV4_OCTETS - 1 - i);
    octets[i] = (int >>> shift) & 0xff;
  }
  return octets.join('.');
};

const sameSubnet = (ipA, ipB, maskBits = 24) => {
  const a = ipToInt(ipA);
  const b = ipToInt(ipB);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
  return (a & mask) === (b & mask);
};

const isPrivate = (ip) => {
  const n = ipToInt(ip);
  if (!Number.isFinite(n)) return false;
  // 10.0.0.0/8
  if ((n & 0xff000000) === 0x0a000000) return true;
  // 172.16.0.0/12
  if ((n & 0xfff00000) === 0xac100000) return true;
  // 192.168.0.0/16
  if ((n & 0xffff0000) === 0xc0a80000) return true;
  return false;
};

// Normalize IPv6-mapped IPv4 addresses (e.g., ::ffff:127.0.0.1 -> 127.0.0.1)
const normalizeIp = (ip) => {
  if (!ip || typeof ip !== 'string') return '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) {
    const parts = ip.split(':');
    return parts[parts.length - 1] || ip;
  }
  return ip;
};


const execute = (method) =>
  method().catch((error) => {
    const msg = `Failed to execute method: ${error?.message}`;
    console.log(msg, error.stack);
    return Promise.reject(error);
  });


// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

/**
 * Get configuration value with fallback chain
 */
const getConfigValue = (configPath, key, defaultValue) => {
  try {
    const config = require(configPath);
    return (
      config[key] ||
      process.env[`${key.toUpperCase()}_TOKEN_TTL`] ||
      defaultValue
    );
  } catch (e) {
    return process.env[`${key.toUpperCase()}_TOKEN_TTL`] || defaultValue;
  }
};

// ============================================================================
// REDIS CONNECTION MANAGEMENT
// ============================================================================

/**
 * Build Redis configuration with modern options
 */

// ============================================================================
// REDIS PIPELINE OPERATIONS
// ============================================================================

/**
 * Redis Pipeline executor for batch operations
 */
// ============================================================================
// OBJECT POOLING SYSTEM
// ============================================================================

/**
 * Generic object pool for performance optimization
 */
class ObjectPool {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
    this.createFn = options.createFn || (() => ({}));
    this.resetFn = options.resetFn || (() => {});
  }

  get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const obj = this.createFn(key);
    this.cache.set(key, obj);

    // LRU cleanup
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return obj;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Token normalizer with object pooling
 */
class TokenNormalizer {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxCacheSize = options.maxCacheSize || 1000;
  }

  getCandidates(token) {
    if (this.cache.has(token)) {
      return this.cache.get(token);
    }

    const candidates = new Set([
      String(token || ''),
      this.normalizeBase64(token),
    ]);

    const result = Array.from(candidates);

    // Cache management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(token, result);
    return result;
  }

  normalizeBase64(val) {
    let s = typeof val === 'string' ? val : String(val || '');
    if (s.includes('%')) s = decodeURIComponent(s);
    s = s.replace(/ /g, '+');
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4 !== 0) s += '=';
    return s;
  }

  clear() {
    this.cache.clear();
  }
}

// ============================================================================
// METRICS COLLECTION SYSTEM
// ============================================================================

/**
 * Metrics collector with buffering and automatic flushing
 */
class MetricsCollector {
  constructor(options = {}) {
    this.buffer = new Map();
    this.flushInterval = options.flushInterval || 5000;
    this.logger = options.logger || console;
    this.flushTimer = null;
    this.startFlushTimer();
  }

  increment(key, value = 1) {
    this.buffer.set(key, (this.buffer.get(key) || 0) + value);
  }

  decrement(key, value = 1) {
    this.buffer.set(key, (this.buffer.get(key) || 0) - value);
  }

  set(key, value) {
    this.buffer.set(key, value);
  }

  get(key) {
    return this.buffer.get(key);
  }

  startFlushTimer() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  async flush() {
    if (this.buffer.size === 0) return;

    try {
      if (this.logger.system) {
        this.logger.system('Metrics flush', Object.fromEntries(this.buffer));
      } else {
        console.log('Metrics flush', Object.fromEntries(this.buffer));
      }
      this.buffer.clear();
    } catch (err) {
      if (this.logger.error) {
        this.logger.error('Metrics flush error:', err);
      } else {
        console.error('Metrics flush error:', err);
      }
    }
  }

  getBuffer() {
    return Object.fromEntries(this.buffer);
  }

  clear() {
    this.buffer.clear();
  }

  close() {
    this.stopFlushTimer();
    this.buffer.clear();
  }
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance monitor with latency tracking and percentiles
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.metrics = {
      operationsCount: 0,
      averageLatency: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      errorRate: 0,
      totalErrors: 0,
    };
    this.latencies = [];
    this.maxSamples = options.maxSamples || 1000;
  }

  recordLatency(latency) {
    this.latencies.push(latency);
    this.metrics.operationsCount++;

    // Calculate running average
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.operationsCount - 1) +
        latency) /
      this.metrics.operationsCount;

    // Calculate percentiles (keep last maxSamples)
    if (this.latencies.length > this.maxSamples) {
      this.latencies = this.latencies.slice(-this.maxSamples);
    }

    if (this.latencies.length > 0) {
      const sorted = [...this.latencies].sort((a, b) => a - b);
      this.metrics.p50 = sorted[Math.floor(sorted.length * 0.5)];
      this.metrics.p95 = sorted[Math.floor(sorted.length * 0.95)];
      this.metrics.p99 = sorted[Math.floor(sorted.length * 0.99)];
    }
  }

  recordError() {
    this.metrics.totalErrors++;
    this.metrics.errorRate =
      this.metrics.totalErrors / this.metrics.operationsCount;
  }

  getMetrics() {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      operationsCount: 0,
      averageLatency: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      errorRate: 0,
      totalErrors: 0,
    };
    this.latencies = [];
  }
}

// ============================================================================
// RATE LIMITING UTILITIES
// ============================================================================

/**
 * Build rate limit key
 */
// ============================================================================
// CONNECTION HEALTH MONITORING
// ============================================================================

/**
 * Connection health monitor
 */
class ConnectionHealthMonitor {
  constructor(options = {}) {
    this.isHealthy = false;
    this.retryCount = 0;
    this.maxRetries = options.maxRetries || 5;
    this.retryDelay = options.retryDelay || 1000;
    this.logger = options.logger || console;
  }

  markHealthy() {
    this.isHealthy = true;
    this.retryCount = 0;
  }

  markUnhealthy() {
    this.isHealthy = false;
    this.retryCount++;
  }

  shouldRetry() {
    return this.retryCount < this.maxRetries;
  }

  getRetryDelay() {
    return Math.min(this.retryDelay * Math.pow(2, this.retryCount), 30000);
  }

  getStatus() {
    return {
      isHealthy: this.isHealthy,
      retryCount: this.retryCount,
      shouldRetry: this.shouldRetry(),
    };
  }
}

// ============================================================================
// TRANSPORT UTILITIES
// ============================================================================

/**
 * Parse host from request headers
 */
// ============================================================================
// JSON SCHEMA VALIDATION
// ============================================================================

// ============================================================================
// CIRCULAR REFERENCE UTILITIES
// ============================================================================

/**
 * Remove circular references from object (specifically 'parent' property)
 * Creates a clean copy for JSON serialization
 * @param {any} obj - Object to clean
 * @param {WeakSet} visited - Set of visited objects (for recursion)
 * @returns {any} Clean copy without circular references
 */
const removeCircularRefs = (obj, visited = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (visited.has(obj)) {
    return undefined; // Skip circular reference
  }

  visited.add(obj);

  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeCircularRefs(item, visited))
      .filter((item) => item !== undefined);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip 'parent' property to break circular references
    if (key === 'parent') {
      continue;
    }
    const cleaned = removeCircularRefs(value, visited);
    if (cleaned !== undefined) {
      result[key] = cleaned;
    }
  }

  visited.delete(obj);
  return result;
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = Object.freeze({
  hashPassword,
  validatePassword,
  generateUniqueFileName,
  parsePath,
  execute,
  extractPath,
  sameSubnet,
  intToIp,
  ipToInt,
  isPrivate,
  normalizeIp,
  getConfigValue,
  removeCircularRefs,
  ObjectPool,
  TokenNormalizer,
  MetricsCollector,
  PerformanceMonitor,
  ConnectionHealthMonitor,
  DatabaseConnectionPool,
  QueryOptimizer,
  OptimizedDatabase,
  DatabasePerformanceMonitor,
  ...http,
  ...cookies,
  ...redisUtils,
  ...schemaValidate,
  ...healthChecks,
});
