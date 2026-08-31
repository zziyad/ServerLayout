'use strict';

/**
 * JSON Schema for application configuration validation
 * Uses AJV via common.js validateSchema function
 */

const configSchema = {
  type: 'object',
  required: ['server', 'sessions'],
  properties: {
    server: {
      type: 'object',
      required: ['ports'],
      properties: {
        ports: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'integer',
            minimum: 1,
            maximum: 65535,
          },
          description: 'Server ports array (at least one port required)',
        },
        cors: {
          type: 'object',
          properties: {
            allowLocalhostLoopback: {
              type: 'boolean',
              description:
                'If true, allow any http(s) Origin whose host is localhost, 127.0.0.1, or ::1',
            },
            allowedOrigins: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'CORS allowed origins',
            },
          },
        },
        tls: {
          type: 'object',
          properties: {
            enabled: {
              type: 'boolean',
            },
            certPath: {
              type: 'string',
            },
            keyPath: {
              type: 'string',
            },
          },
          if: {
            properties: {
              enabled: { const: true },
            },
          },
          then: {
            required: ['certPath', 'keyPath'],
          },
        },
        queue: {
          type: 'object',
          properties: {
            concurrency: {
              type: 'integer',
              minimum: 1,
            },
            size: {
              type: 'integer',
              minimum: 1,
            },
            timeout: {
              type: 'integer',
              minimum: 1,
            },
          },
        },
        timeouts: {
          type: 'object',
          properties: {
            watch: {
              type: 'integer',
              minimum: 1,
            },
          },
        },
      },
    },
    sessions: {
      type: 'object',
      required: ['secret'],
      properties: {
        secret: {
          type: 'string',
          minLength: 32,
          description: 'Session secret (minimum 32 characters for security)',
        },
        accessTtl: {
          type: 'integer',
          minimum: 60,
          maximum: 900,
          description: 'Access token TTL in seconds (60-300 recommended)',
        },
        refreshTtl: {
          type: 'integer',
          minimum: 3600,
          description: 'Refresh token TTL in seconds (minimum 3600 = 1 hour)',
        },
      },
    },
    database: {
      type: 'object',
      properties: {
        host: {
          type: 'string',
        },
        port: {
          type: 'integer',
          minimum: 1,
          maximum: 65535,
        },
        database: {
          type: 'string',
        },
        user: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
        max: {
          type: 'integer',
          minimum: 1,
        },
        min: {
          type: 'integer',
          minimum: 0,
        },
      },
    },
    log: {
      type: 'object',
      properties: {
        level: {
          type: 'string',
          enum: ['debug', 'info', 'warn', 'error'],
        },
      },
    },
    realtime: {
      type: 'object',
      properties: {
        queue: {
          type: 'object',
          properties: {
            maxSize: {
              type: 'integer',
              minimum: 1,
            },
            maxAttempts: {
              type: 'integer',
              minimum: 1,
            },
            baseDelayMs: {
              type: 'integer',
              minimum: 0,
            },
            maxDelayMs: {
              type: 'integer',
              minimum: 0,
            },
          },
        },
      },
    },
    notifications: {
      type: 'object',
      properties: {},
    },
    cache: {
      type: 'object',
      properties: {
        maxFileSize: {
          type: 'string',
        },
      },
    },
  },
  additionalProperties: true, // Allow additional config sections
};

module.exports = { configSchema };
