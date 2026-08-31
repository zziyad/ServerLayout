'use strict';

const fs = require('node:fs');
const util = require('node:util');
const path = require('node:path');

const COLORS = {
  info: '\x1b[1;37m',
  debug: '\x1b[1;33m',
  warn: '\x1b[1;33m',
  error: '\x1b[0;31m',
  system: '\x1b[1;34m',
  access: '\x1b[1;38m',
  security: '\x1b[1;35m',
};

const DATETIME_LENGTH = 19;

class Logger {
  constructor(logPath) {
    this.path = logPath;
    // Use a private WeakMap to store mutable state (avoids issues with Object.freeze)
    this._state = {
      stream: null,
      streamError: false,
    };
    this.regexp = new RegExp(path.dirname(this.path), 'g');
    this._initializeStream();
  }

  _initializeStream() {
    // Don't create stream immediately - wait until first write
    // This allows entrypoint script to fix permissions first
    this._state.stream = null;
    this._state.streamError = false;
  }

  _ensureStream() {
    // Lazy initialization - only create stream when needed
    if (this._state.stream && !this._state.streamError) {
      return this._state.stream;
    }

    if (this._state.streamError) {
      return process.stderr;
    }

    // Ensure log directory exists before creating file
    try {
      if (!fs.existsSync(this.path)) {
        fs.mkdirSync(this.path, { recursive: true, mode: 0o755 });
      }

      // Check if we can write to the directory
      try {
        fs.accessSync(this.path, fs.constants.W_OK);
      } catch (accessErr) {
        process.stderr.write(
          `Warning: No write permission for log directory ${this.path}: ${accessErr.message}\n`,
        );
        this._state.streamError = true;
        this._state.stream = process.stderr;
        return process.stderr;
      }
    } catch (err) {
      // If we can't create directory, fall back to stderr
      process.stderr.write(
        `Warning: Could not create log directory ${this.path}: ${err.message}\n`,
      );
      this._state.streamError = true;
      this._state.stream = process.stderr;
      return process.stderr;
    }

    const date = new Date().toISOString().substring(0, 10);
    const filePath = path.join(this.path, `${date}.log`);

    // Try to create write stream, but handle errors gracefully
    try {
      this._state.stream = fs.createWriteStream(filePath, { flags: 'a' });

      // Handle async errors from the stream
      this._state.stream.on('error', (err) => {
        if (!this._state.streamError) {
          this._state.streamError = true;
          process.stderr.write(
            `Error: Log file stream error for ${filePath}: ${err.message}\n`,
          );
          // Don't crash - just mark that we should use stderr
          this._state.stream = process.stderr;
        }
      });

      return this._state.stream;
    } catch (err) {
      // If we can't create the file, write to stderr instead
      process.stderr.write(
        `Error: Could not create log file ${filePath}: ${err.message}\n`,
      );
      this._state.streamError = true;
      this._state.stream = process.stderr;
      return process.stderr;
    }
  }

  _getStream() {
    // Lazy initialization - create stream on first use
    return this._ensureStream();
  }

  close() {
    return new Promise((resolve) => {
      const stream = this._getStream();
      if (stream !== process.stderr && stream.end) {
        stream.end(resolve);
      } else {
        resolve();
      }
    });
  }

  write(type = 'info', s) {
    const now = new Date().toISOString();
    const date = now.substring(0, DATETIME_LENGTH);
    const color = COLORS[type];
    const line = date + '\t' + s;
    if (process.env.NODE_ENV !== 'production') {
      console.log(color + line + '\x1b[0m');
    }
    const out = line.replace(/[\n\r]\s*/g, '; ') + '\n';
    try {
      const stream = this._getStream();
      stream.write(out);
    } catch (err) {
      // Fallback to stderr if write fails
      process.stderr.write(`[Logger Error] ${out}`);
    }
  }

  log(...args) {
    const msg = util.format(...args);
    this.write('info', msg);
  }

  dir(...args) {
    const msg = util.inspect(...args);
    this.write('info', msg);
  }

  debug(...args) {
    const msg = util.format(...args);
    this.write('debug', msg);
  }

  info(...args) {
    const msg = util.format(...args);
    this.write('info', msg);
  }

  warn(...args) {
    const msg = util.format(...args);
    this.write('warn', msg);
  }

  error(...args) {
    const msg = util.format(...args).replace(/[\n\r]{2,}/g, '\n');
    this.write('error', msg.replaceAll(path.dirname(this.path), ''));
  }

  system(...args) {
    const msg = util.format(...args);
    this.write('system', msg);
  }

  access(...args) {
    const msg = util.format(...args);
    this.write('access', msg);
  }

  security(message, meta = {}) {
    try {
      const json = JSON.stringify({ message, ...meta });
      this.write('security', json);
    } catch {
      this.write('security', String(message));
    }
  }
}

// Safely instantiate logger - if it fails, create a fallback that writes to stderr
let loggerInstance;
try {
  loggerInstance = new Logger('./log');
} catch (err) {
  // If logger creation fails, create a minimal fallback logger
  process.stderr.write(`Critical: Failed to create logger: ${err.message}\n`);
  loggerInstance = {
    log: (...args) => process.stderr.write(`[LOG] ${util.format(...args)}\n`),
    info: (...args) => process.stderr.write(`[INFO] ${util.format(...args)}\n`),
    warn: (...args) => process.stderr.write(`[WARN] ${util.format(...args)}\n`),
    error: (...args) =>
      process.stderr.write(`[ERROR] ${util.format(...args)}\n`),
    debug: (...args) =>
      process.stderr.write(`[DEBUG] ${util.format(...args)}\n`),
    dir: (...args) => process.stderr.write(`[DIR] ${util.inspect(...args)}\n`),
    system: (...args) =>
      process.stderr.write(`[SYSTEM] ${util.format(...args)}\n`),
    access: (...args) =>
      process.stderr.write(`[ACCESS] ${util.format(...args)}\n`),
    security: (msg, meta) =>
      process.stderr.write(`[SECURITY] ${JSON.stringify({ msg, ...meta })}\n`),
    close: () => Promise.resolve(),
  };
}

module.exports = Object.freeze(loggerInstance);
