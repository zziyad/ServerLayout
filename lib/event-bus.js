'use strict';

const { Emitter } = require('./event.js');

/**
 * EventBus - Domain Event Publisher/Subscriber
 *
 * Built on top of Emitter, provides structured domain events with entity/action filtering.
 * Designed for real-time broadcasting of CRUD operations across the application.
 *
 * Event Structure:
 * {
 *   entity: string,   // e.g., 'fleet', 'event', 'driver'
 *   action: string,   // e.g., 'created', 'updated', 'deleted'
 *   id: string|number, // Entity ID (required for tracking)
 *   payload: object,  // Changed data (diff or full object)
 *   meta: object      // Optional metadata (userId, timestamp, etc.)
 * }
 *
 * Usage:
 * const bus = createEventBus();
 *
 * // Subscribe to specific entity/action
 * const unsubscribe = bus.subscribe({ entity: 'fleet', action: 'updated' }, (event) => {
 *   console.log('Fleet updated:', event);
 * });
 *
 * // Subscribe to all events from an entity
 * bus.subscribe({ entity: 'fleet' }, (event) => {
 *   console.log('Fleet event:', event);
 * });
 *
 * // Subscribe to all events (wildcard)
 * bus.subscribeAll((event) => {
 *   console.log('Any event:', event);
 * });
 *
 * // Publish an event
 * bus.publish({
 *   entity: 'fleet',
 *   action: 'updated',
 *   id: '123',
 *   payload: { status: 'active' },
 *   meta: { userId: 'user-456', timestamp: Date.now() }
 * });
 *
 * // Unsubscribe
 * unsubscribe();
 */

const MAX_SUBSCRIBERS_WARNING = 1000;
const WILDCARD_ALL = '*';
const WILDCARD_ENTITY = '*';

class EventBus {
  #emitter = null;
  #stats = null;

  constructor(options = {}) {
    // Use Emitter as base with configurable maxListeners
    const maxListeners = options.maxListeners || MAX_SUBSCRIBERS_WARNING;
    this.#emitter = new Emitter({ maxListeners });

    // Stats for monitoring
    this.#stats = {
      published: 0,
      errors: 0,
      lastError: null,
    };
  }

  /**
   * Internal: Make event name from entity and action
   * @private
   */
  #makeEventName(entity, action) {
    if (!entity) return WILDCARD_ALL;
    if (!action) return `${entity}:${WILDCARD_ENTITY}`;
    return `${entity}:${action}`;
  }

  /**
   * Internal: Get all event names for an entity/action combination
   * @private
   */
  #getEventNames(entity, action) {
    const names = [];
    // 1. Exact match: entity:action
    if (entity && action) {
      names.push(this.#makeEventName(entity, action));
    }
    // 2. Entity wildcard: entity:*
    if (entity) {
      names.push(this.#makeEventName(entity, null));
    }
    // 3. Global wildcard: *
    names.push(WILDCARD_ALL);
    return names;
  }

  /**
   * Subscribe to specific entity/action events
   * @param {Object} filter - { entity: string, action?: string }
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  subscribe(filter, handler) {
    if (!filter || typeof filter !== 'object') {
      throw new Error('EventBus.subscribe: filter must be an object');
    }
    if (typeof handler !== 'function') {
      throw new Error('EventBus.subscribe: handler must be a function');
    }
    if (!filter.entity || typeof filter.entity !== 'string') {
      throw new Error(
        'EventBus.subscribe: filter.entity is required and must be a string',
      );
    }

    const eventName = this.#makeEventName(filter.entity, filter.action);

    // Subscribe to specific event
    this.#emitter.on(eventName, handler);

    // Warn if too many subscribers (possible memory leak)
    const count = this.#emitter.listenerCount(eventName);
    if (count > MAX_SUBSCRIBERS_WARNING) {
      console.warn(
        `[EventBus] Warning: ${count} subscribers for ${eventName}. Possible memory leak?`,
      );
    }

    // Return unsubscribe function
    return () => {
      this.#emitter.off(eventName, handler);
    };
  }

  /**
   * Subscribe to all events (wildcard)
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  subscribeAll(handler) {
    if (typeof handler !== 'function') {
      throw new Error('EventBus.subscribeAll: handler must be a function');
    }

    // Subscribe to global wildcard
    this.#emitter.on(WILDCARD_ALL, handler);

    // Warn if too many wildcard subscribers
    const count = this.#emitter.listenerCount(WILDCARD_ALL);
    if (count > MAX_SUBSCRIBERS_WARNING / 10) {
      console.warn(
        `[EventBus] Warning: ${count} wildcard subscribers. Consider using specific subscriptions.`,
      );
    }

    // Return unsubscribe function
    return () => {
      this.#emitter.off(WILDCARD_ALL, handler);
    };
  }

  /**
   * Subscribe to a single event (auto-unsubscribe after first call)
   * @param {Object} filter - { entity: string, action?: string }
   * @param {Function} handler - Event handler function
   * @returns {Function} Unsubscribe function
   */
  once(filter, handler) {
    if (!filter || typeof filter !== 'object') {
      throw new Error('EventBus.once: filter must be an object');
    }
    if (typeof handler !== 'function') {
      throw new Error('EventBus.once: handler must be a function');
    }
    if (!filter.entity || typeof filter.entity !== 'string') {
      throw new Error(
        'EventBus.once: filter.entity is required and must be a string',
      );
    }

    const eventName = this.#makeEventName(filter.entity, filter.action);

    // Use Emitter's once method
    this.#emitter.once(eventName, handler);

    // Return unsubscribe function (for consistency, even though once auto-unsubscribes)
    return () => {
      this.#emitter.off(eventName, handler);
    };
  }

  /**
   * Publish an event to all subscribers (fire-and-forget)
   * Note: This is synchronous, but handlers are executed asynchronously by Emitter
   * Errors in handlers are logged but don't affect the return value
   * @param {Object} event - Event object
   * @returns {Object} Result with handlersInvoked count (errors handled asynchronously)
   */
  publish(event) {
    // Validate event structure
    if (!event || typeof event !== 'object') {
      throw new Error('EventBus.publish: event must be an object');
    }
    if (!event.entity || typeof event.entity !== 'string') {
      throw new Error(
        'EventBus.publish: event.entity is required and must be a string',
      );
    }
    if (!event.action || typeof event.action !== 'string') {
      throw new Error(
        'EventBus.publish: event.action is required and must be a string',
      );
    }
    if (event.id === undefined || event.id === null || event.id === '') {
      throw new Error('EventBus.publish: event.id is required');
    }
    if (
      event.payload !== undefined &&
      (typeof event.payload !== 'object' || event.payload === null)
    ) {
      throw new Error(
        'EventBus.publish: event.payload must be an object if provided',
      );
    }

    this.#stats.published++;

    // Normalize event (add timestamp if not present)
    const normalizedEvent = {
      ...event,
      meta: {
        timestamp: Date.now(),
        ...(event.meta || {}),
      },
    };

    // Get all event names that should receive this event
    const eventNames = this.#getEventNames(event.entity, event.action);

    // Count handlers (synchronous)
    let handlersInvoked = 0;
    for (const eventName of eventNames) {
      handlersInvoked += this.#emitter.listenerCount(eventName);
    }

    // Emit to all matching event names (fire-and-forget)
    for (const eventName of eventNames) {
      this.#emitter.emit(eventName, normalizedEvent).catch((error) => {
        this.#stats.errors++;
        this.#stats.lastError = error;
        console.error(
          `[EventBus] Handler error for ${event.entity}/${event.action} on ${eventName}:`,
          error,
        );
      });
    }

    return {
      handlersInvoked,
    };
  }

  /**
   * Publish an event synchronously (wait for all handlers to complete)
   * @param {Object} event - Event object
   * @returns {Promise<Object>} Result with handlersInvoked and errors count
   */
  async publishAsync(event) {
    // Validate event structure
    if (!event || typeof event !== 'object') {
      throw new Error('EventBus.publishAsync: event must be an object');
    }
    if (!event.entity || typeof event.entity !== 'string') {
      throw new Error(
        'EventBus.publishAsync: event.entity is required and must be a string',
      );
    }
    if (!event.action || typeof event.action !== 'string') {
      throw new Error(
        'EventBus.publishAsync: event.action is required and must be a string',
      );
    }
    if (event.id === undefined || event.id === null || event.id === '') {
      throw new Error('EventBus.publishAsync: event.id is required');
    }
    if (
      event.payload !== undefined &&
      (typeof event.payload !== 'object' || event.payload === null)
    ) {
      throw new Error(
        'EventBus.publishAsync: event.payload must be an object if provided',
      );
    }

    this.#stats.published++;

    // Normalize event (add timestamp if not present)
    const normalizedEvent = {
      ...event,
      meta: {
        timestamp: Date.now(),
        ...(event.meta || {}),
      },
    };

    // Get all event names that should receive this event
    const eventNames = this.#getEventNames(event.entity, event.action);

    // Track errors and handlers
    let errorCount = 0;
    let handlersInvoked = 0;
    const errors = [];

    // Emit to all matching event names and wait for completion
    for (const eventName of eventNames) {
      try {
        const listenerCount = this.#emitter.listenerCount(eventName);
        if (listenerCount > 0) {
          handlersInvoked += listenerCount;

          // Wait for handlers to complete
          try {
            await this.#emitter.emit(eventName, normalizedEvent);
          } catch (error) {
            errorCount++;
            errors.push(error);
            this.#stats.errors++;
            this.#stats.lastError = error;
            console.error(
              `[EventBus] Handler error for ${event.entity}/${event.action} on ${eventName}:`,
              error,
            );
          }
        }
      } catch (error) {
        errorCount++;
        errors.push(error);
        this.#stats.errors++;
        this.#stats.lastError = error;
        console.error(
          `[EventBus] Publish error for ${event.entity}/${event.action} on ${eventName}:`,
          error,
        );
      }
    }

    return {
      handlersInvoked,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get current statistics
   * @returns {Object} Stats object
   */
  getStats() {
    // Count all subscribers
    const eventNames = this.#emitter.eventNames();
    let subscriberCount = 0;
    for (const eventName of eventNames) {
      subscriberCount += this.#emitter.listenerCount(eventName);
    }

    return {
      ...this.#stats,
      subscriberCount,
      wildcardCount: this.#emitter.listenerCount(WILDCARD_ALL),
      eventNames: eventNames.length,
    };
  }

  /**
   * Clear all subscribers (useful for testing)
   */
  clear() {
    this.#emitter.clear();
    this.#stats.published = 0;
    this.#stats.errors = 0;
    this.#stats.lastError = null;
  }

  /**
   * Clear subscribers for a specific event
   * @param {string} entity - Entity name
   * @param {string} [action] - Optional action name
   */
  clearEvent(entity, action) {
    if (!entity) {
      this.clear();
      return;
    }
    const eventName = this.#makeEventName(entity, action);
    this.#emitter.clear(eventName);
  }

  /**
   * Get listener count for a specific event
   * @param {string} entity - Entity name
   * @param {string} [action] - Optional action name
   * @returns {number} Listener count
   */
  listenerCount(entity, action) {
    if (!entity) {
      return this.#emitter.listenerCount(WILDCARD_ALL);
    }
    const eventName = this.#makeEventName(entity, action);
    return this.#emitter.listenerCount(eventName);
  }

  /**
   * Get all event names
   * @returns {string[]} Array of event names
   */
  eventNames() {
    return this.#emitter.eventNames();
  }

  /**
   * Get listeners for a specific event
   * @param {string} entity - Entity name
   * @param {string} [action] - Optional action name
   * @returns {Function[]} Array of listener functions
   */
  listeners(entity, action) {
    if (!entity) {
      return this.#emitter.listeners(WILDCARD_ALL);
    }
    const eventName = this.#makeEventName(entity, action);
    return this.#emitter.listeners(eventName);
  }
}

/**
 * Create a new EventBus instance
 * @param {Object} [options] - Options
 * @param {number} [options.maxListeners] - Maximum listeners per event (default: 1000)
 * @returns {EventBus}
 */
function createEventBus(options = {}) {
  return new EventBus(options);
}

module.exports = {
  EventBus,
  createEventBus,
};
