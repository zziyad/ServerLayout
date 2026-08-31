'use strict';

const { node, npm, metarhia } = require('./src/dependencies.js');
const console = require('./lib/logger.js');
const common = require('./lib/common.js');
const { Server } = require('./src/server.js');
const { Application } = require('./src/application.js');
const { Scheduler } = require('./src/scheduler.js');
const { createEventBus } = require('./lib/event-bus.js');
const { NotificationQueue } = require('./lib/notification/queue.js');
const { NotificationDispatcher } = require('./lib/notification/dispatcher.js');
const {
  createNotificationPipeline,
} = require('./lib/notification/pipeline.js');
const {
  NotificationManager,
} = require('./lib/notification/notification-manager.js');
const {
  createEmailOutboxProcessor,
} = require('./lib/notification/email-outbox-processor.js');

const STARTUP_TIMEOUT = 15000; // 15 seconds
const SHUTDOWN_TIMEOUT = 10000; // 10 seconds
const CTRL_C = 3;

let application = null;
const sandbox = node.vm.createContext({
  console,
  common,
  npm,
  node,
  metarhia,
  db: {},
});

const gracefulShutdown = async (signal) => {
  console.info(`Graceful shutdown initiated by ${signal}`);

  if (!application) {
    console.error('Application not initialized, exiting immediately');
    process.exit(1);
  }

  try {
    const result = await application.shutdown(SHUTDOWN_TIMEOUT);

    if (!result.success) {
      console.error(
        'Shutdown failed:',
        result.error?.message || 'Unknown error',
      );
      if (result.error?.stack) {
        console.error(result.error.stack);
      }
      process.exit(1);
    } else {
      console.info(`Graceful shutdown complete (${result.duration}ms total)`);
      if (result.steps.length > 0) {
        console.info('Shutdown steps:', result.steps.join(', '));
      }
      process.exit(0);
    }
  } catch (error) {
    console.error('Unexpected error during shutdown:', error);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
};

const logError = (type) => async (error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const msg = err.stack || err.message || 'Unknown error';

  console.error(`${type}: ${msg}`);

  // If error during initialization or runtime, shutdown gracefully
  if (type === 'uncaughtException' || type === 'unhandledRejection') {
    await gracefulShutdown(type);
  }
};

process.removeAllListeners('warning');
process.removeAllListeners('uncaughtException');
process.removeAllListeners('unhandledRejection');

process.on('warning', (warning) => {
  if (warning.name !== 'ExperimentalWarning') {
    console.error('Warning:', warning.message);
  }
});

process.on('uncaughtException', logError('uncaughtException'));
process.on('unhandledRejection', logError('unhandledRejection'));

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

if (process.stdin.isTTY) {
  process.stdin.setRawMode(true);
  process.stdin.on('data', (data) => {
    if (data[0] === CTRL_C) {
      gracefulShutdown('Ctrl+C');
    }
  });
}

(async () => {
  const startupTimer = setTimeout(() => {
    console.error('Application startup timeout exceeded (15s)');
    console.error('Possible causes:');
    console.error('  - Database connection failed');
    console.error('  - Redis connection failed');
    console.error('  - Config loading stuck');
    console.error('  - Network connectivity issues');
    process.exit(1);
  }, STARTUP_TIMEOUT);

  try {
    //const appStartTime = Date.now();
    // console.info('Starting application...');
    // console.info(`Node version: ${process.version}`);
    // console.info(`Platform: ${process.platform}`);
    // console.info(`Working directory: ${process.cwd()}`);

    const applications = await node.fsp.readFile('.applications', 'utf8');
    const appPath = node.path.join(process.cwd(), applications.trim());

    application = new Application({ path: appPath, sandbox, console });
    application.eventBus = createEventBus();
    application.scheduler = new Scheduler({ logger: console });
    sandbox.scheduler = application.scheduler;
    application.scheduler.add({
      name: 'system.scheduler.heartbeat',
      title: 'Scheduler heartbeat',
      description: 'Disabled demo task for validating scheduler controls.',
      intervalSeconds: 300,
      enabled: false,
      handler: async () => ({ ok: true, at: new Date().toISOString() }),
    });
    // sandbox.eventBus = application.eventBus;

    // Initialize modules (Code, Api, Static) and load them
    // Also initializes Semaphore and validates configuration
    const { watchTimeout } = await application.initializeModules();

    const realtimeConfig = application.config?.realtime || {};
    const queueOptions = {
      maxSize: realtimeConfig.queue?.maxSize,
      maxAttempts: realtimeConfig.queue?.maxAttempts,
      baseDelayMs: realtimeConfig.queue?.baseDelayMs,
      maxDelayMs: realtimeConfig.queue?.maxDelayMs,
      logger: console,
    };
    application.notificationQueue = new NotificationQueue(queueOptions);
    application.notificationDispatcher = new NotificationDispatcher({
      logger: console,
    });

    // Reconfigure watcher timeout if needed
    // (optimization: implement proper reconfiguration)
    const configuredTimeout = application.config?.server?.timeouts?.watch;
    if (configuredTimeout && configuredTimeout !== watchTimeout) {
      // console.info(
      //   `Reconfiguring file watcher (debounce: ${configuredTimeout}ms)`,
      // );
      await application.stopWatch();
      application.startWatch(configuredTimeout);
    }

    application.server = new Server(application);

    const dispatcher = application.notificationDispatcher;

    // Initialize NotificationManager for Email/SMS/Push
    let notificationManager = null;
    try {
      const notificationConfig = application.config?.notifications || {};
      notificationManager = new NotificationManager(
        notificationConfig,
        console,
      );
      await notificationManager.initialize();
      application.notificationManager = notificationManager;
    } catch (error) {
      console.error('Failed to initialize NotificationManager:', error);
    }

    // Register broadcast channel for real-time updates
    try {
      dispatcher.registerChannel('broadcast', async ({ event, target }) => {
        const server = application.server;
        if (!server || typeof server.broadcast !== 'function') {
          console.error(
            '[NotificationDispatcher] server.broadcast unavailable',
          );
          return;
        }
        const message = target?.payload ?? event;
        if (!message?.entity || !message?.action) return;
        const name = `${message.entity}/${message.action}`;

        // Shuttle-trip events should be public (for dispatcher portal)
        // Other events require authentication
        const isPublicEvent = message.entity === 'shuttle-trip';
        const { delivered, skipped } = server.broadcast(name, message, {
          authenticatedOnly: !isPublicEvent,
        });
        console.info(
          '[NotificationDispatcher] broadcast',
          name,
          message?.id,
          'delivered:',
          delivered,
          'skipped:',
          skipped,
        );
      });
    } catch (error) {
      console.error(
        'Failed to register broadcast notification channel:',
        error,
      );
    }

    try {
      application.notificationPipeline = createNotificationPipeline({
        bus: application.eventBus,
        queue: application.notificationQueue,
        dispatcher,
        logger: console,
      });
      // console.info('✓ Notification pipeline initialized');
    } catch (error) {
      console.error('Failed to initialize notification pipeline:', error);
    }

    await application.static.load();
    application.starts.map(common.execute);
    application.starts = [];

    try {
      application.emailOutboxProcessor = createEmailOutboxProcessor({
        sandbox,
        logger: console,
      });
      application.emailOutboxProcessor.start();
      console.info('[EmailOutboxProcessor] initialized');
    } catch (error) {
      console.error('Failed to initialize email outbox processor:', error);
    }

    // // Add database pool metrics to monitoring
    // if (sandbox.db?.optimized) {
    //   setInterval(() => {
    //     const poolHealth = sandbox.db.optimized.pool.getHealthStatus();
    //     if (poolHealth) {
    //       console.system('Database Pool Metrics', {
    //         poolSize: poolHealth.poolSize || 0,
    //         activeConnections: poolHealth.activeConnections || 0,
    //         idleConnections: poolHealth.idleConnections || 0,
    //         waitingClients: poolHealth.waitingClients || 0,
    //         queryCount: poolHealth.metrics?.queryCount || 0,
    //         avgQueryTime: poolHealth.metrics?.averageQueryTime?.
    //         toFixed(2) ||'0.00',
    //         slowQueries: poolHealth.metrics?.slowQueries || 0,
    //       });
    //     }
    //   }, 30000); // Every 30 seconds
    // }

    // Clear startup timeout
    clearTimeout(startupTimer);
    // const totalStartupTime = Date.now() - appStartTime;
    // console.info(
    //   `✓ Application started successfully (total: ${totalStartupTime}ms)`,
    // );
  } catch (error) {
    clearTimeout(startupTimer);
    console.error('Application initialization failed:', error);
    await gracefulShutdown('initialization-error');
  }
})();
