'use strict';

/**
 * Configuration Validator
 * Validates application configuration against defined schemas
 * Used in main.js to fail fast on invalid configuration
 */

/**
 * Validate server configuration
 */
const validateServerConfig = (config) => {
  const errors = [];

  if (!config) {
    errors.push('server section is missing');
    return errors;
  }

  // Ports validation
  if (!config.ports) {
    errors.push('server.ports is required');
  } else if (!Array.isArray(config.ports)) {
    errors.push('server.ports must be an array');
  } else if (config.ports.length === 0) {
    errors.push('server.ports must have at least one port');
  } else {
    config.ports.forEach((port, index) => {
      if (typeof port !== 'number') {
        errors.push(`server.ports[${index}] must be a number`);
      } else if (port < 1 || port > 65535) {
        errors.push(`server.ports[${index}] must be between 1 and 65535`);
      }
    });
  }

  // CORS validation (optional but recommended)
  if (config.cors) {
    if (!Array.isArray(config.cors.allowedOrigins)) {
      errors.push('server.cors.allowedOrigins must be an array');
    } else {
      const env = process.env.NODE_ENV || 'development';
      if (env === 'production') {
        const hasWildcard = config.cors.allowedOrigins.some(
          (o) => o === '*' || /\*$/.test(o),
        );
        if (hasWildcard) {
          errors.push(
            'server.cors.allowedOrigins should not contain wildcards in production',
          );
        }
      }
    }
  }

  // TLS validation (optional)
  if (config.tls?.enabled) {
    if (!config.tls.certPath) {
      errors.push('server.tls.certPath is required when TLS is enabled');
    }
    if (!config.tls.keyPath) {
      errors.push('server.tls.keyPath is required when TLS is enabled');
    }
  }

  return errors;
};

/**
 * Validate sessions configuration
 */
const validateSessionsConfig = (config) => {
  const errors = [];
  const warnings = [];

  if (!config) {
    errors.push('sessions section is missing');
    return errors;
  }

  // Secret validation
  if (!config.secret) {
    errors.push('sessions.secret is required');
  } else if (typeof config.secret !== 'string') {
    errors.push('sessions.secret must be a string');
  } else if (config.secret.length < 32) {
    errors.push('sessions.secret must be at least 32 characters for security');
  }

  // TTL validation (optional)
  if (config.accessTtl !== undefined) {
    if (typeof config.accessTtl !== 'number') {
      errors.push('sessions.accessTtl must be a number (seconds)');
    } else if (config.accessTtl < 60) {
      errors.push('sessions.accessTtl must be at least 60 seconds');
    } else if (config.accessTtl > 300) {
      warnings.push(
        'sessions.accessTtl > 300s increases attack window (recommended: 60-300s)',
      );
    }
  }

  if (config.refreshTtl !== undefined) {
    if (typeof config.refreshTtl !== 'number') {
      errors.push('sessions.refreshTtl must be a number (seconds)');
    } else if (config.refreshTtl < 3600) {
      errors.push('sessions.refreshTtl must be at least 3600 seconds (1 hour)');
    }
  }

  // Attach warnings for caller (non-fatal)
  if (warnings.length) {
    try {
      console.warn('[config] sessions warnings:', warnings);
    } catch {}
  }

  return errors;
};

/**
 * Validate database configuration
 */
const validateDatabaseConfig = (config) => {
  const errors = [];

  if (!config) {
    // Database is optional
    return errors;
  }

  const requiredFields = ['host', 'port', 'database', 'user', 'password'];

  requiredFields.forEach((field) => {
    if (!config[field]) {
      errors.push(`database.${field} is required`);
    }
  });

  // Port validation
  if (config.port !== undefined) {
    if (typeof config.port !== 'number') {
      errors.push('database.port must be a number');
    } else if (config.port < 1 || config.port > 65535) {
      errors.push('database.port must be between 1 and 65535');
    }
  }

  // Connection pool validation (optional)
  if (config.max !== undefined && typeof config.max !== 'number') {
    errors.push('database.max must be a number');
  }
  if (config.min !== undefined && typeof config.min !== 'number') {
    errors.push('database.min must be a number');
  }

  return errors;
};

/**
 * Validate log configuration
 */
const validateLogConfig = (config) => {
  const errors = [];

  if (!config) {
    // Log is optional
    return errors;
  }

  // Level validation (optional)
  if (config.level) {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(config.level)) {
      errors.push(`log.level must be one of: ${validLevels.join(', ')}`);
    }
  }

  return errors;
};

/**
 * Main validation function
 * Validates all configuration sections
 */
const validateConfig = (config) => {
  const allErrors = [];

  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['Configuration must be an object'],
    };
  }

  // Validate each section
  const sections = {
    server: validateServerConfig(config.server),
    sessions: validateSessionsConfig(config.sessions),
    database: validateDatabaseConfig(config.database),
    log: validateLogConfig(config.log),
  };

  // Collect all errors with section names
  Object.entries(sections).forEach(([section, errors]) => {
    if (errors.length > 0) {
      allErrors.push(...errors.map((err) => `[${section}] ${err}`));
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    sections: Object.keys(sections).reduce((acc, key) => {
      acc[key] = sections[key].length === 0;
      return acc;
    }, {}),
  };
};

module.exports = {
  validateConfig,
  validateServerConfig,
  validateSessionsConfig,
  validateDatabaseConfig,
  validateLogConfig,
};
