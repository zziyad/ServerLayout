async () => {
  try {
    const OptimizedDatabase = common.OptimizedDatabase;
    // Initialize optimized database layer
    const dbConfig = {
      ...config.database,
      // Add connection pool settings
      max: 20, // Maximum connections
      min: 5, // Minimum connections
      idleTimeoutMillis: 30000, // Close idle connections after 30s
      connectionTimeoutMillis: 2000, // Connection timeout
      acquireTimeoutMillis: 60000, // Acquire timeout
      statement_timeout: 30000, // Statement timeout
      query_timeout: 30000, // Query timeout
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      application_name: 'trs-server-optimized',
    };

    // Create optimized database instance
    db.optimized = new OptimizedDatabase(dbConfig, {
      enableMetrics: true,
      enableSlowQueryLogging: true,
      cacheSize: 1000,
      cacheTTL: 300000, // 5 minutes
    });

    // Test connection
    const {
      rows: [{ now }],
    } = await db.optimized.query('SELECT now()');

    console.system('Optimized database connected', {
      timestamp: new Date(now).toLocaleTimeString(),
    });

    // Legacy compatibility (for existing code) - Now uses generic methods
    db.pg = {
      query: (sql, params) => db.optimized.query(sql, params),
      row: async (table, fields = ['*'], where = {}) => {
        const result = await db.optimized.select(table, {
          columns: fields,
          where,
          limit: 1,
        });
        return result.rows[0] || null;
      },
      insert: async (table, data) => {
        const result = await db.optimized.insert(table, data);
        return result.rows[0];
      },
      update: async (table, data, where) => {
        const result = await db.optimized.update(table, data, where);
        return result.rows[0];
      },
      delete: async (table, where) => {
        const result = await db.optimized.delete(table, where);
        return result.rows[0];
      },
    };

    // Keep legacy client for compatibility
    db.client = {
      query: (sql, params) => db.optimized.query(sql, params),
      release: () => {}, // No-op for compatibility
    };
  } catch (err) {
    console.error('Failed to initialize optimized database:', err);
    throw err;
  }
};
