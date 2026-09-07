'use strict';

const { node } = require('./dependencies.js');

const PLACES = ['api', 'domain', 'config', 'lib'];

const walkJs = async (dir, acc = []) => {
  let entries;
  try {
    entries = await node.fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = node.path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkJs(full, acc);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) acc.push(full);
  }
  return acc;
};

const stamp = async (filePath) => {
  try {
    const st = await node.fsp.stat(filePath);
    return `${st.mtimeMs}:${st.size}`;
  } catch {
    return null;
  }
};

const startPollWatch = (application, { intervalMs = 1000 } = {}) => {
  const root = application.path;
  const state = new Map();
  let timer = null;
  let running = false;

  const scan = async () => {
    if (running) return;
    running = true;
    try {
      const files = [];
      for (const place of PLACES) {
        await walkJs(node.path.join(root, place), files);
      }
      const seen = new Set();
      for (const filePath of files) {
        seen.add(filePath);
        const next = await stamp(filePath);
        const prev = state.get(filePath);
        if (prev === undefined) {
          state.set(filePath, next);
          continue;
        }
        if (next !== prev) {
          state.set(filePath, next);
          application.watcher?.emit('change', filePath);
        }
      }
      for (const filePath of state.keys()) {
        if (!seen.has(filePath)) {
          state.delete(filePath);
          application.watcher?.emit('delete', filePath);
        }
      }
    } catch (err) {
      application.console?.warn?.('poll-watch:', err.message);
    } finally {
      running = false;
    }
  };

  scan();
  timer = setInterval(scan, intervalMs);
  if (timer.unref) timer.unref();
  application.console?.info?.(
    `File poll watch every ${intervalMs}ms under ${root}`,
  );
  return () => {
    if (timer) clearInterval(timer);
    timer = null;
  };
};

module.exports = { startPollWatch };
