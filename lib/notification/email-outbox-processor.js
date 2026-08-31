'use strict';

const DEFAULT_INTERVAL_SECONDS = 60;
const MIN_INTERVAL_SECONDS = 10;

function clampNumber(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function createEmailOutboxProcessor({ sandbox, logger }) {
  let timer = null;
  let stopped = false;
  let running = false;
  let lastIntervalSeconds = DEFAULT_INTERVAL_SECONDS;

  const log = logger || console;

  const schedule = (seconds = lastIntervalSeconds) => {
    if (stopped) return;
    lastIntervalSeconds = clampNumber(
      seconds,
      DEFAULT_INTERVAL_SECONDS,
      MIN_INTERVAL_SECONDS,
      3600,
    );
    timer = setTimeout(tick, lastIntervalSeconds * 1000);
    timer.unref?.();
  };

  const tick = async () => {
    if (stopped) return;
    if (running) {
      schedule(lastIntervalSeconds);
      return;
    }

    running = true;
    try {
      const settings = await sandbox.lib.notification.emailSettingsConfig.publicStatus();
      const intervalSeconds = clampNumber(
        settings.autoProcessIntervalSeconds,
        DEFAULT_INTERVAL_SECONDS,
        MIN_INTERVAL_SECONDS,
        3600,
      );
      lastIntervalSeconds = intervalSeconds;

      if (settings.enabled && settings.autoProcessEnabled && settings.deliveryMode !== 'disabled') {
        const limit = clampNumber(settings.autoProcessBatchLimit, 10, 1, 100);

        if (sandbox.domain?.gatePass?.security?.processOverdueReturnNotifications) {
          try {
            const reminderRes = await sandbox.domain.gatePass.security.processOverdueReturnNotifications({ limit });
            if (reminderRes.queued_emails > 0) {
              log.info?.('[EmailOutboxProcessor] queued', reminderRes.queued_emails, 'overdue return reminder email(s)');
            }
          } catch (error) {
            log.error?.('[EmailOutboxProcessor] overdue reminder scan failed:', error);
          }
        }

        const res = await sandbox.domain.notification.processEmailOutbox({ limit });
        if (res.processed > 0) {
          log.info?.('[EmailOutboxProcessor] processed', res.processed, 'email(s)');
        }
      }
    } catch (error) {
      log.error?.('[EmailOutboxProcessor] tick failed:', error);
    } finally {
      running = false;
      schedule(lastIntervalSeconds);
    }
  };

  const start = () => {
    if (timer || stopped) return;
    schedule(1);
  };

  const stop = async () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return { start, stop };
}

module.exports = { createEmailOutboxProcessor };
