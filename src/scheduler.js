'use strict';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;
const MAX_INTERVAL_MS = 24 * 60 * 60 * 1000;

const nowIso = () => new Date().toISOString();

const normalizeIntervalMs = (value) => {
  const numeric = Number(value || DEFAULT_INTERVAL_MS);
  if (!Number.isFinite(numeric)) return DEFAULT_INTERVAL_MS;
  return Math.max(MIN_INTERVAL_MS, Math.min(numeric, MAX_INTERVAL_MS));
};

class Scheduler {
  constructor({ logger } = {}) {
    this.logger = logger || console;
    this.tasks = new Map();
  }

  add(task) {
    const name = String(task?.name || '').trim();
    if (!name) throw new Error('Scheduler task name is required');
    if (typeof task.handler !== 'function') {
      throw new Error(`Scheduler task handler is required: ${name}`);
    }

    const existing = this.tasks.get(name);
    if (existing?.timer) clearTimeout(existing.timer);

    const intervalMs = normalizeIntervalMs(
      task.intervalMs || Number(task.intervalSeconds || 0) * 1000,
    );
    const record = {
      name,
      title: task.title || name,
      description: task.description || '',
      enabled: task.enabled === true,
      intervalMs,
      handler: task.handler,
      timer: null,
      running: false,
      runCount: existing?.runCount || 0,
      errorCount: existing?.errorCount || 0,
      lastRunAt: existing?.lastRunAt || null,
      lastFinishedAt: existing?.lastFinishedAt || null,
      lastDurationMs: existing?.lastDurationMs || null,
      lastError: existing?.lastError || null,
      lastResult: existing?.lastResult || null,
      nextRunAt: null,
      createdAt: existing?.createdAt || nowIso(),
      updatedAt: nowIso(),
    };

    this.tasks.set(name, record);
    this.#schedule(record);
    return this.#serialize(record);
  }

  list() {
    return Array.from(this.tasks.values()).map((task) =>
      this.#serialize(task),
    );
  }

  get(name) {
    const task = this.tasks.get(String(name || '').trim());
    if (!task) throw new Error('Scheduler task is not registered');
    return task;
  }

  async runNow(name) {
    const task = this.get(name);
    await this.#run(task, 'manual');
    return this.#serialize(task);
  }

  updateSchedule(name, { intervalMs, intervalSeconds, enabled } = {}) {
    const task = this.get(name);
    const nextIntervalMs = intervalMs || Number(intervalSeconds || 0) * 1000;
    if (nextIntervalMs) task.intervalMs = normalizeIntervalMs(nextIntervalMs);
    if (typeof enabled === 'boolean') task.enabled = enabled;
    task.updatedAt = nowIso();
    this.#schedule(task);
    return this.#serialize(task);
  }

  stopTask(name) {
    const task = this.get(name);
    task.enabled = false;
    task.nextRunAt = null;
    task.updatedAt = nowIso();
    if (task.timer) clearTimeout(task.timer);
    task.timer = null;
    return this.#serialize(task);
  }

  stopAll() {
    for (const task of this.tasks.values()) {
      if (task.timer) clearTimeout(task.timer);
      task.timer = null;
      task.nextRunAt = null;
    }
  }

  #schedule(task) {
    if (task.timer) clearTimeout(task.timer);
    task.timer = null;
    task.nextRunAt = null;

    if (!task.enabled) return;

    const nextRun = Date.now() + task.intervalMs;
    task.nextRunAt = new Date(nextRun).toISOString();
    task.timer = setTimeout(async () => {
      task.timer = null;
      await this.#run(task, 'scheduled');
      this.#schedule(task);
    }, task.intervalMs);
    task.timer.unref?.();
  }

  async #run(task, trigger) {
    if (task.running) {
      throw new Error(`Scheduler task is already running: ${task.name}`);
    }

    const started = Date.now();
    task.running = true;
    task.lastRunAt = new Date(started).toISOString();
    task.lastError = null;

    try {
      const result = await task.handler({
        task: this.#serialize(task),
        trigger,
      });
      task.lastResult = result ?? null;
      task.runCount += 1;
    } catch (error) {
      task.errorCount += 1;
      task.lastError = error?.message || String(error);
      this.logger.error?.(
        `[Scheduler] task failed: ${task.name}`,
        error?.stack || error,
      );
      throw error;
    } finally {
      task.running = false;
      task.lastFinishedAt = nowIso();
      task.lastDurationMs = Date.now() - started;
      task.updatedAt = nowIso();
    }
  }

  #serialize(task) {
    return {
      name: task.name,
      title: task.title,
      description: task.description,
      enabled: task.enabled,
      running: task.running,
      intervalMs: task.intervalMs,
      intervalSeconds: Math.round(task.intervalMs / 1000),
      runCount: task.runCount,
      errorCount: task.errorCount,
      lastRunAt: task.lastRunAt,
      lastFinishedAt: task.lastFinishedAt,
      lastDurationMs: task.lastDurationMs,
      lastError: task.lastError,
      lastResult: task.lastResult,
      nextRunAt: task.nextRunAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

module.exports = { Scheduler };
