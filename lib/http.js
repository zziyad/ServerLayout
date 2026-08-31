'use strict';

const jsonParse = (buffer) => {
  if (buffer.length === 0) return null;
  try {
    return JSON.parse(buffer);
  } catch {
    return null;
  }
};
const receiveBody = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  return Buffer.concat(buffers).toString();
};
const parseHost = (headers) => {
  const host = headers.host || '';
  const portOffset = host.indexOf(':');
  if (portOffset > -1) return host.substring(0, portOffset);
  return host;
};

/**
 * Check if host is localhost
 */
const isLocalhost = (host) => {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
};

/**
 * Get CORS configuration
 */
const parseEnvList = (name) => {
  const value = process.env[name];
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const getCorsConfig = (application) => {
  const configured = application?.config?.server?.cors?.allowedOrigins || [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];
  return [...configured, ...parseEnvList('CORS_EXTRA_ORIGINS')];
};

/**
 * True for browser Origin values from loopback hosts (any port).
 * Used when server.cors.allowLocalhostLoopback is true so dev UIs need not list every port.
 */
const isLocalhostLoopbackOrigin = (origin) => {
  try {
    const u = new URL(origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const h = u.hostname;
    return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
  } catch {
    return false;
  }
};

/**
 * Check if origin is allowed
 */
const isOriginAllowed = (origin, application) => {
  if (!origin) return false;
  const cfg = application?.config?.server?.cors;
  if (cfg?.allowLocalhostLoopback && isLocalhostLoopbackOrigin(origin)) {
    return true;
  }
  const allowed = getCorsConfig(application);
  const allowedSet = new Set(allowed);
  return allowedSet.has(origin);
};

/**
 * Build CORS headers
 */
const buildCorsHeaders = (origin, application, baseHeaders = {}) => {
  const headers = { ...baseHeaders };

  if (isOriginAllowed(origin, application)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }

  return headers;
};

/**
 * Build security headers
 */
const buildSecurityHeaders = (isHttps = false) => {
  // Determine if we're in local development mode
  // Check NODE_ENV and hostname to determine environment
  const isLocal =
    process.env.NODE_ENV !== 'production' ||
    process.env.ALLOW_LOCALHOST === 'true';

  const connectSrc = [
    "'self'",
    'http://localhost:8010',
    'ws://localhost:8010',
    'http://127.0.0.1:8010',
    'ws://127.0.0.1:8010',
    'https://ts-int.digital',
    'wss://ts-int.digital',
    'ws://ts-int.digital',
    'http://ts-int.digital',
    'https://*.ts-int.digital',
    'wss://*.ts-int.digital',
    ...parseEnvList('CSP_EXTRA_CONNECT_SRC'),
  ];

  const csp = [
    "default-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-ancestors 'self'",
    "base-uri 'none'",
  ].join('; ');
  const headers = {
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': csp,
  };

  if (isHttps) {
    headers['Strict-Transport-Security'] =
      'max-age=31536000; includeSubdomains; preload';
  }

  return headers;
};

/**
 * Extract origin from referer header
 */
const extractOriginFromReferer = (referer) => {
  try {
    const url = new URL(referer);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
};


module.exports = {
  jsonParse,
  receiveBody,
  parseHost,
  isLocalhost,
  parseEnvList,
  getCorsConfig,
  isLocalhostLoopbackOrigin,
  isOriginAllowed,
  buildCorsHeaders,
  buildSecurityHeaders,
  extractOriginFromReferer,
};
