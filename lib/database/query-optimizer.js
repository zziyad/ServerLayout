// FILE: lib/database/query-optimizer.js
'use strict';

const logger = require('../logger.js');

/**
 * Database Query Optimizer
 * Provides prepared statements, query caching, and batch operations
 */
class QueryOptimizer {
  constructor(pool) {
    this.pool = pool;
    this.preparedStatements = new Map();
    this.queryCache = new Map();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
    this.maxCacheSize = 1000;
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Prepare statement for reuse
   */
  async prepareStatement(name, query) {
    try {
      if (this.preparedStatements.has(name)) {
        return this.preparedStatements.get(name);
      }

      const client = await this.pool.getConnection();
      try {
        await client.query(`PREPARE ${name} AS ${query}`);
        this.preparedStatements.set(name, query);

        logger.system('Prepared statement created', {
          name,
          query: query.substring(0, 100),
        });
        return query;
      } finally {
        client.release();
      }
    } catch (err) {
      logger.error('Failed to prepare statement:', {
        name,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Execute prepared statement
   */
  async executePrepared(name, params = []) {
    try {
      const startTime = Date.now();
      const result = await this.pool.query(`EXECUTE ${name}`, params);
      const queryTime = Date.now() - startTime;

      logger.debug('Prepared statement executed', {
        name,
        params: params.length,
        time: queryTime,
        rows: result.rowCount,
      });

      return result;
    } catch (err) {
      logger.error('Prepared statement execution failed:', {
        name,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Execute query with caching
   */
  async executeCached(query, params = [], ttl = this.cacheTTL) {
    const cacheKey = this.generateCacheKey(query, params);

    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      this.cacheStats.hits++;
      logger.debug('Query cache hit', { cacheKey: cacheKey.substring(0, 50) });
      return cached.result;
    }

    // Execute query
    const startTime = Date.now();
    const result = await this.pool.query(query, params);
    const queryTime = Date.now() - startTime;

    // Cache result
    this.cacheResult(cacheKey, result, ttl);
    this.cacheStats.misses++;

    logger.debug('Query executed and cached', {
      cacheKey: cacheKey.substring(0, 50),
      time: queryTime,
      rows: result.rowCount,
    });

    return result;
  }

  /**
   * Execute batch operations efficiently
   */
  async batchExecute(operations) {
    const client = await this.pool.getConnection();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const operation of operations) {
        const { query, params } = operation;
        const result = await client.query(query, params);
        results.push(result);
      }

      await client.query('COMMIT');

      logger.system('Batch operations completed', {
        operations: operations.length,
        totalRows: results.reduce((sum, r) => sum + r.rowCount, 0),
      });

      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error('Batch operations failed:', { error: err.message });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Optimize INSERT operations with VALUES clause
   */
  async batchInsert(table, records, columns = null) {
    if (!records || records.length === 0) {
      return { rowCount: 0 };
    }

    // Get columns from first record if not provided
    if (!columns) {
      columns = Object.keys(records[0]);
    }

    // Build VALUES clause
    const valuesClause = records
      .map((record, index) => {
        const values = columns
          .map((col, colIndex) => `$${index * columns.length + colIndex + 1}`)
          .join(', ');
        return `(${values})`;
      })
      .join(', ');

    // Build query
    const query = `
      INSERT INTO "${table}" (${columns.map((col) => `"${col}"`).join(', ')})
      VALUES ${valuesClause}
    `;

    // Flatten parameters
    const params = records.flatMap((record) =>
      columns.map((col) => record[col]),
    );

    const result = await this.pool.query(query, params);

    logger.system('Batch insert completed', {
      table,
      records: records.length,
      columns: columns.length,
      rows: result.rowCount,
    });

    return result;
  }

  /**
   * Optimize UPDATE operations with CASE statements
   */
  async batchUpdate(table, updates, whereColumn = 'id') {
    if (!updates || updates.length === 0) {
      return { rowCount: 0 };
    }

    const columns = Object.keys(updates[0]).filter(
      (col) => col !== whereColumn,
    );
    const ids = updates.map((update) => update[whereColumn]);

    // Build CASE statements for each column
    const caseStatements = columns
      .map((col) => {
        const cases = updates
          .map(
            (update, index) =>
              `WHEN $${index + 1} THEN $${updates.length + index + 1}`,
          )
          .join(' ');

        return `"${col}" = CASE "${whereColumn}" ${cases} END`;
      })
      .join(', ');

    // Build query
    const query = `
      UPDATE "${table}" 
      SET ${caseStatements}
      WHERE "${whereColumn}" = ANY($${updates.length * 2 + 1})
    `;

    // Prepare parameters
    const params = [
      ...ids,
      ...updates.flatMap((update) => columns.map((col) => update[col])),
      ids,
    ];

    const result = await this.pool.query(query, params);

    logger.system('Batch update completed', {
      table,
      updates: updates.length,
      columns: columns.length,
      rows: result.rowCount,
    });

    return result;
  }

  /**
   * Generate cache key for query and parameters
   */
  generateCacheKey(query, params) {
    const normalizedQuery = query.replace(/\s+/g, ' ').trim();
    const paramsStr = JSON.stringify(params);
    return `${normalizedQuery}:${paramsStr}`;
  }

  /**
   * Cache query result
   */
  cacheResult(key, result, ttl) {
    // Evict old entries if cache is full
    if (this.queryCache.size >= this.maxCacheSize) {
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
      this.cacheStats.evictions++;
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear query cache
   */
  clearCache() {
    this.queryCache.clear();
    this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
    logger.system('Query cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate =
      this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) ||
      0;

    return {
      ...this.cacheStats,
      hitRate: Math.round(hitRate * 100) + '%',
      cacheSize: this.queryCache.size,
      maxCacheSize: this.maxCacheSize,
    };
  }

  /**
   * Cleanup prepared statements
   */
  async cleanup() {
    const client = await this.pool.getConnection();

    try {
      for (const [name] of this.preparedStatements) {
        try {
          await client.query(`DEALLOCATE ${name}`);
        } catch (err) {
          // Ignore "does not exist" errors - PostgreSQL auto-deallocates on connection close
          if (!err.message.includes('does not exist')) {
            logger.error('Failed to deallocate prepared statement:', {
              name,
              error: err.message,
            });
          }
        }
      }

      this.preparedStatements.clear();
      logger.system('Prepared statements cleaned up');
    } finally {
      client.release();
    }
  }
}

module.exports = { QueryOptimizer };
