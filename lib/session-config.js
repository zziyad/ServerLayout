// FILE: lib/session-config.js
'use strict';

const { getConfigValue } = require('./common.js');

class SessionConfigManager {
  constructor(config = {}, options = {}) {
    this.config = config;
    this.options = options;
    this.confPath = '../application/config/sessions.js';
  }

  /**
   * Get access token TTL with proper precedence:
   * 1. Explicit parameter
   * 2. Environment variable (ACCESS_TOKEN_TTL)
   * 3. Config file value
   * 4. Default (15 minutes)
   */
  getAccessTtl(explicitValue = null) {
    // Priority 1: Explicit value
    if (explicitValue !== null && typeof explicitValue === 'number') {
      return explicitValue;
    }

    // Priority 2: Environment variable
    const envValue = Number(process.env.ACCESS_TOKEN_TTL);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }

    // Priority 3: Config file
    const configValue = this.config?.sessions?.accessTtl;
    if (typeof configValue === 'number' && configValue > 0) {
      return configValue;
    }

    // Priority 4: Default (15 minutes)
    return getConfigValue(this.confPath, 'accessTtl', 15 * 60);
  }

  /**
   * Get refresh token TTL with proper precedence:
   * 1. Explicit parameter
   * 2. Environment variable (REFRESH_TOKEN_TTL)
   * 3. Config file value
   * 4. Default (7 days)
   */
  getRefreshTtl(explicitValue = null) {
    // Priority 1: Explicit value
    if (explicitValue !== null && typeof explicitValue === 'number') {
      return explicitValue;
    }

    // Priority 2: Environment variable
    const envValue = Number(process.env.REFRESH_TOKEN_TTL);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }

    // Priority 3: Config file
    const configValue = this.config?.sessions?.refreshTtl;
    if (typeof configValue === 'number' && configValue > 0) {
      return configValue;
    }

    // Priority 4: Default (7 days)
    return getConfigValue(this.confPath, 'refreshTtl', 7 * 24 * 60 * 60);
  }

  getSessionConfig(explicitAccessTtl = null, explicitRefreshTtl = null) {
    return {
      accessTtl: this.getAccessTtl(explicitAccessTtl),
      refreshTtl: this.getRefreshTtl(explicitRefreshTtl),
    };
  }

  validateConfig() {
    const accessTtl = this.getAccessTtl();
    const refreshTtl = this.getRefreshTtl();

    const errors = [];

    if (accessTtl <= 0) {
      errors.push('Access TTL must be greater than 0');
    }

    if (refreshTtl <= 0) {
      errors.push('Refresh TTL must be greater than 0');
    }

    if (accessTtl >= refreshTtl) {
      errors.push('Access TTL should be less than Refresh TTL');
    }

    if (accessTtl > 24 * 60 * 60) {
      // 24 hours
      errors.push('Access TTL should not exceed 24 hours for security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      config: { accessTtl, refreshTtl },
    };
  }

  logConfig(logger = console) {
    const accessTtl = this.getAccessTtl();
    const refreshTtl = this.getRefreshTtl();

    const accessSource = this.getAccessTtlSource();
    const refreshSource = this.getRefreshTtlSource();

    logger.log('[sessions] ACCESS_TTL(s)=', accessTtl, `(${accessSource})`);
    logger.log('[sessions] REFRESH_TTL(s)=', refreshTtl, `(${refreshSource})`);

    return { accessTtl, refreshTtl, accessSource, refreshSource };
  }

  getAccessTtlSource() {
    if (process.env.ACCESS_TOKEN_TTL) return 'environment';
    if (this.config?.sessions?.accessTtl) return 'config';
    return 'default';
  }

  getRefreshTtlSource() {
    if (process.env.REFRESH_TOKEN_TTL) return 'environment';
    if (this.config?.sessions?.refreshTtl) return 'config';
    return 'default';
  }

  /**
   * Get idle TTL (session expires after inactivity) with proper precedence:
   * 1. Environment variable (SESSION_IDLE_TTL)
   * 2. Config file value
   * 3. Default (30 minutes)
   */
  getIdleTtl() {
    // Priority 1: Environment variable
    const envValue = Number(process.env.SESSION_IDLE_TTL);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }

    // Priority 2: Config file
    const configValue = this.config?.sessions?.idleTtl;
    if (typeof configValue === 'number' && configValue > 0) {
      return configValue;
    }

    // Priority 3: Default (30 minutes)
    return getConfigValue(this.confPath, 'idleTtl', 30 * 60);
  }

  /**
   * Get absolute TTL (maximum session lifetime) with proper precedence:
   * 1. Environment variable (SESSION_ABSOLUTE_TTL)
   * 2. Config file value
   * 3. Default (24 hours)
   */
  getAbsoluteTtl() {
    // Priority 1: Environment variable
    const envValue = Number(process.env.SESSION_ABSOLUTE_TTL);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }

    // Priority 2: Config file
    const configValue = this.config?.sessions?.absoluteTtl;
    if (typeof configValue === 'number' && configValue > 0) {
      return configValue;
    }

    // Priority 3: Default (24 hours)
    return getConfigValue(this.confPath, 'absoluteTtl', 24 * 60 * 60);
  }

  /**
   * Get session TTL (default sliding window TTL) with proper precedence:
   * 1. Environment variable (SESSION_TTL)
   * 2. Config file value
   * 3. Default (same as idleTtl)
   */
  getSessionTtl() {
    // Priority 1: Environment variable
    const envValue = Number(process.env.SESSION_TTL);
    if (Number.isFinite(envValue) && envValue > 0) {
      return envValue;
    }

    // Priority 2: Config file
    const configValue = this.config?.sessions?.sessionTtl;
    if (typeof configValue === 'number' && configValue > 0) {
      return configValue;
    }

    // Priority 3: Default (same as idleTtl)
    return this.getIdleTtl();
  }

  /**
   * Get sliding TTL extend throttle (seconds). When > 0, updateLastSeen will only write Redis
   * if (now - last_seen_at_sec) >= this value, reducing write amplification under high traffic.
   * 0 = no throttle (extend on every call).
   */
  getExtendThresholdSec() {
    const envValue = Number(process.env.SESSION_EXTEND_THRESHOLD_SEC);
    if (Number.isFinite(envValue) && envValue >= 0) {
      return envValue;
    }
    const configValue = this.config?.sessions?.extendThreshold;
    if (typeof configValue === 'number' && configValue >= 0) {
      return configValue;
    }
    return getConfigValue(this.confPath, 'extendThreshold', 0);
  }

  /**
   * Get grace period (for read-only operations) with proper precedence:
   * 1. Environment variable (SESSION_GRACE_PERIOD)
   * 2. Config file value
   * 3. Default (15 seconds)
   */
  getGracePeriod() {
    // Priority 1: Environment variable
    const envValue = Number(process.env.SESSION_GRACE_PERIOD);
    if (Number.isFinite(envValue) && envValue >= 0) {
      return envValue;
    }

    // Priority 2: Config file
    const configValue = this.config?.sessions?.gracePeriod;
    if (typeof configValue === 'number' && configValue >= 0) {
      return configValue;
    }

    // Priority 3: Default (15 seconds)
    return getConfigValue(this.confPath, 'gracePeriod', 15);
  }
}

function createSessionConfig(config = {}, options = {}) {
  return new SessionConfigManager(config, options);
}

module.exports = {
  SessionConfigManager,
  createSessionConfig,
};
