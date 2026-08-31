'use strict';

const http = require('node:http');
const metautil = require('metautil');
const { Readable } = require('node:stream');
const { EventEmitter } = require('node:events');
const {
  buildCookieHeader,
  parseHost,
  isLocalhost,
  buildCorsHeaders,
  buildSecurityHeaders,
} = require('../lib/common.js');

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, Accept, Origin',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

const EPOCH = 'Thu, 01 Jan 1970 00:00:00 GMT';
const LOCATION = 'Path=/; Domain';

class Transport extends EventEmitter {
  constructor(server, req) {
    super();
    this.server = server;
    this.console = this.server.console;
    this.req = req;
    this.ip = req.socket.remoteAddress;
  }

  getHeader(name) {
    return this.req.headers[String(name || '').toLowerCase()];
  }

  error(
    code = 500,
    { id, error = null, httpCode = null, headers: extraHeaders = null } = {},
  ) {
    const { url, method } = this.req;
    const rawHttpCode = httpCode || error?.httpCode || code;
    httpCode = Number.isInteger(rawHttpCode) ? rawHttpCode : 500;
    const status = http.STATUS_CODES[httpCode];
    const pass = httpCode < 500 || httpCode > 599;
    const message = pass ? error?.message : status || 'Unknown error';
    const reason = `${code}\t${error ? error.stack : status}`;
    this.console.error(`${this.ip}\t${method}\t${url}\t${reason}`);
    const packet = { type: 'callback', id, error: { message, code, status } };
    const data = JSON.stringify(packet);
    // IMPORTANT: write directly to avoid double JSON encoding done by send()
    console.log({ DATA: data });
    this.write(data, httpCode, 'json', { headers: extraHeaders || undefined });
  }

  send(obj, code = 200) {
    const data = JSON.stringify(obj);
    this.write(data, code, 'json');
  }
}

class HttpTransport extends Transport {
  constructor(server, req, res) {
    super(server, req);
    this.res = res;
    if (req.method === 'OPTIONS') {
      this.options();
    }
    res.on('finish', () => {
      // this.console.info('CLOSE');
      this.emit('close');
    });
  }

  close() {
    if (this.req?.socket) {
      this.req.socket.destroy();
    }
    this.emit('close');
  }

  options() {
    const { res } = this;
    if (res.headersSent) return;
    // this.console.info('OPTIONS HEADERS');

    const origin = this.req.headers.origin;
    const corsHeaders = buildCorsHeaders(
      origin,
      this.server.application,
      HEADERS,
    );
    const securityHeaders = buildSecurityHeaders(this.server.isHttps);

    res.writeHead(204, { ...corsHeaders, ...securityHeaders });
    res.end();
  }

  async write(data, httpCode = 200, ext = 'json', options = {}) {
    const { res } = this;
    if (res.writableEnded) return;
    const streaming = data instanceof Readable;
    const mimeType = MIME_TYPES[ext] || MIME_TYPES.html;
    const origin = this.req.headers.origin;

    const corsHeaders = buildCorsHeaders(
      origin,
      this.server.application,
      HEADERS,
    );
    const securityHeaders = buildSecurityHeaders(this.server.isHttps);
    const headers = {
      ...corsHeaders,
      ...securityHeaders,
      'Content-Type': mimeType,
    };

    if (options?.headers && typeof options.headers === 'object') {
      Object.assign(headers, options.headers);
    }
    if (httpCode === 206) {
      const { start, end, size = '*' } = options;
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Accept-Ranges'] = 'bytes';
      headers['Content-Length'] = end - start + 1;
    }
    if (!streaming) headers['Content-Length'] = Buffer.byteLength(data);

    res.writeHead(httpCode, headers);
    if (streaming) data.pipe(res);
    else res.end(data);
  }

  getCookies() {
    const { cookie } = this.req.headers;
    if (!cookie) return {};
    return metautil.parseCookies(cookie);
  }

  /**
   * Get user timezone from cookie
   * @returns {string} IANA timezone string (e.g., 'Asia/Baku') or 'UTC' if not set
   */
  getUserTimezone() {
    const cookies = this.getCookies();
    const timezone = cookies.tz;
    if (!timezone) return 'UTC';
    if (timezone === 'UTC' || timezone === 'GMT') return timezone;
    if (timezone.includes('/') || /^[A-Z]{3,4}$/.test(timezone))
      return timezone;
    return 'UTC';
  }

  getOrigin() {
    return this.req.headers.origin;
  }

  getReferrer() {
    return this.req.headers.referer || this.req.headers.referrer;
  }

  getUserAgent() {
    return this.req.headers['user-agent'] || '';
  }

  /**
   * Universal method to send a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {number} maxAgeSeconds - TTL in seconds
   * @param {object} options - Additional options (path, domain, secure, sameSite)
   */
  sendCookie(name, value, maxAgeSeconds, options = {}) {
    const host = parseHost(this.req.headers);
    const isHttps = this.server.isHttps === true;
    const secure = options.secure !== undefined ? options.secure : isHttps;
    const sameSite = options.sameSite || (isHttps ? 'None' : 'Lax');
    const domain =
      options.domain !== undefined
        ? options.domain
        : isLocalhost(host)
        ? undefined
        : host;
    const path = options.path || '/';

    const cookie = buildCookieHeader({
      name,
      value,
      maxAgeSeconds,
      domain,
      secure,
      sameSite,
      path,
    });

    // this.console.info({ [name]: cookie });
    // Use appendHeader to add cookie without replacing existing ones
    this.res.appendHeader('Set-Cookie', cookie);
  }

  /**
   * Send user session cookie (session_id) - Canonical session model
   * @param {string} sessionId - Session ID (UUID)
   * @param {number} ttl - TTL in seconds
   */
  sendSessionCookie(sessionId, ttl) {
    const host = parseHost(this.req.headers);
    const isHttps = this.server.isHttps === true;
    const secure = isHttps;
    const sameSite = isHttps ? 'None' : 'Lax';
    const domain = isLocalhost(host) ? undefined : host;

    const sessionCookie = buildCookieHeader({
      name: 'session_id', // ✅ Changed from 'auth-token'
      value: sessionId,
      maxAgeSeconds: ttl,
      domain,
      secure,
      sameSite,
      path: '/',
      httpOnly: true, // ✅ MUST be HttpOnly
    });

    this.res.setHeader('Set-Cookie', [sessionCookie]);
  }

  // Note: sendSessionCookieLegacy() removed - user sessions no longer use auth-token/refresh-token cookies

  /**
   * Universal method to clear a cookie
   * @param {string} name - Cookie name
   * @param {string} path - Cookie path (default: '/')
   */
  clearCookie(name, path = '/') {
    const host = parseHost(this.req.headers);
    const isHttps = this.server.isHttps === true;
    const secure = isHttps;
    const sameSite = isHttps ? 'None' : 'Lax';
    const domain = isLocalhost(host) ? undefined : host;

    const expired = EPOCH;
    const base = (cookieName, cookiePath = '/') => {
      let cookie = `${cookieName}=deleted; Max-Age=0; Expires=${expired}; Path=${cookiePath};`;
      if (domain) cookie += ` Domain=${domain};`;
      cookie += ' HttpOnly;';
      if (secure) cookie += ' Secure;';
      if (sameSite) cookie += ` SameSite=${sameSite};`;
      return cookie;
    };

    const insecure = (cookieName, cookiePath = '/') =>
      `${cookieName}=deleted; Max-Age=0; Expires=${expired}; Path=${cookiePath}; HttpOnly;`;

    // Clear both secure and insecure versions
    // Use appendHeader to preserve other cookies if any
    this.res.appendHeader('Set-Cookie', base(name, path));
    this.res.appendHeader('Set-Cookie', insecure(name, path));
  }

  /**
   * Clear user session cookie (session_id) - Canonical session model
   */
  clearSessionCookies() {
    const host = parseHost(this.req.headers);
    const isHttps = this.server.isHttps === true;
    const secure = isHttps;
    const sameSite = isHttps ? 'None' : 'Lax';
    const domain = isLocalhost(host) ? undefined : host;

    const expired = EPOCH;
    const base = (name, path = '/') => {
      let cookie = `${name}=deleted; Max-Age=0; Expires=${expired}; Path=${path};`;
      if (domain) cookie += ` Domain=${domain};`;
      cookie += ' HttpOnly;';
      if (secure) cookie += ' Secure;';
      if (sameSite) cookie += ` SameSite=${sameSite};`;
      return cookie;
    };

    // Clear session_id cookie
    const clearSession = base('session_id', '/');

    const insecure = (name, path = '/') =>
      `${name}=deleted; Max-Age=0; Expires=${expired}; Path=${path}; HttpOnly;`;
    const clearSessionInsecure = insecure('session_id', '/');

    // Note: Legacy auth-token and refresh-token cookie clearing removed

    // Log for debugging (can be removed in production)
    this.console?.system('Clearing session cookies', {
      domain: domain || 'localhost',
      secure,
      sameSite,
    });

    // Use setHeader to replace all Set-Cookie headers (ensures cookie is cleared)
    this.res.setHeader('Set-Cookie', [clearSession, clearSessionInsecure]);
  }

  removeSessionCookie(sessionId) {
    const host = parseHost(this.req.headers);
    // this.console.info({ REMOVE: host, sessionId });
    this.res.setHeader(
      'Set-Cookie',
      `${sessionId}=deleted; Expires=${EPOCH}; ${LOCATION}=` + host,
    );
  }

  redirect(location) {
    const { res } = this;
    if (res.headersSent) return;
    const origin = this.req.headers.origin;
    const corsHeaders = buildCorsHeaders(
      origin,
      this.server.application,
      HEADERS,
    );
    const headers = { Location: location, ...corsHeaders };
    res.writeHead(302, headers);
    res.end();
  }
}

class WsTransport extends Transport {
  constructor(server, req, connection) {
    super(server, req);
    this.connection = connection;
    connection.on('close', () => {
      this.emit('close');
    });
  }

  getCookies() {
    const { cookie } = this.req.headers;
    if (!cookie) return {};
    // You already use metautil in HttpTransport, so same here
    const metautil = require('metautil');
    const cookies = metautil.parseCookies(cookie);
    return cookies;
  }

  write(data) {
    this.connection.send(data);
  }

  /**
   * Send binary data
   * @param {Buffer|ArrayBuffer|Uint8Array} data - Binary data
   */
  sendBinary(data) {
    this.connection.send(data);
  }

  /**
   * Send binary chunk for a stream
   * @param {string} streamId - Stream ID
   * @param {Buffer} chunk - Data chunk
   */
  sendStreamChunk(streamId, chunk) {
    // Format: [id_length:1][id:N][chunk_data]
    const idBuffer = Buffer.from(streamId, 'utf8');
    const idLength = Buffer.from([idBuffer.length]);
    const message = Buffer.concat([idLength, idBuffer, chunk]);

    // Log first chunk bytes to verify data integrity
    const isFirstChunk = !this._firstChunkSent;
    if (isFirstChunk) {
      this._firstChunkSent = true;
      const preview = chunk
        .slice(0, 16)
        .toString('hex')
        .match(/.{2}/g)
        .join(' ');
      console.log(`[Backend] First chunk preview (hex):`, preview);
    }

    console.log(`[Backend] Sending chunk:`, {
      streamId,
      chunkSize: chunk.length,
      idLength: idBuffer.length,
      totalMessageSize: message.length,
      expectedTotal: 1 + idBuffer.length + chunk.length,
    });

    this.sendBinary(message);
  }

  /**
   * Handle binary message (stream chunks)
   * @param {Buffer} data - Binary data
   */
  handleBinary(data, client) {
    try {
      // Extract stream ID from packet
      // Format: [id_length:1][id:N][chunk_data]
      const idLength = data[0];
      const streamId = data.slice(1, 1 + idLength).toString('utf8');
      const chunkData = data.slice(1 + idLength);

      // Get stream
      const stream = client.streams.get(streamId);
      if (stream) {
        stream.bytesReceived += chunkData.length;
        stream.writable.write(chunkData);
      } else {
        this.console.warn(`Received chunk for unknown stream: ${streamId}`);
      }
    } catch (error) {
      this.console.error('Failed to handle binary message:', error);
    }
  }

  close() {
    this.connection.terminate();
    this.emit('close');
  }
}

module.exports = { Transport, HttpTransport, WsTransport, MIME_TYPES, HEADERS };
