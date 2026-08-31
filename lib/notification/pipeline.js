'use strict';

function createNotificationPipeline({
  bus,
  queue,
  dispatcher,
  filter,
  transform,
  processOptions,
  logger,
}) {
  if (!bus || typeof bus.subscribeAll !== 'function')
    throw new TypeError('bus must support subscribeAll');
  if (!queue || typeof queue.enqueue !== 'function')
    throw new TypeError('queue must support enqueue');
  if (!dispatcher || typeof dispatcher.dispatch !== 'function') {
    throw new TypeError('dispatcher must support dispatch');
  }

  const log = logger;

  const transformFn = transform
    ? async (event) => transform(event)
    : async (event) => ({
        id: event.id,
        event,
        channels: [{ type: 'broadcast', payload: event }],
      });

  const filterFn = filter ? (event) => !!filter(event) : () => true;

  const unsubscribe = bus.subscribeAll(async (event) => {
    try {
      if (!filterFn(event)) return;
      if (log.info) {
        log.info('[NotificationPipeline] event received', {
          entity: event?.entity,
          action: event?.action,
          id: event?.id,
        });
      }
      const message = await transformFn(event);
      await queue.enqueue(message);
    } catch (error) {
      log.error('[NotificationPipeline] failed to enqueue notification', error);
    }
  });

  const processor = queue.process(
    async (message) => {
      await dispatcher.dispatch(message);
    },
    {
      ...processOptions,
      onFailed: async (payload, error, item) => {
        log.error('[NotificationPipeline] dropped notification', {
          error,
          item,
        });
      },
    },
  );

  return {
    async stop() {
      unsubscribe();
      await processor.stop();
    },
    stats() {
      return {
        bus: typeof bus.getStats === 'function' ? bus.getStats() : null,
        queue: typeof queue.getStats === 'function' ? queue.getStats() : null,
        dispatcher:
          typeof dispatcher.getStats === 'function'
            ? dispatcher.getStats()
            : null,
      };
    },
  };
}

module.exports = {
  createNotificationPipeline,
};
