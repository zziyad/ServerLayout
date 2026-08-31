'use strict';

const { node } = require('./dependencies.js');
const OPTIONS = { timeout: 5000, displayErrors: false };

const load = async (filePath, sandbox, contextualize = false) => {
  const src = await node.fsp.readFile(filePath, 'utf8');
  const opening = contextualize ? '(context) => ' : '';
  const code = `'use strict';\n${opening}${src}`;
  const script = new node.vm.Script(code, { ...OPTIONS, lineOffset: -1 });
  const exports = script.runInContext(sandbox, OPTIONS);
  return exports;
};

const loadDir = async (dir, sandbox, contextualize = false, _isRoot = true) => {
  const startTime = _isRoot ? Date.now() : null;
  const files = await node.fsp.readdir(dir, { withFileTypes: true });
  const container = {};
  const loadOperations = [];
  const fileKeys = [];
  for (const file of files) {
    const { name } = file;
    if (file.isFile() && !name.endsWith('.js')) continue;
    const location = node.path.join(dir, name);
    const key = node.path.basename(name, '.js');
    const loader = file.isFile()
      ? load
      : (loc, sb, ctx) => loadDir(loc, sb, ctx, false);
    fileKeys.push(key);
    loadOperations.push(
      loader(location, sandbox, contextualize).catch((error) => ({
        _loadError: true,
        key,
        location,
        error,
      })),
    );
  }
  const results = await Promise.all(loadOperations);
  const errors = [];
  results.forEach((result, index) => {
    const key = fileKeys[index];
    if (result?._loadError) {
      errors.push(`${result.location}: ${result.error.message}`);
    } else {
      container[key] = result;
    }
  });
  if (errors.length > 0) {
    const error = new Error(
      `Failed to load ${errors.length} file(s):\n  ${errors.join('\n  ')}`,
    );
    error.errors = errors;
    throw error;
  }
  if (_isRoot && startTime) {
    const duration = Date.now() - startTime;
    container._loadStats = { duration, fileCount: loadOperations.length };
  }
  return container;
};

const createRouting = (container, path = '', routing = new Map()) => {
  for (const [key, value] of Object.entries(container)) {
    const location = path ? `${path}.${key}` : key;
    if (typeof value === 'function') routing.set(location, value);
    else createRouting(value, location, routing);
  }
  return routing;
};

module.exports = { loadDir, createRouting };
