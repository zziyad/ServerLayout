'use strict';

const { Place } = require('./place.js');
const { loadDir, createRouting } = require('./loader.js');

class Api extends Place {
  constructor(name, application) {
    super(name, application);
    this.container = {};
    this.initialized = false;
    this.reloadTimer = null; // Optimization: debounce timer
    this.reloadDebounce = 200; // ms to wait before reloading
  }

  async load(targetPath = this.path) {
    // Initial load: use loadDir directly
    const { application } = this;
    const api = await loadDir(this.path, application.sandbox, true);
    const routing = createRouting(api);

    application.routing = routing;
    application.sandbox.api = api;
    this.container = api;
    this.initialized = true;
    if (api._loadStats) {
      application.console?.info?.(
        `API loaded: ${api._loadStats.fileCount} files in ${api._loadStats.duration}ms`,
      );
      delete api._loadStats; // Clean up metadata
    }
    if (targetPath === this.path) {
      application.watcher.watch(targetPath);
    }
  }

  async change(filePath) {
    if (!filePath.endsWith('.js')) return;
    if (filePath.startsWith('.eslint')) return;
    if (!this.initialized) return; // Skip during initial load
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    this.reloadTimer = setTimeout(async () => {
      this.reloadTimer = null;
      try {
        await this.reloadApi();
      } catch (err) {
        this.application.console.error('API reload after change failed:', err);
      }
    }, this.reloadDebounce);
  }
  async delete(filePath) {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
    try {
      await this.reloadApi();
    } catch (err) {
      this.application.console.error('API reload after delete failed:', err);
    }
  }
  async reloadApi() {
    const reloadStart = Date.now();
    try {
      const { application } = this;
      const api = await loadDir(this.path, application.sandbox, true);
      const routingStart = Date.now();
      const routing = createRouting(api);
      const routingDuration = Date.now() - routingStart;
      application.routing = routing;
      application.sandbox.api = api;
      this.container = api;
      const totalDuration = Date.now() - reloadStart;
      // const loadDuration = api._loadStats?.duration || 0;
      // if (application.console?.info) {
      //   application.console.info(
      //     `API reloaded: ${api._loadStats?.fileCount || 0} files ` +
      //       `(load: ${loadDuration}ms, routing: ${routingDuration}ms, total: ${totalDuration}ms)`,
      //   );
      // }
      if (api._loadStats) delete api._loadStats;
    } catch (err) {
      const elapsed = Date.now() - reloadStart;
      this.application.console.error(
        `API reload failed after ${elapsed}ms:`,
        err,
      );
      throw err;
    }
  }

  async cleanup() {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
      this.reloadTimer = null;
    }
  }
}

module.exports = { Api };
