'use strict';

const { metarhia } = require('./dependencies.js');
const { Place } = require('./place.js');
// const bus = require('./bus.js');

class Code extends Place {
  constructor(name, application) {
    super(name, application);
    this.tree = {};
  }

  async stop() {
    for (const moduleName of Object.keys(this.tree)) {
      const module = this.tree[moduleName];
      if (typeof module.stop === 'function') {
        await this.application.execute(module.stop);
      }
    }
  }

  stopModule(name, module) {
    const timeout = this.application.config.server.timeouts.watch;
    setTimeout(() => {
      if (this.tree[name] !== undefined) return;
      this.application.execute(module.stop);
    }, timeout);
  }

  set(relPath, unit) {
    const names = metarhia.metautil.parsePath(relPath);

    const last = names.length - 1;
    let level = this.tree;
    for (let depth = 0; depth <= last; depth++) {
      const name = names[depth];
      let next = level[name];
      if (depth === last) {
        if (unit === null) {
          if (name === 'stop') this.stopModule(names[0], level);
          delete level[name];
          return;
        }
        next = unit;
        unit.parent = level;
      }
      if (next === undefined) next = { parent: level };
      level[name] = next;
      if (name === 'start' && depth === last) {
        if (unit.constructor.name === 'AsyncFunction') {
          this.application.starts.push(unit);
        } else {
          const msg = `${relPath} expected to be async function`;
          this.application.console.error(msg);
        }
      }
      level = next;
    }
  }

  delete(filePath) {
    const relPath = filePath.substring(this.path.length + 1);
    this.set(relPath, null);
  }

  // Optimization: performance metrics for module changes
  async change(filePath) {
    if (!filePath.endsWith('.js')) return;
    if (filePath.startsWith('.eslint')) return;

    const { application, path } = this;
    const relPath = filePath.substring(path.length + 1);
    const startTime = Date.now();
    const options = { context: application.sandbox, filename: filePath };

    try {
      const { exports } = await metarhia.metavm.readScript(filePath, options);
      this.set(relPath, exports);

      // const duration = Date.now() - startTime;
      // if (application.console?.debug && duration > 50) {
      //   // Only log if reload takes more than 50ms
      //   application.console.debug(`Reloaded /${relPath} (${duration}ms)`);
      // }
    } catch (error) {
      const duration = Date.now() - startTime;
      if (error.code !== 'ENOENT') {
        application.console.error(
          `Failed to reload /${relPath} after ${duration}ms:`,
          error.stack,
        );
      }
    }
  }
}

module.exports = { Code };
