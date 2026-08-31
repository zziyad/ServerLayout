'use strict';

const https = require('node:https');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ws = require('ws');
const {
  receiveBody,
  jsonParse,
  isOriginAllowed,
  extractOriginFromReferer,
} = require('../lib/common.js');
const transport = require('./transport.js');
const { HttpTransport, WsTransport } = transport;
const { SessionManager } = require('./sessionManager.js');
const { Client } = require('./client.js');
const { createRpcChain, runRpc } = require('./rpc-pipeline.js');
const metautil = require('metautil');
const EMPTY_PACKET = Buffer.from('{}');

class Server {
  constructor(application) {
    this.application = application;
    this.rpcChain = createRpcChain();
    const { console, config } = application;
    this.console = console;
    this.clients = new Set();
    this.semaphore = application.semaphore;
    const sslOptions = this.getSSLOptions();
    if (sslOptions) {
      this.httpServer = https.createServer(sslOptions);
      this.isHttps = true;
      // this.console.log('HTTPS server created with SSL certificates');
    } else {
      // console.log('No SSL certificates found');
      this.httpServer = http.createServer();
      this.isHttps = false;
      // this.console.log('HTTP server created (no SSL certificates found)');
    }

    const [port] = config.server.ports;
    if (!config?.sessions?.secret) {
      // this.console.info(
      //   'Session secret is not configured. Access tokens cannot be validated.',
      // );
    }
    try {
      const env = process.env.NODE_ENV || 'development';
      const allowed = config?.server?.cors?.allowedOrigins || [];
      const hasWildcard = allowed.some((o) => o === '*' || /\*$/.test(o));
      if (env === 'production' && (allowed.length === 0 || hasWildcard)) {
        // this.console.info('Weak CORS policy in production');
        try {
          require('../lib/logger.js').system('weak-cors', { allowed });
        } catch {}
      }
    } catch {}
    this.sessionManager = new SessionManager({ config });
    this.sessionManager.configManager.logConfig(this.console);
    // // Allowed units for auto-broadcast (CRUD fallback)
    // this.autoBroadcastUnits = new Set(
    //   Array.isArray(config?.realtime?.autoUnits)
    //     ? config.realtime.autoUnits
    //     : ['event', 'driver', 'fleet', 'guests', 'schedules', 'vapp'],
    // );
    // this.autoBroadcastActions = new Set(['create', 'update', 'delete']);
    this.listen(port);
    this.console.system(
      `API on port ${port} (${sslOptions ? 'HTTPS' : 'HTTP'})`,
    );
  }

  getSSLOptions() {
    try {
      const tls = this.application?.config?.server?.tls;
      if (tls?.enabled && tls.certPath && tls.keyPath) {
        if (fs.existsSync(tls.certPath) && fs.existsSync(tls.keyPath)) {
          return {
            cert: fs.readFileSync(tls.certPath),
            key: fs.readFileSync(tls.keyPath),
          };
        }
      }
      const devCertPath = path.join(process.cwd(), 'certs-old', 'cert.pem');
      const devKeyPath = path.join(process.cwd(), 'certs-old', 'key.pem');
      if (fs.existsSync(devCertPath) && fs.existsSync(devKeyPath)) {
        return {
          cert: fs.readFileSync(devCertPath),
          key: fs.readFileSync(devKeyPath),
        };
      }
      return null;
    } catch (error) {
      // console.warn('SSL certificate loading failed:', error.message);
      return null;
    }
  }

  listen(port) {
    this.httpServer.on('request', async (req, res) => {
      const transport = new HttpTransport(this, req, res);
      if (req.url === '/api/auth/refresh' && req.method === 'POST') {
        const client = new Client(transport);
        const refreshPacket = {
          type: 'call',
          id: 'refresh',
          method: 'auth/refresh',
          args: {},
        };
        this.rpc(client, refreshPacket);
        return;
      }

      if (!req.url.startsWith('/api'))
        return void this.application.static.serve(req.url, transport);

      if (req.method === 'OPTIONS') return;

      const client = new Client(transport);
      const data = await receiveBody(req);
      this.request(client, data);
    });

    const wsServer = new ws.Server({
      server: this.httpServer,
      verifyClient: (info, done) => {
        const origin = info.origin;
        // this.console.info(`WS origin: ${origin}`);
        if (!origin || !isOriginAllowed(origin, this.application)) {
          // this.console.info(`WS rejected: origin=${origin ?? 'n/a'}`);
          done(false, 403, 'Forbidden origin');
          return;
        }
        done(true);
      },
    });
    wsServer.on('connection', (connection, req) => {
      const transport = new WsTransport(this, req, connection);
      const client = new Client(transport);

      connection.on('message', (data) => {
        // Distinguish between JSON (text) and binary messages
        // JSON messages start with '{' (0x7B) or '[' (0x5B)
        // Binary stream chunks start with a length byte
        const firstByte = data[0];
        const isJson = firstByte === 0x7b || firstByte === 0x5b; // '{' or '['

        if (isJson) {
          // Handle JSON messages (RPC and stream control)
          this.message(client, data);
        } else {
          // Handle binary messages (stream chunks)
          transport.handleBinary(data, client);
        }
      });

      connection.on('close', () => {
        client.destroy();
      });
    });

    this.httpServer.listen(port);
  }

  broadcast(name, data, options = {}) {
    if (!name) return { delivered: 0, skipped: this.clients.size };

    const { authenticatedOnly = false, driverOnly = false, filter } = options;

    let delivered = 0;
    let skipped = 0;

    for (const client of this.clients) {
      if (!client?.isWebSocket?.()) {
        skipped++;
        continue;
      }
      if (authenticatedOnly && !client.session) {
        skipped++;
        continue;
      }
      if (driverOnly && !client.driverSession) {
        skipped++;
        continue;
      }
      if (typeof filter === 'function' && filter(client) === false) {
        skipped++;
        continue;
      }

      try {
        client.emit(name, data);
        delivered++;
      } catch (error) {
        skipped++;
        this.console.error('[Broadcast] Failed to deliver event', {
          name,
          error: error?.message,
        });
      }
    }

    return { delivered, skipped };
  }

  message(client, data) {
    if (Buffer.compare(EMPTY_PACKET, data) === 0) {
      return void client.send({});
    }
    const packet = metautil.jsonParse(data) || {};
    if (!packet) {
      const error = new Error('JSON parsing error');
      client.error(500, { error, pass: true });
      return;
    }
    const { id, type, method } = packet;
    // Support broadcasting events sent from clients (optional usage)
    if (type === 'event' && typeof packet.name === 'string' && packet.name) {
      // try {
      //   this.broadcast(packet.name, packet.data, { authenticatedOnly: true });
      // } catch {}
      return;
    }

    if (type === 'call' && id && method) {
      return this.rpc(client, packet);
    }

    // Handle stream control packets
    if (type === 'stream' && id) {
      return this.handleStream(client, packet);
    }

    const error = new Error('Packet structure error');
    client.error(500, { id, error, pass: true });
  }

  request(client, data) {
    const packet = jsonParse(data);
    if (!packet) {
      const error = new Error('JSON parsing error');
      client.error(500, { error, pass: true });
      return;
    }

    const { id, type, method } = packet;

    const origin = client.getOrigin?.();
    const referer = client.getReferrer?.();
    const xrw = client.getHeader?.('x-requested-with');

    if (origin && !isOriginAllowed(origin, this.application)) {
      this.semaphore.leave();
      client.error(403, {
        id,
        error: { message: 'Forbidden origin', code: 'CSRF_FORBIDDEN' },
        httpCode: 403,
      });
      return;
    }
    if (!origin && referer) {
      const refOrigin = extractOriginFromReferer(referer);
      if (refOrigin && !isOriginAllowed(refOrigin, this.application)) {
        this.semaphore.leave();
        client.error(403, {
          id,
          error: { message: 'Forbidden referer', code: 'CSRF_FORBIDDEN' },
          httpCode: 403,
        });
        return;
      }
    }
    if (xrw !== 'XMLHttpRequest') {
      this.semaphore.leave();
      client.error(403, {
        id,
        error: { message: 'X-Requested-With required', code: 'CSRF_FORBIDDEN' },
        httpCode: 403,
      });
      return;
    }
    if (type === 'call' && id && method) {
      return this.rpc(client, packet);
    }

    // Handle stream control packets
    if (type === 'stream' && id) {
      return this.handleStream(client, packet);
    }

    const error = new Error('Packet structure error');
    client.error(500, { id, error, pass: true });
  }

  /**
   * Handle stream control packets
   */
  handleStream(client, packet) {
    const { id, status, name, size } = packet;

    try {
      if (status === 'init') {
        // Client initiating stream (upload: client → server)
        const stream = client.createStream(
          id,
          { name, size },
          { direction: 'upload' },
        );

        // Send ready acknowledgment
        client.send({
          type: 'stream',
          id,
          status: 'ready',
        });

        // Emit stream event for API handlers
        client.emit('stream', { id, stream, metadata: { name, size } });
      } else if (status === 'end') {
        // Mark stream as ended (but don't delete yet - API might need it)
        const stream = client.streams.get(id);
        if (stream) {
          stream.ended = true;
          stream.writable.end(); // Signal no more writes
        }
      } else if (status === 'terminate') {
        // Stream cancelled/terminated
        client.terminateStream(id);
      }
    } catch (error) {
      this.console.error('Stream handling error:', error);
      client.send({
        type: 'stream',
        id,
        status: 'error',
        error: error.message,
      });
    }
  }

  async rpc(client, packet) {
    if (!packet) {
      const error = new Error('Packet is required');
      client.error(500, { error, pass: true });
      return;
    }

    try {
      await this.semaphore.enter();
    } catch (error) {
      client.error(503, {
        id: packet.id,
        error: {
          message: 'Server is busy, please try again later',
          code: 'SERVICE_UNAVAILABLE',
        },
        httpCode: 503,
      });
      return;
    }

    try {
      const { id, type, args } = packet;
      if (type !== 'call' || !id || !args) {
        this.semaphore.leave();
        const error = new Error('Packet structure error');
        client.error(400, { id, error, pass: true });
        return;
      }
      const proc = this.application.routing.get(
        packet.method.split('/').filter(Boolean).join('.'),
      );
      if (!proc) {
        this.semaphore.leave();
        // Include method name in the message so frontend can debug (WS callbacks don't include method otherwise)
        client.error(404, {
          id,
          httpCode: 404,
          error: {
            message: `Method not found: ${packet.method}`,
            code: 404,
          },
        });
        return;
      }

      const context = client.createContext();
      context.sessionManager = this.sessionManager;
      context.config = this.application.config;
      context.application = this.application;

      if (
        !context.notificationManager &&
        this.application?.notificationManager
      ) {
        context.notificationManager = this.application.notificationManager;
      }
      await runRpc(this.rpcChain, {
        server: this,
        client,
        packet,
        context,
        proc,
        halted: false,
      });
    } catch (error) {
      this.semaphore.leave();
      throw error;
    }
  }

  // Optimization: efficient condition waiting with timeout
  async _waitForCondition(condition, description, maxWaitMs = 5000) {
    const startTime = Date.now();
    const checkInterval = 50; // Start with 50ms
    let iteration = 0;

    while (!condition()) {
      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitMs) {
        // this.console.info(
        //   `Timeout waiting for ${description} after ${elapsed}ms`,
        // );
        return false;
      }

      // Exponential backoff up to 500ms
      const delay = Math.min(checkInterval * Math.pow(1.5, iteration), 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
      iteration++;
    }

    // const elapsed = Date.now() - startTime;
    // this.console.log(`✓ ${description} completed in ${elapsed}ms`);
    return true;
  }

  async shutdown() {
    // const shutdownStart = Date.now();
    // this.console.log('Shutting down server...');

    // Wait for pending requests (optimization: better waiting mechanism)
    if (!this.semaphore.empty) {
      // this.console.log(
      //   `Waiting for ${this.semaphore.queue.length} pending request(s)...`,
      // );
      await this._waitForCondition(
        () => this.semaphore.empty,
        'pending requests to complete',
        5000,
      );
    }

    this.closeClients();

    // Wait for clients to disconnect (optimization: better waiting mechanism)
    if (this.clients.size > 0) {
      // this.console.log(
      //   `Waiting for ${this.clients.size} client(s) to disconnect...`,
      // );
      await this._waitForCondition(
        () => this.clients.size === 0,
        'clients to disconnect',
        3000,
      );
    }

    if (this.httpServer && this.httpServer.listening) {
      return new Promise((resolve) => {
        this.httpServer.close(() => {
          // const elapsed = Date.now() - shutdownStart;
          // this.console.log(`Server shutdown complete (${elapsed}ms)`);
          resolve();
        });
      });
    }
  }

  closeClients() {
    for (const client of this.clients) {
      client.close();
    }
  }

  async getClientStats() {
    const activeSessions = await this.sessionManager.getActiveSessionsCount();

    return {
      activeConnections: this.clients.size,
      connectionsWithSessions: Array.from(this.clients).filter((c) => c.session)
        .length,
      connectionsWithoutSessions: Array.from(this.clients).filter(
        (c) => !c.session,
      ).length,
      activeSessions: activeSessions,
      totalUsers: activeSessions,
      queue: {
        available: this.semaphore.counter,
        waiting: this.semaphore.queue.length,
        concurrency: this.semaphore.concurrency,
        empty: this.semaphore.empty,
      },
    };
  }
}

module.exports = { Server };
