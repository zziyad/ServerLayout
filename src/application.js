'use strict';

const { node, metarhia } = require('./dependencies.js');
const { EventEmitter } = node.events;
const { DirectoryWatcher } = metarhia.metawatch;
const { Code } = require('./code.js');
const { Api } = require('./api.js');
const { Static } = require('./static.js');

class Application extends EventEmitter {
  constructor({ path, sandbox, console }) {
    super();
    this.path = path;
    this.sandbox = sandbox;
    this.console = console || global.console;

    this.starts = [];
    this.config = null;
    this.static = null;
    this.server = null;
    this.semaphore = null;
    this.routing = null;
    this.watcher = null;
    this.eventBus = null;
    this.notificationPipeline = null;
    this.notificationQueue = null;
    this.notificationDispatcher = null;
    this.notificationManager = null;
    this.scheduler = null;
    this.api = null;
    this.lib = null;
    this.domain = null;
    this.configCode = null;
  }

  absolute(relative) {
    return node.path.join(this.path, relative);
  }

  execute(method, ...args) {
    return method(...args).catch((error) => {
      const msg = `Failed to execute method: ${error?.message}`;
      this.console.error(msg, error.stack);
      return Promise.reject(error);
    });
  }

  // Extract common path resolution logic (optimization: reduce duplication)
  _resolveWatcherPath(filePath) {
    const relPath = filePath.substring(this.path.length + 1);
    const sepIndex = relPath.indexOf(node.path.sep);
    if (sepIndex === -1) return null;

    const place = relPath.substring(0, sepIndex);
    const target = place === 'config' ? this.configCode : this[place];

    return { relPath, place, target };
  }

  startWatch(timeout = 1000) {
    if (this.watcher) return;
    this.watcher = new DirectoryWatcher({ timeout });

    this.watcher.on('change', async (filePath) => {
      const resolved = this._resolveWatcherPath(filePath);
      if (!resolved) return;

      const { relPath, target } = resolved;

      try {
        const stat = await node.fsp.stat(filePath);
        if (stat.isDirectory()) {
          if (target?.load) await target.load(filePath);
          return;
        }

        this.console.debug('Reload: /' + relPath);
        if (target?.change) await target.change(filePath);
      } catch (error) {
        // File may have been deleted between event and stat
        if (error.code !== 'ENOENT' && this.console?.warn) {
          this.console.warn(`Watcher error for ${relPath}:`, error.message);
        }
      }
    });

    this.watcher.on('delete', (filePath) => {
      const resolved = this._resolveWatcherPath(filePath);
      if (!resolved) return;

      const { relPath, target } = resolved;

      if (target?.delete) target.delete(filePath);
      // if (this.console?.debug) this.console.debug('Deleted: /' + relPath);
    });
  }

  // Add cleanup method for graceful shutdown (optimization: proper resource cleanup)
  async stopWatch() {
    if (!this.watcher) return;

    // Clear pending timer
    if (this.watcher.timer) {
      clearTimeout(this.watcher.timer);
      this.watcher.timer = null;
    }

    // Close all file system watchers
    for (const [, watcher] of this.watcher.watchers) {
      try {
        watcher.close();
      } catch (error) {
        // Ignore errors when closing watchers
      }
    }

    // Clear watchers map and remove all listeners
    this.watcher.watchers.clear();
    this.watcher.removeAllListeners();
    this.watcher = null;
  }

  /**
   * Initialize application modules (Code, Api, Static) and load them
   * Part 1: Module creation and loading
   */
  async initializeModules() {
    // Create module instances
    const config = new Code('config', this);
    const lib = new Code('lib', this);
    const domain = new Code('domain', this);
    const api = new Api('api', this);

    // Assign to application instance
    this.api = api;
    this.lib = lib;
    this.domain = domain;
    this.configCode = config;
    this.static = new Static('static', this);

    // Start file watcher BEFORE loading (Place.load needs it)
    const watchTimeout = 1000; // Will be reconfigured after config loads
    this.startWatch(watchTimeout);

    // Parallel module loading with error aggregation
    // this.console.info('Loading modules in parallel...');
    const moduleNames = ['lib', 'domain', 'config', 'api'];

    // Performance instrumentation (optimization: track load times)
    const loadStartTime = Date.now();
    const moduleLoaders = [
      lib.load(),
      domain.load(),
      config.load(),
      api.load(),
    ];

    const loadResults = await Promise.allSettled(moduleLoaders);
    const loadDuration = Date.now() - loadStartTime;

    // Check for loading errors and aggregate them (optimized: cleaner functional approach)
    const loadErrors = loadResults
      .map((result, index) =>
        result.status === 'rejected'
          ? `${moduleNames[index]}: ${result.reason?.message || result.reason}`
          : null,
      )
      .filter(Boolean);

    if (loadErrors.length > 0) {
      this.console.error('Module loading failed:');
      loadErrors.forEach((err) => this.console.error(`  - ${err}`));
      throw new Error('Failed to load modules: ' + loadErrors.join('; '));
    }

    // this.console.info(`✓ All modules loaded successfully (${loadDuration}ms)`);

    // Setup sandbox with loaded modules
    Object.assign(this.sandbox, {
      api: api.container,
      lib: lib.tree,
      domain: domain.tree,
      config: config.tree,
      application: this,
      scheduler: this.scheduler,
      // eventBus: this.eventBus,
    });

    // Set config on application
    this.config = config.tree;
    // Initialize Semaphore
    const { Semaphore } = metarhia.metautil;
    const queueConfig = this.config?.server?.queue || {
      concurrency: 1000,
      size: 2000,
      timeout: 3000,
    };
    this.semaphore = new Semaphore(
      queueConfig.concurrency,
      queueConfig.size,
      queueConfig.timeout,
    );
    // this.console.info('✓ Semaphore initialized', {
    //   concurrency: queueConfig.concurrency,
    //   queueSize: queueConfig.size,
    //   timeout: queueConfig.timeout,
    // });

    // Validate configuration using JSON Schema (via common.js)
    // Remove circular references (parent property) before validation
    const common = require('../lib/common.js');
    const configForValidation = common.removeCircularRefs(this.config);
    const { configSchema } = require('../lib/config-schema.js');
    const validation = common.validateSchema(configForValidation, configSchema);

    if (!validation.valid) {
      this.console.error('Configuration validation failed:');
      validation.errors.forEach((err) => this.console.error(`  ✗ ${err}`));
      throw new Error('Invalid configuration');
    }

    // this.console.info('✓ Configuration validated successfully');

    // Additional production environment checks (not in schema)
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production' && this.config?.server?.cors?.allowedOrigins) {
      const hasWildcard = this.config.server.cors.allowedOrigins.some(
        (o) => o === '*' || /\*$/.test(o),
      );
      if (hasWildcard) {
        this.console.warn(
          '⚠️  server.cors.allowedOrigins contains wildcards in production - security risk',
        );
      }
    }

    // Return watchTimeout for potential reconfiguration
    return { watchTimeout };
  }

  /**
   * Graceful shutdown of all application components
   * Stops all services in proper order without process.exit()
   * @param {number} timeout - Shutdown timeout in milliseconds (default: 10000)
   * @returns {Promise<{success: boolean, duration: number, steps: string[], error?: Error}>}
   */
  async shutdown(timeout = 10000) {
    const shutdownStartTime = Date.now();
    const steps = [];
    let shutdownTimer = null;

    // Set shutdown timeout to prevent hanging
    shutdownTimer = setTimeout(() => {
      const elapsed = Date.now() - shutdownStartTime;
      const blockers = [];

      if (this.server?.clients?.size > 0) {
        blockers.push(`${this.server.clients.size} active client(s)`);
      }
      if (this.semaphore && !this.semaphore.empty) {
        blockers.push(
          `${this.semaphore.queue.length} pending request(s) in queue`,
        );
      }

      this.console.error(`Shutdown timeout exceeded after ${elapsed}ms`);
      if (blockers.length > 0) {
        this.console.error('Possible blockers:');
        blockers.forEach((blocker) => this.console.error(`  - ${blocker}`));
      }

      // Timeout will be handled by caller (main.js) with process.exit()
      // Here we just log the error
    }, timeout);

    try {
      // 1. Stop scheduler
      if (this.scheduler?.stopAll) {
        try {
          this.scheduler.stopAll();
          steps.push('Scheduler');
        } catch (error) {
          this.console.error('Failed to stop scheduler:', error);
          steps.push(`Scheduler (error: ${error.message})`);
        }
      }

      // 2. Stop email outbox processor
      if (this.emailOutboxProcessor?.stop) {
        const start = Date.now();
        try {
          await this.emailOutboxProcessor.stop();
          const duration = Date.now() - start;
          steps.push(`Email outbox processor (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to stop email outbox processor:', error);
          steps.push(`Email outbox processor (error: ${error.message})`);
        }
      }

      // 2. Stop notification pipeline
      if (this.notificationPipeline) {
        const start = Date.now();
        try {
          await this.notificationPipeline.stop();
          const duration = Date.now() - start;
          steps.push(`Notification pipeline (${duration}ms)`);
          // this.console.info(`✓ Notification pipeline stopped (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to stop notification pipeline:', error);
          steps.push(`Notification pipeline (error: ${error.message})`);
        }
      }

      // 3. Stop notification queue
      if (this.notificationQueue) {
        try {
          this.notificationQueue.stop();
          steps.push('Notification queue');
          // this.console.info('✓ Notification queue stopped');
        } catch (error) {
          this.console.error('Failed to stop notification queue:', error);
          steps.push(`Notification queue (error: ${error.message})`);
        }
      }

      // 4. Stop accepting new connections (server shutdown)
      if (this.server?.shutdown) {
        const start = Date.now();
        try {
          await this.server.shutdown();
          const duration = Date.now() - start;
          steps.push(`Server (${duration}ms)`);
          // this.console.info(`✓ Server closed (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to stop server:', error);
          steps.push(`Server (error: ${error.message})`);
        }
      }

      // 5. Stop file watcher
      if (this.watcher) {
        const start = Date.now();
        try {
          await this.stopWatch();
          const duration = Date.now() - start;
          steps.push(`Watcher (${duration}ms)`);
          // this.console.info(`✓ File watcher closed (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to stop watcher:', error);
          steps.push(`Watcher (error: ${error.message})`);
        }
      }

      // 6. Close SessionManager (Redis)
      if (this.server?.sessionManager?.close) {
        const start = Date.now();
        try {
          await this.server.sessionManager.close();
          const duration = Date.now() - start;
          steps.push(`Redis (${duration}ms)`);
          // this.console.info(`✓ SessionManager closed (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to close SessionManager:', error);
          steps.push(`Redis (error: ${error.message})`);
        }
      }

      // 7. Close Database connections
      // Note: Database is initialized in application/lib/db/pg/start.js
      // and attached to sandbox.db during application.starts execution
      if (this.sandbox?.db?.optimized?.close) {
        const start = Date.now();
        try {
          await this.sandbox.db.optimized.close();
          const duration = Date.now() - start;
          steps.push(`Database (${duration}ms)`);
          // this.console.info(`✓ Database closed (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to close database:', error);
          steps.push(`Database (error: ${error.message})`);
        }
      }

      // 8. Flush logs
      if (this.console?.close) {
        const start = Date.now();
        try {
          await this.console.close();
          const duration = Date.now() - start;
          steps.push(`Logger (${duration}ms)`);
          // this.console.info(`✓ Logger closed (${duration}ms)`);
        } catch (error) {
          this.console.error('Failed to close logger:', error);
          steps.push(`Logger (error: ${error.message})`);
        }
      }

      // Clear timeout and return success
      clearTimeout(shutdownTimer);
      const totalShutdownTime = Date.now() - shutdownStartTime;
      this.console.info(
        `Graceful shutdown complete (${totalShutdownTime}ms total)`,
      );

      return {
        success: true,
        duration: totalShutdownTime,
        steps,
      };
    } catch (error) {
      clearTimeout(shutdownTimer);
      const elapsed = Date.now() - shutdownStartTime;
      this.console.error(`Error during shutdown after ${elapsed}ms:`, error);

      return {
        success: false,
        duration: elapsed,
        steps,
        error,
      };
    }
  }
}

module.exports = { Application };
