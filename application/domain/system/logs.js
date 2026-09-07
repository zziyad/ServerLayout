// =============================================================================
// SYSTEM LOGS - Business Logic
// =============================================================================

async (payload) => {
  const dir = node.path.resolve(node.process.cwd(), 'log');
  const requested = payload.date || new Date().toISOString().slice(0, 10);
  const fileName = `${requested}.log`;
  const filePath = node.path.join(dir, fileName);
  const limit = Number(payload.lines || 200);

  let files = [];
  try {
    files = (await node.fs.promises.readdir(dir))
      .filter((name) => name.endsWith('.log'))
      .sort()
      .reverse();
  } catch {
    files = [];
  }

  let content = '';
  let exists = false;
  try {
    exists = node.fs.existsSync(filePath);
    if (exists) {
      const raw = await node.fs.promises.readFile(filePath, 'utf8');
      const all = raw.split(/\r?\n/);
      content = all.slice(Math.max(0, all.length - limit)).join('\n');
    }
  } catch (err) {
    const error = new Error(err.message || 'Failed to read log file');
    error.code = 'LOG_READ_FAILED';
    throw error;
  }

  return {
    date: requested,
    file: exists ? fileName : null,
    files,
    lines: content ? content.split(/\r?\n/).filter((line) => line !== '').length : 0,
    content,
  };
};
