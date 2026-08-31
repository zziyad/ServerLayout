'use strict';

const { createClient } = require('redis');
const logger = require('../lib/logger.js');
const {
  buildRedisConfig,
  createSlidingWindowRateLimit,
  RedisPipeline,
  TokenNormalizer,
  MetricsCollector,
  PerformanceMonitor,
  ConnectionHealthMonitor,
  hashTokenHex,
} = require('../lib/common.js');
const { createSessionConfig } = require('../lib/session-config.js');

// Lua: DEL session key; only if key existed (return 1) then DECR metrics and SREM from user_sessions.
// KEYS[1]=sessionKey, KEYS[2]=userSessionsKey ('' if no user), ARGV[1]=sessionId
// Returns: 1 if key was deleted, 0 if key was already missing (avoids negative metrics).
const LUA_DESTROY_SESSION =
  'local existed = redis.call("DEL", KEYS[1]); ' +
  'if existed == 1 then redis.call("DECR", "metrics:activeSessions"); ' +
  'if KEYS[2] ~= "" then redis.call("SREM", KEYS[2], ARGV[1]) end end; ' +
  'return existed';

// Lua: Atomic updateLastSeen — GET session, check absolute/throttle, update last_seen_at, SETEX + EXPIRE user_sessions.
// KEYS[1]=sessionKey, KEYS[2]=userSessionsKey ('' if no user)
// ARGV[1]=idleTtl (sec), ARGV[2]=extendThresholdSec (0=no throttle), ARGV[3]=nowSec, ARGV[4]=nowIso
// Returns: 1=updated, 0=throttled (session exists, no write), -1=expired, -2=legacy (no meta.expires_at_sec), -3=not found
const LUA_UPDATE_LAST_SEEN =
  'local raw = redis.call("GET", KEYS[1]); ' +
  'if not raw or raw == "" then return -3 end; ' +
  'local s = cjson.decode(raw); ' +
  'local exp_sec = s.meta and s.meta.expires_at_sec; ' +
  'if not exp_sec then return -2 end; ' +
  'exp_sec = tonumber(exp_sec); local now_sec = tonumber(ARGV[3]); ' +
  'if not exp_sec or exp_sec < now_sec then return -1 end; ' +
  'local ext = tonumber(ARGV[2]); local last_sec = s.meta and s.meta.last_seen_at_sec; ' +
  'if ext > 0 and last_sec then local ls = tonumber(last_sec); if ls and (now_sec - ls) < ext then return 0 end end; ' +
  's.meta = s.meta or {}; s.meta.last_seen_at = ARGV[4]; s.meta.last_seen_at_sec = ARGV[3]; ' +
  'local ttl = math.max(1, math.min(tonumber(ARGV[1]), exp_sec - now_sec)); ' +
  'redis.call("SETEX", KEYS[1], ttl, cjson.encode(s)); ' +
  'if KEYS[2] ~= "" then redis.call("EXPIRE", KEYS[2], ttl) end; ' +
  'return 1';

class SessionManager {
  constructor({ accessTtl, refreshTtl, config = {} } = {}) {
    // Use centralized configuration manager
    const sessionConfig = createSessionConfig(config);
    const { accessTtl: finalAccessTtl, refreshTtl: finalRefreshTtl } =
      sessionConfig.getSessionConfig(accessTtl, refreshTtl);

    // Validate configuration
    const validation = sessionConfig.validateConfig();
    if (!validation.isValid) {
      const errorMessage = `Session configuration validation failed: ${validation.errors.join(
        ', ',
      )}`;
      logger.error(errorMessage, { config: validation.config });
      throw new Error(errorMessage);
    }

    this.accessTtl = finalAccessTtl;
    this.refreshTtl = finalRefreshTtl;
    this.configManager = sessionConfig;

    // Session-based TTL configuration (for canonical session model)
    this.idleTtl = sessionConfig.getIdleTtl(); // Session expires after inactivity
    this.absoluteTtl = sessionConfig.getAbsoluteTtl(); // Maximum session lifetime
    this.sessionTtl = sessionConfig.getSessionTtl(); // Default session TTL (sliding window)
    this.extendThresholdSec = sessionConfig.getExtendThresholdSec(); // Sliding TTL throttle (0 = none)
    this.gracePeriod = sessionConfig.getGracePeriod(); // Grace period for read-only operations

    // Clock skew tolerance for token expiration (5 seconds)
    // Prevents false expiration when client/server clocks are slightly out of sync
    this.clockSkewTolerance = 5000; // 5 seconds in milliseconds

    // Redis connection configuration using common utility
    this.redisConfig = buildRedisConfig({
      reconnectStrategy: (retries) => {
        this.healthMonitor.markUnhealthy();
        return Math.min(retries * 50, 500);
      },
    });

    this.client = null;
    this.isConnected = false;

    // Initialize common utilities
    this.tokenNormalizer = new TokenNormalizer({ maxCacheSize: 1000 });
    this.metricsCollector = new MetricsCollector({
      flushInterval: 5000,
      logger,
    });
    this.performanceMonitor = new PerformanceMonitor({ maxSamples: 1000 });
    this.healthMonitor = new ConnectionHealthMonitor({
      maxRetries: 5,
      retryDelay: 1000,
      logger,
    });

    // Initialize Redis pipeline
    this.pipeline = null;

    // Initialize Redis connection
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection with modern error handling
   */
  async initializeRedis() {
    try {
      this.client = createClient(this.redisConfig);

      // Initialize pipeline with client
      this.pipeline = new RedisPipeline(this.client, {
        metrics: this.performanceMonitor.metrics,
        logger,
      });

      // Event handlers
      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
        this.healthMonitor.markUnhealthy();
        this.performanceMonitor.recordError();
      });

      this.client.on('connect', () => {
        logger.system('Redis connected');
        this.isConnected = true;
        this.healthMonitor.markHealthy();
      });

      this.client.on('ready', () => {
        logger.system('Redis ready');
        this.isConnected = true;
        this.healthMonitor.markHealthy();
      });

      this.client.on('reconnecting', () => {
        logger.system('Redis reconnecting...');
        this.isConnected = false;
        this.healthMonitor.markUnhealthy();
      });

      // Connect with retry
      await this.client.connect();
    } catch (err) {
      logger.error('Failed to initialize Redis:', err);
      this.healthMonitor.markUnhealthy();
      throw err;
    }
  }

  /**
   * Check if Redis is ready (simplified)
   */
  isRedisReady() {
    return this.isConnected && this.client?.isReady;
  }

  /**
   * Execute Redis pipeline for batch operations using common utility
   */
  async executePipeline(operations) {
    try {
      const results = await this.pipeline.execute(operations);
      return results;
    } catch (err) {
      this.performanceMonitor.recordError();
      throw err;
    }
  }

  /**
   * Destroy session atomically: DEL key; only if key existed, DECR metrics and SREM user_sessions.
   * Prevents metrics:activeSessions from going negative when key was already missing (TTL/race).
   * @param {string} sessionKey - Redis key e.g. session:${sessionId}
   * @param {string} userSessionsKey - Redis key user_sessions:${userId} or ''
   * @param {string} sessionId - Session ID (for SREM)
   * @returns {Promise<number>} 1 if key was deleted, 0 if already missing
   */
  async _destroySessionAtomic(sessionKey, userSessionsKey, sessionId) {
    const result = await this.client.eval(LUA_DESTROY_SESSION, {
      keys: [sessionKey, userSessionsKey || ''],
      arguments: [sessionId],
    });
    return Number(result);
  }

  // Note: createAccessSession() removed - use createSession() instead

  // Note: getAccessSession() removed - use getSession() instead

  // Note: invalidateAccessSession() removed - use destroySession() instead

  // Note: All refresh token methods removed - user sessions use session-based authentication

  /**
   * @deprecated Use destroyAllUserSessions(userId) instead (canonical session model).
   * This method handles legacy token-based sessions.
   * Will be removed in a future version.
   */
  async invalidateAllUserSessions(userId) {
    try {
      if (!this.isRedisReady()) {
        return false;
      }

      const sKey = `user_sessions:${userId}`;
      const rKey = `user_refreshs:${userId}`;

      // Get all tokens in parallel
      const [accessTokens, refreshHashes] = await Promise.all([
        this.client.sMembers(sKey),
        this.client.sMembers(rKey),
      ]);

      const operations = [];

      // Add access token deletions
      if (accessTokens && accessTokens.length > 0) {
        accessTokens.forEach((token) => {
          operations.push({ command: 'del', args: [`session:${token}`] });
        });
        operations.push({ command: 'del', args: [sKey] });
        operations.push({
          command: 'decrBy',
          args: ['metrics:activeSessions', accessTokens.length],
        });
      }

      // Add refresh token deletions
      if (refreshHashes && refreshHashes.length > 0) {
        refreshHashes.forEach((hash) => {
          operations.push({ command: 'del', args: [`refresh:${hash}`] });
        });
        operations.push({ command: 'del', args: [rKey] });
      }

      if (operations.length > 0) {
        await this.executePipeline(operations);
      }

      this.metricsCollector.increment('userSessionsInvalidated', 1);

      return true;
    } catch (err) {
      logger.error('invalidateAllUserSessions error:', err);
      this.performanceMonitor.recordError();
      return false;
    }
  }

  /**
   * Rate limiting with optimized Redis operations using common utility
   */
  async checkSlidingLimit(scope, dimension, id, windowSec, limit) {
    try {
      if (!this.isRedisReady()) {
        return { allowed: true, count: 0, retryAfterSec: 0 };
      }

      const rateLimiter = createSlidingWindowRateLimit(this.client);
      const result = await rateLimiter(scope, dimension, id, windowSec, limit);

      if (!result.allowed) {
        logger.security('rate-limit exceeded', {
          scope,
          dimension,
          id,
          count: result.count,
          windowSec,
          limit,
        });
      }

      return result;
    } catch (err) {
      logger.error('checkSlidingLimit error:', err);
      this.performanceMonitor.recordError();
      return { allowed: true, count: 0, retryAfterSec: 0 };
    }
  }

  // Note: rotateSession() (old token-based) removed - use rotateSessionCanonical() instead

  // ============================================================================
  // CANONICAL SESSION MODEL METHODS (Session-based authentication)
  // ============================================================================

  /**
   * Compute Redis TTL for a session (min of idle and absolute remaining).
   * @param {object} session - Session with meta.expires_at and optionally meta.last_seen_at
   * @param {{ minTtl?: number }} options - minTtl: minimum TTL in seconds (default 1)
   * @returns {{ ttl: number, expired: boolean }} ttl in seconds (>= minTtl if !expired), expired true if absolute already passed
   */
  computeSessionTtl(session, options = {}) {
    const minTtl = options.minTtl ?? 1;
    const now = Date.now();
    const expiresAtMs = session.meta?.expires_at
      ? new Date(session.meta.expires_at).getTime()
      : NaN;
    const absoluteTtl = Number.isFinite(expiresAtMs)
      ? Math.max(0, Math.floor((expiresAtMs - now) / 1000))
      : 0;
    if (absoluteTtl <= 0) {
      return { ttl: minTtl, expired: true };
    }
    const ttl = Math.max(minTtl, Math.min(this.idleTtl, absoluteTtl));
    return { ttl, expired: false };
  }

  /**
   * Ensure session has meta.expires_at_sec (and optionally last_seen_at_sec) for Lua/atomic updates.
   * Mutates session.meta in place.
   * @param {object} session - Session object
   * @param {{ setLastSeen?: boolean, now?: number }} options - setLastSeen: set last_seen_at(_sec) to now
   */
  _ensureSessionTimestamps(session, options = {}) {
    if (!session.meta) return session;
    const now = options.now ?? Date.now();
    const nowSec = Math.floor(now / 1000);
    if (
      session.meta.expires_at != null &&
      session.meta.expires_at_sec == null
    ) {
      const ms = new Date(session.meta.expires_at).getTime();
      session.meta.expires_at_sec = Number.isFinite(ms)
        ? Math.floor(ms / 1000)
        : 0;
    }
    if (options.setLastSeen) {
      session.meta.last_seen_at = new Date(now).toISOString();
      session.meta.last_seen_at_sec = nowSec;
    }
    return session;
  }

  /**
   * Create session with canonical schema
   * @param {string} sessionId - Session ID (UUID)
   * @param {object} sessionData - Canonical session data with meta, auth, context, security, flow
   * @returns {Promise<object>} Created session data
   */
  async createSession(sessionId, sessionData) {
    const sessionKey = `session:${sessionId}`;
    const userIdKey = sessionData.auth?.user_id
      ? `user_sessions:${sessionData.auth.user_id}`
      : null;

    this._ensureSessionTimestamps(sessionData);
    const { ttl, expired } = this.computeSessionTtl(sessionData, {
      minTtl: 1,
    });
    if (expired) {
      throw new Error(
        'Session expires_at is in the past or invalid; cannot create session',
      );
    }

    try {
      if (!this.isRedisReady()) {
        throw new Error('Redis is not ready');
      }

      const operations = [
        {
          command: 'setEx',
          args: [sessionKey, ttl, JSON.stringify(sessionData)],
        },
        { command: 'incr', args: ['metrics:activeSessions'] },
      ];

      if (userIdKey) {
        operations.push(
          { command: 'sAdd', args: [userIdKey, sessionId] },
          { command: 'expire', args: [userIdKey, ttl] },
        );
      }

      await this.executePipeline(operations);
      this.metricsCollector.increment('sessionsCreated', 1);

      logger.system('createSession success', {
        userId: sessionData.auth?.user_id,
        sessionId: sessionId.substring(0, 10) + '...',
      });
      return sessionData;
    } catch (err) {
      logger.error('createSession error:', err);
      this.performanceMonitor.recordError();
      throw err;
    }
  }

  /**
   * Get session by session ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<object|null>} Session data or null if not found
   */
  async getSession(sessionId) {
    try {
      if (!this.isRedisReady()) {
        return null;
      }

      const sessionKey = `session:${sessionId}`;
      const raw = await this.client.get(sessionKey);

      if (!raw) {
        return null;
      }

      return JSON.parse(raw);
    } catch (err) {
      logger.error('getSession error:', err);
      this.performanceMonitor.recordError();
      return null;
    }
  }

  /**
   * Validate session TTL (idle + absolute)
   * Includes small grace period (5 seconds) to handle timing edge cases
   * @param {object} session - Session data
   * @returns {boolean} True if session is valid, false if expired
   */
  isSessionValid(session) {
    const now = Date.now();
    const gracePeriod = this.clockSkewTolerance; // configurable (default 5s) for timing/clock skew

    // Check absolute TTL (hard limit - no grace period)
    if (session.meta?.expires_at) {
      const expiresAt = new Date(session.meta.expires_at).getTime();
      if (expiresAt < now) {
        return false; // Absolute TTL expired
      }
    }

    // Check idle TTL (with grace period to handle timing edge cases)
    if (session.meta?.last_seen_at) {
      const lastSeen = new Date(session.meta.last_seen_at).getTime();
      const idleAge = now - lastSeen;
      const maxIdleAge = this.idleTtl * 1000 + gracePeriod;

      // Add grace period to prevent premature expiration due to timing issues
      if (idleAge > maxIdleAge) {
        return false; // Idle timeout expired (with grace period)
      }
    } else if (session.meta?.created_at) {
      // Fallback: use created_at if last_seen_at is missing (shouldn't happen, but handle gracefully)
      const created = new Date(session.meta.created_at).getTime();
      const age = now - created;
      const maxIdleAge = this.idleTtl * 1000 + gracePeriod;

      if (age > maxIdleAge) {
        return false;
      }
    } else {
      // No last_seen_at or created_at - session is invalid
      return false;
    }

    return true;
  }

  /**
   * Update last_seen_at and extend idle TTL (sliding window). Uses Lua for atomic
   * GET→update→SETEX→EXPIRE so no last_seen rollback or session/user_sessions TTL drift.
   * Optional throttle (extendThresholdSec) reduces Redis writes when set.
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if session valid (updated or throttled), false if not found or expired
   */
  async updateLastSeen(sessionId) {
    try {
      if (!this.isRedisReady()) {
        return false;
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const sessionKey = `session:${sessionId}`;
      const userSessionsKey = session.auth?.user_id
        ? `user_sessions:${session.auth.user_id}`
        : '';
      const now = Date.now();
      const nowSec = Math.floor(now / 1000);
      const nowIso = new Date(now).toISOString();

      const result = await this.client.eval(LUA_UPDATE_LAST_SEEN, {
        keys: [sessionKey, userSessionsKey],
        arguments: [
          String(this.idleTtl),
          String(this.extendThresholdSec),
          String(nowSec),
          nowIso,
        ],
      });
      const code = Number(result);

      if (code === 1 || code === 0) {
        return true; // 1=updated, 0=throttled (session valid)
      }
      if (code === -1) {
        return false; // expired
      }
      if (code === -3) {
        return false; // not found (raced with expiry)
      }
      // -2 = legacy session (no meta.expires_at_sec): patch once then consider extended
      this._ensureSessionTimestamps(session, { setLastSeen: true });
      const { ttl, expired } = this.computeSessionTtl(session, { minTtl: 1 });
      if (expired) {
        return false;
      }
      await this.client.setEx(sessionKey, ttl, JSON.stringify(session));
      if (userSessionsKey) {
        await this.client.expire(userSessionsKey, ttl);
      }
      return true;
    } catch (err) {
      logger.error('updateLastSeen error:', err);
      this.performanceMonitor.recordError();
      return false;
    }
  }

  /**
   * Keep-alive: Explicitly extend session (user-initiated)
   * ⚠️ This is the ONLY way to extend sessions - must be called explicitly
   * @param {string} sessionId - Current session ID
   * @returns {Promise<{success: boolean, newSessionId?: string, session?: object, error?: string}>}
   */
  async keepAlive(sessionId) {
    try {
      if (!this.isRedisReady()) {
        return { success: false, error: 'Redis not ready' };
      }

      // 1. Get current session
      const session = await this.getSession(sessionId);
      if (!session) {
        return { success: false, error: 'Session not found' };
      }

      // 2. Check absolute TTL (hard limit - cannot extend if expired)
      const now = Date.now();
      const expiresAt = new Date(session.meta.expires_at).getTime();
      if (expiresAt < now) {
        // Absolute TTL expired - cannot extend
        await this.destroySession(sessionId);
        return {
          success: false,
          error: 'absolute_ttl_reached',
          reason: 'Session has reached maximum lifetime and cannot be extended',
        };
      }

      // 3. Check idle TTL (can extend if not expired)
      const lastSeen = new Date(session.meta.last_seen_at).getTime();
      const idleAge = now - lastSeen;
      if (idleAge > this.idleTtl * 1000) {
        // Idle timeout expired - cannot extend
        await this.destroySession(sessionId);
        return {
          success: false,
          error: 'idle_ttl_expired',
          reason: 'Session has expired due to inactivity',
        };
      }

      // 4. Rotate session ID (mandatory on keep-alive)
      const crypto = require('node:crypto');
      const newSessionId = crypto.randomUUID();

      // 5. Create new session with extended idle TTL
      const newSession = {
        ...session,
        meta: {
          ...session.meta,
          created_at: session.meta.created_at, // Keep original creation time
          last_seen_at: new Date().toISOString(), // Update last seen
          expires_at: session.meta.expires_at, // Keep original absolute expiry
        },
        security: {
          ...session.security,
          csrf_token: crypto.randomBytes(32).toString('hex'), // New CSRF token on rotation
        },
      };
      this._ensureSessionTimestamps(newSession, { setLastSeen: true });

      // 6. Create new session first (so if create fails, old session is still valid; metrics: +1)
      await this.createSession(newSessionId, newSession);

      // 7. Destroy old session (Lua only decr when key existed; if destroy fails, old key expires by TTL)
      await this.destroySession(sessionId);

      logger.security('Session keep-alive', {
        oldSessionId: sessionId.substring(0, 10) + '...',
        newSessionId: newSessionId.substring(0, 10) + '...',
        userId: session.auth?.user_id,
      });

      return {
        success: true,
        newSessionId,
        session: newSession,
      };
    } catch (err) {
      logger.error('keepAlive error:', err);
      this.performanceMonitor.recordError();
      return { success: false, error: err.message || 'Keep-alive failed' };
    }
  }

  /**
   * Rotate session (invalidate old, create new) - Canonical model version
   * @param {string} oldSessionId - Old session ID
   * @param {string} newSessionId - New session ID
   * @param {object} options - Rotation options
   * @returns {Promise<boolean>} True if rotated successfully
   */
  async rotateSessionCanonical(oldSessionId, newSessionId, options = {}) {
    try {
      if (!this.isRedisReady()) {
        throw new Error('Redis is not ready');
      }

      const oldSession = await this.getSession(oldSessionId);
      if (!oldSession) {
        if (options.newSession) {
          await this.createSession(newSessionId, options.newSession);
        }
        return true;
      }

      // Create new session first (if create fails, old session still valid; metrics: +1 then -1 on destroy)
      if (!options.newSession) {
        const newSession = { ...oldSession };
        newSession.meta.created_at = new Date().toISOString();
        newSession.meta.last_seen_at = new Date().toISOString();
        newSession.meta.expires_at = new Date(
          Date.now() + this.absoluteTtl * 1000,
        ).toISOString();
        const crypto = require('node:crypto');
        newSession.security.csrf_token = crypto.randomBytes(32).toString('hex');

        if (options.reason === 'ip_mismatch') {
          const riskLevels = { low: 0, medium: 1, high: 2 };
          const currentRisk =
            riskLevels[newSession.security?.risk_level || 'low'];
          if (currentRisk < 1) {
            newSession.security.risk_level = 'medium';
            newSession.security.last_risk_change = new Date().toISOString();
            newSession.security.risk_change_reason = 'ip_mismatch_rotation';
          }
        } else if (options.reason === 'login') {
          newSession.security.risk_level = 'low';
          newSession.security.last_risk_change = new Date().toISOString();
          newSession.security.risk_change_reason = 'login_rotation';
        } else {
          newSession.security.risk_level =
            newSession.security?.risk_level || 'low';
        }

        this._ensureSessionTimestamps(newSession, { setLastSeen: true });
        await this.createSession(newSessionId, newSession);
      } else {
        this._ensureSessionTimestamps(options.newSession);
        await this.createSession(newSessionId, options.newSession);
      }

      // Then destroy old (Lua only decr when key existed)
      await this.destroySession(oldSessionId);

      logger.security('Session rotated (canonical)', {
        oldSessionId: oldSessionId.substring(0, 10) + '...',
        newSessionId: newSessionId.substring(0, 10) + '...',
        reason: options.reason || 'unknown',
        userId: oldSession.auth?.user_id,
      });

      return true;
    } catch (err) {
      logger.error('rotateSessionCanonical error:', err);
      this.performanceMonitor.recordError();
      throw err;
    }
  }

  /**
   * Destroy session completely.
   * Uses Lua so DECR metrics and SREM only when the session key actually existed (avoids negative counter).
   * @param {string} sessionId - Session ID
   * @returns {Promise<boolean>} True if destroyed, false if not found or already missing
   */
  async destroySession(sessionId) {
    try {
      if (!this.isRedisReady()) {
        return false;
      }

      const session = await this.getSession(sessionId);
      if (!session) {
        return false;
      }

      const userId = session.auth?.user_id;
      const sessionKey = `session:${sessionId}`;
      const userSessionsKey = userId ? `user_sessions:${userId}` : '';

      const existed = await this._destroySessionAtomic(
        sessionKey,
        userSessionsKey,
        sessionId,
      );

      if (existed === 1) {
        this.metricsCollector.increment('sessionsDestroyed', 1);
        logger.security('Session destroyed', {
          sessionId: sessionId.substring(0, 10) + '...',
          userId,
        });
      }
      return existed === 1;
    } catch (err) {
      logger.error('destroySession error:', err);
      this.performanceMonitor.recordError();
      return false;
    }
  }

  /**
   * Destroy all sessions for a user (canonical session model). Uses _destroySessionAtomic
   * per session so metrics:activeSessions and user_sessions stay correct (no bulk DECR
   * without matching DELs — avoids negative counter when some keys are already missing).
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if destroyed, false on error
   */
  async destroyAllUserSessions(userId) {
    try {
      if (!this.isRedisReady()) {
        return false;
      }

      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await this.client.sMembers(userSessionsKey);

      if (!sessionIds || sessionIds.length === 0) {
        return true;
      }

      let destroyed = 0;
      for (const sessionId of sessionIds) {
        const sessionKey = `session:${sessionId}`;
        const existed = await this._destroySessionAtomic(
          sessionKey,
          userSessionsKey,
          sessionId,
        );
        if (existed === 1) destroyed++;
      }

      await this.client.del(userSessionsKey);

      this.metricsCollector.increment('userSessionsDestroyed', 1);
      logger.security('All user sessions destroyed', {
        userId,
        count: destroyed,
      });

      return true;
    } catch (err) {
      logger.error('destroyAllUserSessions error:', err);
      this.performanceMonitor.recordError();
      return false;
    }
  }

  /**
   * Cleanup expired sessions (periodic maintenance)
   * Scans Redis for expired sessions and removes them
   * @param {number} batchSize - Number of sessions to check per batch (default: 100)
   * @returns {Promise<{checked: number, destroyed: number}>} Cleanup statistics
   */
  async cleanupExpiredSessions(batchSize = 100) {
    try {
      if (!this.isRedisReady()) {
        return { checked: 0, destroyed: 0 };
      }

      let cursor = '0';
      let checked = 0;
      let destroyed = 0;

      do {
        // Scan for session keys
        const result = await this.client.scan(cursor, {
          MATCH: 'session:*',
          COUNT: batchSize,
        });

        cursor = result.cursor;
        const keys = result.keys || [];

        if (keys.length === 0) {
          continue;
        }

        // Get sessions in batch
        const sessions = await this.client.mGet(keys);

        for (let i = 0; i < sessions.length; i++) {
          const raw = sessions[i];
          const key = keys[i];
          checked++;

          if (!raw) {
            // Key doesn't exist, skip
            continue;
          }

          try {
            const session = JSON.parse(raw);

            // Check if session is expired
            if (!this.isSessionValid(session)) {
              const sessionId = key.replace('session:', '');
              const userId = session.auth?.user_id;
              const userSessionsKey = userId ? `user_sessions:${userId}` : '';
              const existed = await this._destroySessionAtomic(
                key,
                userSessionsKey,
                sessionId,
              );
              if (existed === 1) destroyed++;
            }
          } catch (parseError) {
            // Invalid session data, remove it (no userId available)
            const sessionId = key.replace('session:', '');
            const existed = await this._destroySessionAtomic(
              key,
              '',
              sessionId,
            );
            if (existed === 1) {
              destroyed++;
              logger.warn('Removed invalid session during cleanup', {
                key: key.substring(0, 20) + '...',
              });
            }
          }
        }
      } while (cursor !== '0');

      if (destroyed > 0) {
        logger.system('Session cleanup completed', {
          checked,
          destroyed,
        });
      }

      return { checked, destroyed };
    } catch (err) {
      logger.error('cleanupExpiredSessions error:', err);
      this.performanceMonitor.recordError();
      return { checked, destroyed };
    }
  }

  /**
   * Close Redis connection gracefully
   */
  async close() {
    try {
      // Stop metrics collection
      if (
        this.metricsCollector &&
        typeof this.metricsCollector.close === 'function'
      ) {
        this.metricsCollector.close();
      }

      if (this.client && this.isConnected) {
        await this.client.quit();
        this.isConnected = false;
        logger.system('Redis connection closed');
      }
    } catch (err) {
      logger.error('SessionManager close error:', err);
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics() {
    return {
      performance: this.performanceMonitor.getMetrics(),
      health: this.healthMonitor.getStatus(),
      metrics: this.metricsCollector.getBuffer(),
      cache: {
        tokenNormalizer: this.tokenNormalizer.size(),
      },
      isConnected: this.isConnected,
      redisVersion: '5.8.2',
    };
  }

  /**
   * Active sessions count from counter (fast; may drift, use reconcileActiveSessionsCount to fix).
   */
  async getActiveSessionsCount() {
    try {
      if (!this.isConnected || !this.client) return 0;
      const n = await this.client.get('metrics:activeSessions');
      const count = parseInt(n, 10);
      return Number.isFinite(count) && count >= 0 ? count : 0;
    } catch (error) {
      logger.error('Error getting active sessions count:', error);
      return 0;
    }
  }

  /**
   * Exact count via SCAN (expensive; use for reconciliation or when accuracy is required).
   */
  async getActiveSessionsCountExact() {
    try {
      if (!this.isConnected || !this.client) return 0;
      let cursor = '0';
      let count = 0;
      do {
        const result = await this.client.scan(cursor, {
          MATCH: 'session:*',
          COUNT: 100,
        });
        cursor = result.cursor;
        count += (result.keys || []).length;
      } while (cursor !== '0');
      return count;
    } catch (error) {
      logger.error('Error getting active sessions count (exact):', error);
      return 0;
    }
  }

  /**
   * Reconcile metrics:activeSessions with exact SCAN count. Run periodically (e.g. hourly) to correct drift.
   * @returns {Promise<{ previous: number, exact: number }>}
   */
  async reconcileActiveSessionsCount() {
    try {
      if (!this.isConnected || !this.client) return { previous: 0, exact: 0 };
      const exact = await this.getActiveSessionsCountExact();
      const previous = await this.client
        .get('metrics:activeSessions')
        .then((n) => Math.max(0, parseInt(n, 10) || 0));
      await this.client.set('metrics:activeSessions', String(exact));
      if (previous !== exact) {
        logger.system('Session count reconciled', { previous, exact });
      }
      return { previous, exact };
    } catch (error) {
      logger.error('reconcileActiveSessionsCount error:', error);
      this.performanceMonitor.recordError();
      return { previous: 0, exact: 0 };
    }
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      redis: this.isConnected,
      health: this.healthMonitor.getStatus(),
      performance: this.performanceMonitor.getMetrics(),
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = { SessionManager };
