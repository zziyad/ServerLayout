'use strict';

const { EventEmitter } = require('node:events');
const { HttpTransport, WsTransport } = require('./transport.js');
const { Session, Context } = require('./session.js');
const streams = require('./streams.js');

class Client extends EventEmitter {
  #transport;

  constructor(transport) {
    super();
    this.#transport = transport;
    this.ip = transport.ip;
    this.session = null;
    this.streams = new Map(); // Stream ID → Stream object

    transport.server.clients.add(this);

    transport.once('close', () => {
      this.destroy();
      transport.server.clients.delete(this);
    });
  }

  getTransport() {
    return this.#transport;
  }

  get sessionManager() {
    return this.#transport?.server?.sessionManager;
  }

  isWebSocket() {
    return this.#transport instanceof WsTransport;
  }

  get eventBus() {
    return this.#transport?.server?.application?.eventBus || null;
  }

  get application() {
    return this.#transport?.server?.application || null;
  }

  get notificationManager() {
    return this.#transport?.server?.application?.notificationManager || null;
  }

  error(code, options) {
    this.#transport.error(code, options);
  }

  send(obj, code) {
    this.#transport.send(obj, code);
  }

  clearSessionCookies() {
    if (
      this.#transport &&
      typeof this.#transport.clearSessionCookies === 'function'
    ) {
      this.#transport.clearSessionCookies();
    }
  }

  /**
   * Send session cookie (for keep-alive endpoint)
   * @param {string} sessionId - Session ID
   * @param {number} ttl - TTL in seconds
   */
  sendSessionCookie(sessionId, ttl) {
    if (
      this.#transport &&
      typeof this.#transport.sendSessionCookie === 'function' &&
      !this.isWebSocket()
    ) {
      this.#transport.sendSessionCookie(sessionId, ttl);
    }
  }

  // Note: invalidateAccessSession() removed - use destroySession() instead

  createContext() {
    return new Context(this);
  }

  emit(name, data) {
    if (name === 'close') {
      super.emit(name, data);
      return;
    }
    this.send({ type: 'event', name, data });
  }

  /**
   * Validate session with binding checks (canonical session model)
   * @param {string} sessionId - Session ID from cookie
   * @param {string} methodName - Optional method name to determine if read-only
   * @returns {Promise<object|null>} Session data or null if invalid
   */
  async validateSession(sessionId, methodName = '', transportType = null) {
    if (!sessionId) return null;

    try {
      const sm = this.sessionManager;

      // 1. Detect transport type if not provided
      if (transportType === null) {
        transportType = this.isWebSocket() ? 'ws' : 'http';
      }

      // 2. Load session
      let session = await sm.getSession(sessionId);

      // 3. Check if read-only operation (read-only operations don't extend session)
      const isReadOnly = this.isReadOnlyOperation(methodName);

      // For read-only operations, if session not found in Redis, it might have expired
      // but we should still allow it if it's within grace period (handled later)
      if (!session && !isReadOnly) {
        // Non-read-only operations require session to exist
        // Session not found in Redis = expired/invalid, clear cookie
        if (transportType === 'http') {
          this.clearSessionCookies?.();
        }
        return null;
      }

      if (!session && isReadOnly) {
        // Read-only operation with expired Redis key - can't validate without session data
        // This means session was truly expired (Redis TTL expired)
        // Clear cookie for HTTP transport
        if (transportType === 'http') {
          this.clearSessionCookies?.();
        }
        return null;
      }

      // 4. TTL Extension: only on real activity (auth/activity) or other state-changing requests.
      // Do NOT extend on auth/me — the 30s refreshUser() poll must not keep the session alive.
      const isActivityPing =
        typeof methodName === 'string' && methodName.includes('auth/activity');
      const shouldExtend =
        (transportType === 'http' && !isReadOnly) || isActivityPing;

      if (shouldExtend) {
        const extended = await sm.updateLastSeen(sessionId);
        if (extended) {
          require('../lib/logger.js').system('session extended', {
            method: methodName,
            sid: sessionId?.substring?.(0, 10),
          });
        }
        if (!extended) {
          // Extension failed - try to reload session
          session = await sm.getSession(sessionId);
          if (!session) {
            // Session not found after extension attempt - clear cookie
            if (transportType === 'http') {
              this.clearSessionCookies?.();
            }
            return null;
          }
          // Check if absolute TTL expired
          if (!sm.isSessionValid(session)) {
            await sm.destroySession(sessionId);

            // Clear cookies for HTTP transport (WebSocket can't set cookies)
            if (transportType === 'http') {
              this.clearSessionCookies?.();
            }

            return null;
          }
          // Session is valid but extension failed (might be Redis issue)
          // Continue with validation using current session
        } else {
          // Extension succeeded - reload to get updated last_seen_at
          session = await sm.getSession(sessionId);
          if (!session) {
            // This shouldn't happen, but handle it gracefully
            // Session disappeared after extension - clear cookie
            if (transportType === 'http') {
              this.clearSessionCookies?.();
            }
            return null;
          }
          // Refresh session cookie so browser keeps it for another idle window (sliding cookie)
          if (transportType === 'http' && this.#transport?.sendSessionCookie) {
            this.#transport.sendSessionCookie(sessionId, sm.idleTtl);
          }
        }
      }

      // 4. TTL validation (idle + absolute) - check AFTER potential extension
      // Use the session we have (already reloaded if extended)
      const currentSession = session;

      // For read-only operations, be more lenient - only destroy if clearly expired
      // This prevents premature logout when user is actively browsing (read-only operations)
      const isValid = sm.isSessionValid(currentSession);

      if (!isValid) {
        // Calculate timing info for grace period check
        const now = Date.now();
        const lastSeen = currentSession.meta?.last_seen_at
          ? new Date(currentSession.meta.last_seen_at).getTime()
          : 0;
        const idleAge = now - lastSeen;
        const gracePeriodMs = (sm.gracePeriod || 15) * 1000; // Use config grace period (default 15 seconds)
        const maxAllowedAge = sm.idleTtl * 1000 + gracePeriodMs;

        // For read-only operations, check if session is within extended grace period
        // If user is actively using the app (even read-only), don't destroy immediately
        if (isReadOnly) {
          // Debug logging
          const logger = require('../lib/logger.js');
          logger.system('Session validation check (read-only)', {
            sessionId: sessionId.substring(0, 10) + '...',
            methodName,
            lastSeen: currentSession.meta?.last_seen_at,
            idleAgeSeconds: Math.floor(idleAge / 1000),
            idleTtl: sm.idleTtl,
            maxAllowedAgeSeconds: Math.floor(maxAllowedAge / 1000),
            withinGracePeriod: idleAge <= maxAllowedAge,
            absoluteExpiresAt: currentSession.meta?.expires_at,
          });

          // If session expired but within grace period, allow it (don't extend though)
          // This prevents premature logout when user is actively browsing
          if (idleAge <= maxAllowedAge) {
            // Session is expired but within grace period - allow read-only operation
            // Don't extend, but don't destroy either
            return currentSession;
          }
        } else {
          // For non-read-only operations, also check grace period
          // This prevents premature logout if validation fails due to timing issues
          if (idleAge <= maxAllowedAge) {
            // Session expired but within grace period - allow it
            // This can happen if there's a race condition or timing issue
            return currentSession;
          }
        }

        // Session is clearly expired - destroy it
        // Log for debugging
        const logger = require('../lib/logger.js');
        logger.system('Session expired and destroyed', {
          sessionId: sessionId.substring(0, 10) + '...',
          methodName,
          isReadOnly,
          lastSeen: currentSession.meta?.last_seen_at,
          idleAgeSeconds: Math.floor(idleAge / 1000),
          idleTtl: sm.idleTtl,
          absoluteExpiresAt: currentSession.meta?.expires_at,
        });

        await sm.destroySession(sessionId);

        // Clear cookies for HTTP transport (WebSocket can't set cookies)
        if (transportType === 'http') {
          this.clearSessionCookies?.();
        }

        return null;
      }

      // 5. Binding validation (transport-aware)
      const bindingResult = this.validateSessionBinding(
        currentSession,
        transportType,
        methodName,
      );

      if (bindingResult.action === 'destroy') {
        // Log for debugging
        const logger = require('../lib/logger.js');
        logger.system('Session destroyed by binding validation', {
          sessionId: sessionId.substring(0, 10) + '...',
          methodName,
          transportType,
          reason: bindingResult.reason,
        });

        await sm.destroySession(sessionId);

        // Clear cookies for HTTP transport (WebSocket can't set cookies)
        if (transportType === 'http') {
          this.clearSessionCookies?.();
        }

        return null;
      }

      // Handle user-agent hash update (for WebSocket / lenient endpoints that don't send UA)
      if (bindingResult.action === 'allow' && bindingResult.updateUaHash) {
        const { hashTokenHex } = require('../lib/common.js');
        const currentUa = this.getUserAgent() || '';
        const currentUaHash = hashTokenHex(currentUa);
        currentSession.security.user_agent_hash = currentUaHash;

        const { ttl, expired } = sm.computeSessionTtl(currentSession, {
          minTtl: 1,
        });
        if (!expired && ttl >= 1) {
          const sessionKey = `session:${sessionId}`;
          await sm.client.setEx(
            sessionKey,
            ttl,
            JSON.stringify(currentSession),
          );
          const userId = currentSession.auth?.user_id;
          if (userId) {
            await sm.client.expire(`user_sessions:${userId}`, ttl);
          }
        }
      }

      if (bindingResult.action === 'rotate') {
        const crypto = require('node:crypto');
        const newSessionId = crypto.randomUUID();

        // Risk escalation
        const currentRisk = currentSession.security?.risk_level || 'low';
        const riskLevels = { low: 0, medium: 1, high: 2 };
        const newRiskLevel =
          riskLevels[currentRisk] < 1 ? 'medium' : currentRisk;

        const newSession = {
          ...currentSession,
          meta: {
            ...currentSession.meta,
            created_at: new Date().toISOString(),
            last_seen_at: new Date().toISOString(),
          },
          security: {
            ...currentSession.security,
            ip: this.normalizeIp(this.ip),
            risk_level: newRiskLevel,
            last_risk_change: new Date().toISOString(),
            risk_change_reason: 'ip_mismatch_rotation',
          },
        };

        await sm.rotateSessionCanonical(sessionId, newSessionId, {
          reason: 'ip_mismatch',
          newSession,
        });

        // Update cookie
        if (!this.#transport.connection) {
          this.#transport.sendSessionCookie(newSessionId, sm.sessionTtl);
        }

        // IMPORTANT: return NEW session only
        return await sm.getSession(newSessionId);
      }

      // Return the current session (with updated last_seen_at if extended)
      return currentSession;
    } catch {
      return null;
    }
  }

  /**
   * Validate session binding (IP and user-agent) - Transport-aware
   * @param {object} session - Session data
   * @param {string} transportType - Transport type: 'http' or 'ws'
   * @param {string} methodName - RPC method name (e.g. 'auth/activity', 'auth/me')
   * @returns {object} { action: 'allow'|'rotate'|'destroy', reason: string, updateUaHash?: boolean }
   */
  validateSessionBinding(session, transportType = null, methodName = '') {
    const { normalizeIp, hashTokenHex } = require('../lib/common.js');

    // Detect transport type if not provided
    if (transportType === null) {
      transportType = this.isWebSocket() ? 'ws' : 'http';
    }

    const currentIp = normalizeIp(this.ip);
    const currentUa = this.getUserAgent() || '';
    const currentUaHash = hashTokenHex(currentUa);

    // ============================================
    // USER-AGENT VALIDATION (Transport-aware)
    // ============================================
    // Never destroy session on UA mismatch: fetch()/XHR often send different or minimal User-Agent
    // than the document (e.g. "node-fetch" or empty). Destroying would log users out after any admin action.
    // Allow and update stored UA hash so the session stays valid.
    if (session.security?.user_agent_hash !== currentUaHash) {
      return { action: 'allow', updateUaHash: true };
    }

    // ============================================
    // IP VALIDATION (Transport-aware)
    // ============================================
    if (session.security?.ip !== currentIp) {
      if (transportType === 'ws') {
        // WebSocket: ALLOW (soft mismatch)
        // IP drift is common (Wi-Fi → LTE / VPN / proxies)
        // WebSocket connections must not be broken mid-connection
        return { action: 'allow' };
      } else {
        // HTTP: ROTATE session
        // IP mismatch on HTTP = potential account sharing or IP change
        return { action: 'rotate', reason: 'ip_mismatch' };
      }
    }

    return { action: 'allow' };
  }

  /**
   * Normalize IP address (helper method)
   * @param {string} ip - IP address
   * @returns {string} Normalized IP
   */
  normalizeIp(ip) {
    const { normalizeIp } = require('../lib/common.js');
    return normalizeIp(ip);
  }

  /**
   * Detect read-only operations that should NOT extend session
   * Read-only operations: auth/me, .get, .list, .find, .search, .count
   * @param {string} methodName - API method name (e.g., 'auth/me', 'user/list')
   * @returns {boolean} True if read-only operation
   */
  isReadOnlyOperation(methodName) {
    if (!methodName || typeof methodName !== 'string') {
      return false;
    }

    const methodLower = methodName.toLowerCase();

    // Explicit read-only endpoints
    const readOnlyEndpoints = [
      'auth/me', // User info endpoint (polled frequently)
      'auth/session/keep-alive', // Keep-alive is explicit extension, not activity
    ];

    // Check explicit endpoints
    if (readOnlyEndpoints.some((endpoint) => methodLower.includes(endpoint))) {
      return true;
    }

    // Read-only patterns (methods that don't modify state)
    const readOnlyPatterns = [
      /\.get$/, // user.get, file.get
      /\.list$/, // user.list, role.list
      /\.find$/, // user.find
      /\.search$/, // user.search
      /\.count$/, // user.count
      /^get\./, // get.user, get.file
      /^list\./, // list.users, list.roles
      /^find\./, // find.user
      /^search\./, // search.users
      /^count\./, // count.users
    ];

    // Check patterns
    return readOnlyPatterns.some((pattern) => pattern.test(methodLower));
  }

  /**
   * Validate CSRF token for state-changing operations
   * @param {string} methodName - API method name (e.g., 'user.create', 'department.update')
   * @returns {object|null} { valid: boolean, error?: string } or null if not required
   */
  validateCsrfToken(methodName) {
    const methodLower = methodName.toLowerCase();

    // Explicit list of state-changing endpoints (more reliable than pattern matching)
    const stateChangingEndpoints = [
      'auth/session/keep-alive', // Session extension
      'auth/logout', // Logout
    ];

    // Check if it's an explicit state-changing endpoint
    // Try multiple patterns to catch all variations
    const isExplicitStateChanging = stateChangingEndpoints.some((endpoint) => {
      const exactMatch = methodLower === endpoint;
      const endsWithMatch = methodLower.endsWith(`/${endpoint}`);
      const includesMatch = methodLower.includes(endpoint);
      return exactMatch || endsWithMatch || includesMatch;
    });

    let isStateChanging = false;

    if (isExplicitStateChanging) {
      // This is a state-changing operation - require CSRF
      isStateChanging = true;
    } else {
      // State-changing operations that require CSRF token (pattern-based)
      const stateChangingActions = [
        'create',
        'update',
        'delete',
        'remove',
        'submit',
        'approve',
        'reject',
        'cancel',
      ];

      // Check if this is a state-changing operation by pattern
      isStateChanging = stateChangingActions.some(
        (action) =>
          methodLower.endsWith(`.${action}`) ||
          methodLower.endsWith(`/${action}`),
      );
    }

    // Skip CSRF validation for read-only operations
    if (!isStateChanging) {
      return { valid: true, skipped: true };
    }

    // Get CSRF token from header
    const csrfToken = this.getHeader('x-csrf-token');

    // Get session CSRF token
    const sessionCsrfToken =
      this.session?.csrfToken || this.session?.state?.security?.csrf_token;

    if (!csrfToken) {
      return {
        valid: false,
        error: 'CSRF token required for state-changing operations',
        code: 'CSRF_TOKEN_REQUIRED',
      };
    }

    if (!sessionCsrfToken) {
      return {
        valid: false,
        error: 'Session CSRF token not found',
        code: 'SESSION_CSRF_MISSING',
      };
    }

    // Constant-time comparison to prevent timing attacks
    const crypto = require('node:crypto');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(csrfToken),
      Buffer.from(sessionCsrfToken),
    );

    if (!isValid) {
      // Update risk level on CSRF token mismatch
      this.updateSessionRiskLevel('high', 'csrf_token_mismatch');

      return {
        valid: false,
        error: 'Invalid CSRF token',
        code: 'CSRF_TOKEN_INVALID',
      };
    }

    return { valid: true };
  }

  /**
   * Update session risk level
   * @param {string} newRiskLevel - 'low' | 'medium' | 'high'
   * @param {string} reason - Reason for risk level change
   * @returns {Promise<boolean>} True if updated
   */
  async updateSessionRiskLevel(newRiskLevel, reason) {
    if (!this.session?.sessionId) {
      return false;
    }

    try {
      const session = await this.sessionManager.getSession(
        this.session.sessionId,
      );
      if (!session) {
        return false;
      }

      const previousRiskLevel = session.security?.risk_level || 'low';

      // Only escalate risk level (low → medium → high), don't downgrade automatically
      const riskLevels = { low: 0, medium: 1, high: 2 };
      if (riskLevels[newRiskLevel] <= riskLevels[previousRiskLevel]) {
        // Don't downgrade unless explicitly requested
        return false;
      }

      // Update risk level
      session.security.risk_level = newRiskLevel;
      session.security.last_risk_change = new Date().toISOString();
      session.security.risk_change_reason = reason;

      // Recalculate TTL (high risk sessions have shorter TTL)
      const idleTtl = this.sessionManager.idleTtl;
      const absoluteTtl = Math.floor(
        (new Date(session.meta.expires_at).getTime() - Date.now()) / 1000,
      );

      // Reduce TTL for high-risk sessions
      let effectiveIdleTtl = idleTtl;
      if (newRiskLevel === 'high') {
        effectiveIdleTtl = Math.floor(idleTtl / 2); // Half TTL for high risk
      } else if (newRiskLevel === 'medium') {
        effectiveIdleTtl = Math.floor(idleTtl * 0.75); // 75% TTL for medium risk
      }

      const ttl = Math.min(effectiveIdleTtl, absoluteTtl);

      // Update session in Redis
      const sessionKey = `session:${this.session.sessionId}`;
      await this.sessionManager.client.setEx(
        sessionKey,
        ttl,
        JSON.stringify(session),
      );

      // Log risk level change
      try {
        const logger = require('../lib/logger.js');
        logger.security('session-risk-level-updated', {
          sessionId: this.session.sessionId.substring(0, 10) + '...',
          userId: session.auth?.user_id,
          previousRiskLevel,
          newRiskLevel,
          reason,
          ip: this.ip,
        });
      } catch {}

      // Update in-memory session
      this.session.state = session;

      return true;
    } catch (err) {
      // console.error('updateSessionRiskLevel error:', err);
      return false;
    }
  }

  getCookies() {
    return this.#transport.getCookies();
  }

  getUserTimezone() {
    return this.#transport.getUserTimezone();
  }

  getHeader(name) {
    return this.#transport.getHeader(name);
  }

  getOrigin() {
    return this.#transport.getOrigin?.();
  }

  getReferrer() {
    return this.#transport.getReferrer?.();
  }

  getUserAgent() {
    return this.#transport.getUserAgent?.();
  }

  getRequestMeta() {
    const { normalizeIp } = require('../lib/common.js');
    return { ip: normalizeIp(this.ip), userAgent: this.getUserAgent() };
  }

  getServerStats() {
    return this.#transport?.server?.getClientStats();
  }

  checkSlidingLimit(scope, dimension, id, windowSec, limit) {
    return this.sessionManager.checkSlidingLimit(
      scope,
      dimension,
      id,
      windowSec,
      limit,
    );
  }

  /**
   * Start session with canonical schema (session-based authentication)
   * @param {object} userData - User data (id, email, roles, permissions, etc.)
   * @param {object} options - Session options (createdBy, rotate, rotationReason, authLevel, locale, tenantId, uiMode)
   * @returns {Promise<boolean>} True if session started successfully
   */
  async startSession(userData, options = {}) {
    try {
      const sm = this.sessionManager;
      const crypto = require('node:crypto');
      const { hashTokenHex, normalizeIp } = require('../lib/common.js');

      // 1. Check for existing session (for rotation)
      const oldSessionId =
        this.getCookies()?.['session_id'] || this.getCookies()?.['auth-token']; // Support both for migration

      // 2. Generate new session ID (pure random UUID, no signing)
      const sessionId = crypto.randomUUID();

      // 3. Build canonical session schema
      const now = new Date();
      const session = {
        meta: {
          created_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          expires_at: new Date(
            now.getTime() + sm.absoluteTtl * 1000,
          ).toISOString(),
          state: options.state || (userData.id ? 'authenticated' : 'anonymous'),
        },
        auth: {
          user_id: userData.id || null,
          roles: userData.roles || [],
          permissions: userData.permissions || [],
          department_id: userData.department_id || null,
          department: userData.department || null,
          auth_level: options.authLevel || (userData.id ? 1 : 0),
        },
        context: {
          timezone: this.getUserTimezone() || 'UTC',
          locale: options.locale || 'en',
          tenant_id: options.tenantId || null,
          ui_mode: options.uiMode || 'default',
        },
        security: {
          csrf_token: crypto.randomBytes(32).toString('hex'),
          ip: normalizeIp(this.ip),
          user_agent_hash: hashTokenHex(this.getUserAgent() || ''),
          risk_level: 'low',
        },
        flow: {},
      };

      // 4. Create session (or rotate old → new in one step to avoid double create + over-count)
      if (oldSessionId && options.rotate !== false) {
        await sm.rotateSessionCanonical(oldSessionId, sessionId, {
          reason: options.rotationReason || options.createdBy || 'login',
          newSession: session,
        });
      } else {
        await sm.createSession(sessionId, session);
      }

      // 5. Set session_id cookie (HttpOnly, Secure, SameSite)
      if (!this.#transport.connection) {
        this.#transport.sendSessionCookie(sessionId, sm.sessionTtl);
      }

      // 6. Store in client for current request
      this.session = new Session(sessionId, session);

      return true;
    } catch (error) {
      // console.error('startSession error:', error);
      return false;
    }
  }

  /**
   * Destroy all sessions for a user (canonical session model)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} True if destroyed
   */
  destroyAllUserSessions(userId) {
    return this.sessionManager.destroyAllUserSessions(userId);
  }

  close() {
    this.#transport.close();
  }

  getStream(streamId) {
    return streams.getStream(this, streamId);
  }

  createStream(streamId, metadata = {}, options = {}) {
    return streams.createStream(this, streamId, metadata, options);
  }

  endStream(streamId) {
    return streams.endStream(this, streamId);
  }

  terminateStream(streamId) {
    return streams.terminateStream(this, streamId);
  }

  destroy() {
    this.emit('close');
    this.session = null;
    streams.destroyAllStreams(this);
  }
}


module.exports = { Client };
