'use strict';

const { randomUUID } = require('node:crypto');
const loger = require('../logger');

const DEFAULT_MAX_SIZE = 10_000;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 30_000;

class NotificationQueue {
  constructor(options = {}) {
    this.maxSize = options.maxSize ?? DEFAULT_MAX_SIZE;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;
    this.logger = loger;

    this._queue = [];
    this._waiting = [];
    this._spaceWaiters = [];
    this._timers = new Set();
    this._stopped = false;

    this._metrics = {
      enqueued: 0,
      processed: 0,
      retried: 0,
      dropped: 0,
      inFlight: 0,
    };
  }

  async enqueue(payload, opts = {}) {
    if (this._stopped) throw new Error('NotificationQueue stopped');

    const item = {
      id: opts.id ?? randomUUID(),
      payload,
      attempt: opts.attempt ?? 0,
      enqueuedAt: Date.now(),
    };

    if (this.maxSize > 0 && this._queue.length >= this.maxSize) {
      await this._waitForSpace(opts.signal);
    }

    this._queue.push(item);
    this._metrics.enqueued++;
    this._flushWaiting();
    return item.id;
  }

  process(handler, options = {}) {
    if (typeof handler !== 'function')
      throw new TypeError('handler must be a function');
    if (this._stopped) throw new Error('NotificationQueue stopped');

    const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
    const controller = new AbortController();
    const externalSignal = options.signal;

    if (externalSignal) {
      if (externalSignal.aborted) controller.abort(externalSignal.reason);
      else
        externalSignal.addEventListener(
          'abort',
          () => controller.abort(externalSignal.reason),
          { once: true },
        );
    }

    const workers = Array.from({ length: Math.max(1, concurrency) }, () =>
      this._workerLoop(handler, controller.signal, options.onFailed),
    );

    return {
      stop: async () => {
        controller.abort(new Error('NotificationQueue processing stopped'));
        this._rejectWaiters();
        await Promise.allSettled(workers);
      },
    };
  }

  stop() {
    if (this._stopped) return;
    this._stopped = true;
    this._rejectWaiters(new Error('NotificationQueue stopped'));
    for (const timer of this._timers) clearTimeout(timer);
    this._timers.clear();
    this._queue.length = 0;
  }

  getStats() {
    return {
      ...this._metrics,
      queueSize: this._queue.length,
      waitingConsumers: this._waiting.length,
      waitingProducers: this._spaceWaiters.length,
      timers: this._timers.size,
    };
  }

  async _workerLoop(handler, signal, onFailed) {
    while (!signal.aborted) {
      const item = await this._dequeue(signal);
      if (!item) break;

      this._metrics.inFlight++;
      try {
        await handler(item.payload, {
          id: item.id,
          attempt: item.attempt,
          enqueuedAt: item.enqueuedAt,
        });
        this._metrics.processed++;
        this._metrics.inFlight--;
        this._resolveSpace();
      } catch (error) {
        this._metrics.inFlight--;
        this._handleFailure(item, error, onFailed);
      }
    }
  }

  async _handleFailure(item, error, onFailed) {
    if (item.attempt + 1 >= this.maxAttempts) {
      this._metrics.dropped++;
      if (typeof onFailed === 'function') {
        try {
          await onFailed(item.payload, error, item);
        } catch (notifyErr) {
          this.logger.error(
            '[NotificationQueue] onFailed handler error',
            notifyErr,
          );
        }
      }
      this._resolveSpace();
      return;
    }

    this._metrics.retried++;
    const nextAttempt = item.attempt + 1;
    const delayMs = Math.min(
      this.baseDelayMs * 2 ** item.attempt,
      this.maxDelayMs,
    );

    const timer = setTimeout(() => {
      this._timers.delete(timer);
      if (this._stopped) return;
      this._queue.unshift({ ...item, attempt: nextAttempt });
      this._flushWaiting();
    }, delayMs);
    timer.unref?.();

    this._timers.add(timer);
    this.logger.warn(
      `[NotificationQueue] handler failed (attempt ${nextAttempt}/${this.maxAttempts})`,
      error,
    );
  }

  async _dequeue(signal) {
    if (this._queue.length > 0) {
      return this._queue.shift();
    }

    if (this._stopped) return null;

    return new Promise((resolve) => {
      const entry = { resolve };
      if (signal) {
        const onAbort = () => {
          signal.removeEventListener('abort', onAbort);
          entry.aborted = true;
          this._waiting = this._waiting.filter((e) => e !== entry);
          resolve(null);
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        entry.cleanup = () => signal.removeEventListener('abort', onAbort);
      }
      this._waiting.push(entry);
    });
  }

  _waitForSpace(signal) {
    return new Promise((resolve, reject) => {
      const entry = { resolve, reject };
      if (signal) {
        const onAbort = () => {
          signal.removeEventListener('abort', onAbort);
          this._spaceWaiters = this._spaceWaiters.filter((e) => e !== entry);
          reject(signal.reason ?? new Error('enqueue aborted'));
        };
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
        entry.cleanup = () => signal.removeEventListener('abort', onAbort);
      }
      this._spaceWaiters.push(entry);
    });
  }

  _flushWaiting() {
    while (this._queue.length > 0 && this._waiting.length > 0) {
      const item = this._queue.shift();
      const waiter = this._waiting.shift();
      if (waiter.cleanup) waiter.cleanup();
      if (!waiter.aborted) waiter.resolve(item);
    }
  }

  _resolveSpace() {
    if (this._spaceWaiters.length === 0) return;
    if (this.maxSize > 0 && this._queue.length >= this.maxSize) return;

    const waiter = this._spaceWaiters.shift();
    if (waiter.cleanup) waiter.cleanup();
    waiter.resolve();
  }

  _rejectWaiters(error = new Error('NotificationQueue stopped')) {
    for (const waiter of this._waiting.splice(0)) {
      if (waiter.cleanup) waiter.cleanup();
      waiter.resolve(null);
    }
    for (const waiter of this._spaceWaiters.splice(0)) {
      if (waiter.cleanup) waiter.cleanup();
      waiter.reject?.(error);
    }
  }
}

module.exports = {
  NotificationQueue,
};
