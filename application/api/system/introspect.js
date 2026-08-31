({
  access: 'public',
  method: async (units) => {
    const list = Array.isArray(units)
      ? units
      : typeof units === 'string'
      ? [units]
      : [];

    const result = {};
    const routing = application?.routing;
    if (!routing || typeof routing.keys !== 'function') return result;

    const keys = Array.from(routing.keys()); // e.g. ['auth.signin', 'auth.logout']

    for (const raw of list) {
      const [unit] = String(raw || '').split('.');
      if (!unit) continue;
      const methods = {};
      for (const key of keys) {
        if (!key.startsWith(unit + '.')) continue;
        const methodName = key.slice(unit.length + 1);
        methods[methodName] = {};
      }
      result[unit] = methods;
    }

    return result;
  },
});
