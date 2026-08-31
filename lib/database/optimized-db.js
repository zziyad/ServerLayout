// FILE: lib/database/optimized-db.js
'use strict';

const { DatabaseConnectionPool } = require('./connection-pool.js');
const { QueryOptimizer } = require('./query-optimizer.js');
const logger = require('../logger.js');

/**
 * Optimized Database Layer
 * Integrates connection pooling, query optimization, and performance monitoring
 */
class OptimizedDatabase {
  constructor(config, options = {}) {
    this.config = config;
    this.options = options;

    // Initialize components
    this.pool = new DatabaseConnectionPool(config, options);
    this.optimizer = new QueryOptimizer(this.pool);

    // Prepared statements registry
    this.statements = new Map();

    // Initialize prepared statements (non-blocking)
    this.initializePreparedStatements().catch((err) => {
      logger.error(
        'Prepared statements initialization failed (non-critical):',
        err.message,
      );
    });
  }

  /**
   * Initialize commonly used prepared statements (optional)
   */
  async initializePreparedStatements() {
    try {
      // Only initialize basic connectivity test statement
      await this.optimizer.prepareStatement(
        'test_connection',
        'SELECT now() as current_time',
      );

      logger.system('Basic prepared statements initialized successfully');
    } catch (err) {
      logger.error(
        'Failed to initialize prepared statements (non-critical):',
        err.message,
      );
      // Don't throw error - this is optional
    }
  }

  /**
   * Initialize application-specific prepared statements when needed
   * This method is optional and can be called by application code when needed
   */
  async initializeApplicationStatements(statements = []) {
    try {
      for (const { name, query } of statements) {
        await this.optimizer.prepareStatement(name, query);
      }

      logger.system(
        `Application prepared statements initialized: ${statements.length} statements`,
      );
    } catch (err) {
      logger.error(
        'Failed to initialize application prepared statements:',
        err.message,
      );
      // Don't throw error - statements will be created on-demand
    }
  }

  /**
   * Execute query with automatic optimization
   */
  async query(text, params = [], options = {}) {
    const { useCache = false, cacheTTL = 300000 } = options;

    if (useCache) {
      return await this.optimizer.executeCached(text, params, cacheTTL);
    }

    return await this.pool.query(text, params);
  }

  /**
   * Execute prepared statement
   */
  async executePrepared(name, params = []) {
    return await this.optimizer.executePrepared(name, params);
  }

  /**
   * Execute transaction
   */
  async transaction(callback) {
    return await this.pool.transaction(callback);
  }

  /**
   * Execute batch operations
   */
  async batchExecute(operations) {
    return await this.optimizer.batchExecute(operations);
  }

  /**
   * Batch insert records
   */
  async batchInsert(table, records, columns = null) {
    return await this.optimizer.batchInsert(table, records, columns);
  }

  /**
   * Batch update records
   */
  async batchUpdate(table, updates, whereColumn = 'id') {
    return await this.optimizer.batchUpdate(table, updates, whereColumn);
  }

  // =============================================================================
  // GENERIC CRUD OPERATIONS (Schema-Agnostic)
  // =============================================================================

  /**
   * Generic SELECT with WHERE conditions
   */
  async select(table, options = {}) {
    const {
      columns = ['*'],
      where = {},
      orderBy = null,
      limit = null,
      offset = 0,
      useCache = false,
      cacheTTL = 300000,
    } = options;

    let query = `SELECT ${columns.join(', ')} FROM "${table}"`;
    const params = [];
    let paramIndex = 1;

    // Build WHERE clause
    if (Object.keys(where).length > 0) {
      const whereClause = Object.keys(where)
        .map((key) => `"${key}" = $${paramIndex++}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(where));
    }

    // Add ORDER BY
    if (orderBy) {
      query += ` ORDER BY ${orderBy}`;
    }

    // Add LIMIT and OFFSET
    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(limit);
    }

    if (offset > 0) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(offset);
    }

    return await this.query(query, params, { useCache, cacheTTL });
  }

  /**
   * Generic INSERT operation
   */
  async insert(table, data, options = {}) {
    const { returning = '*', onConflict = null } = options;

    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    let query = `INSERT INTO "${table}" (${columns
      .map((col) => `"${col}"`)
      .join(', ')}) VALUES (${placeholders})`;

    // Handle ON CONFLICT
    if (onConflict) {
      query += ` ON CONFLICT ${onConflict}`;
    }

    query += ` RETURNING ${returning}`;

    return await this.query(query, values);
  }

  /**
   * Generic UPDATE operation
   */
  async update(table, data, where, options = {}) {
    const { returning = '*' } = options;

    const dataColumns = Object.keys(data);
    const dataValues = Object.values(data);
    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);

    const setClause = dataColumns
      .map((col, i) => `"${col}" = $${i + 1}`)
      .join(', ');
    const whereClause = whereColumns
      .map((col, i) => `"${col}" = $${dataColumns.length + i + 1}`)
      .join(' AND ');

    const query = `UPDATE "${table}" SET ${setClause} WHERE ${whereClause} RETURNING ${returning}`;
    const params = [...dataValues, ...whereValues];

    return await this.query(query, params);
  }

  /**
   * Generic DELETE operation
   */
  async delete(table, where, options = {}) {
    const { returning = '*' } = options;

    const whereColumns = Object.keys(where);
    const whereValues = Object.values(where);
    const whereClause = whereColumns
      .map((col, i) => `"${col}" = $${i + 1}`)
      .join(' AND ');

    const query = `DELETE FROM "${table}" WHERE ${whereClause} RETURNING ${returning}`;

    return await this.query(query, whereValues);
  }

  /**
   * Generic COUNT operation
   */
  async count(table, where = {}) {
    let query = `SELECT COUNT(*) as count FROM "${table}"`;
    const params = [];
    let paramIndex = 1;

    if (Object.keys(where).length > 0) {
      const whereClause = Object.keys(where)
        .map((key) => `"${key}" = $${paramIndex++}`)
        .join(' AND ');
      query += ` WHERE ${whereClause}`;
      params.push(...Object.values(where));
    }

    const result = await this.query(query, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Generic EXISTS check
   */
  async exists(table, where) {
    const count = await this.count(table, where);
    return count > 0;
  }

  // =============================================================================
  // PERFORMANCE MONITORING
  // =============================================================================

  /**
   * Get database performance metrics
   */
  getMetrics() {
    return {
      pool: this.pool.getHealthStatus(),
      cache: this.optimizer.getCacheStats(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get slow queries from PostgreSQL
   */
  async getSlowQueries(limit = 10) {
    const query = `
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        rows,
        100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
      FROM pg_stat_statements 
      WHERE mean_time > 1000  -- Queries taking more than 1 second on average
      ORDER BY mean_time DESC 
      LIMIT $1
    `;

    return await this.query(query, [limit]);
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats() {
    const query = `
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        CASE 
          WHEN idx_scan = 0 THEN 'UNUSED'
          WHEN idx_scan < 100 THEN 'LOW_USAGE'
          WHEN idx_scan < 1000 THEN 'MEDIUM_USAGE'
          ELSE 'HIGH_USAGE'
        END as usage_level
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC
    `;

    return await this.query(query);
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.optimizer.clearCache();
  }

  /**
   * Close database connections
   */
  async close() {
    try {
      await this.optimizer.cleanup();
      await this.pool.close();
      logger.system('Optimized database layer closed');
    } catch (err) {
      logger.error('Error closing database layer:', err);
    }
  }
}

module.exports = { OptimizedDatabase };
