// FILE: lib/database/connection-pool.js
'use strict';

const { Pool } = require('pg');
const logger = require('../logger.js');

/**
 * Optimized PostgreSQL Connection Pool Manager
 * Implements connection pooling, health monitoring, and performance metrics
 */
class DatabaseConnectionPool {
  constructor(config, options = {}) {
    this.config = {
      // Connection pool settings
      max: options.maxConnections || 20,
      min: options.minConnections || 5,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: options.connectionTimeoutMillis || 2000,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 60000,

      // Performance settings
      statement_timeout: options.statementTimeout || 30000,
      query_timeout: options.queryTimeout || 30000,

      // Connection settings
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,

      // SSL settings
      ssl: options.ssl || false,

      // Application settings
      application_name: 'trs-server',

      ...config,
    };

    this.pool = null;
    this.isConnected = false;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      connectionErrors: 0,
      queryCount: 0,
      averageQueryTime: 0,
      slowQueries: 0,
    };

    this.queryTimes = [];
    this.maxQueryTimeSamples = 1000;

    this.initializePool();
  }

  /**
   * Initialize connection pool with error handling
   */
  initializePool() {
    try {
      this.pool = new Pool(this.config);

      // Pool event handlers
      this.pool.on('connect', (client) => {
        this.metrics.totalConnections++;
        this.metrics.idleConnections++;
        logger.system('Database connection established', {
          totalConnections: this.metrics.totalConnections,
          idleConnections: this.metrics.idleConnections,
        });
      });

      this.pool.on('acquire', (client) => {
        this.metrics.activeConnections++;
        this.metrics.idleConnections--;
      });

      this.pool.on('release', (client) => {
        this.metrics.activeConnections--;
        this.metrics.idleConnections++;
      });

      this.pool.on('remove', (client) => {
        this.metrics.totalConnections--;
        if (this.metrics.idleConnections > 0) {
          this.metrics.idleConnections--;
        }
      });

      this.pool.on('error', (err, client) => {
        this.metrics.connectionErrors++;
        logger.error('Database pool error:', err);
      });

      this.isConnected = true;
      logger.system('Database connection pool initialized', {
        maxConnections: this.config.max,
        minConnections: this.config.min,
      });
    } catch (err) {
      logger.error('Failed to initialize database pool:', err);
      this.isConnected = false;
      throw err;
    }
  }

  /**
   * Execute query with performance monitoring
   */
  async query(text, params = []) {
    const startTime = Date.now();

    // Critical debug: Capture exact query for review queue to diagnose corruption
    let actualQueryString = null;
    if (
      text &&
      typeof text === 'string' &&
      (text.includes('ar.*') || text.includes('requester_name'))
    ) {
      // Create a fresh string copy to ensure we're logging the actual value
      actualQueryString = String(text);
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - Query string:',
        JSON.stringify(actualQueryString),
      );
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - First 200 chars:',
        actualQueryString.substring(0, 200),
      );
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - Has ar.*:',
        actualQueryString.includes('ar.*'),
      );
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - Has u.name:',
        actualQueryString.includes('u.name'),
      );
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - Query type:',
        typeof actualQueryString,
      );
      console.log(
        '🔍 [ConnectionPool] BEFORE pg.query - Query length:',
        actualQueryString.length,
      );
    }

    try {
      const result = await this.pool.query(text, params);

      // Update metrics
      const queryTime = Date.now() - startTime;
      this.updateQueryMetrics(queryTime);

      this.metrics.queryCount++;

      // Log slow queries
      if (queryTime > 1000) {
        // > 1 second
        this.metrics.slowQueries++;
        logger.warn('Slow query detected', {
          query: text.substring(0, 100) + '...',
          time: queryTime,
          params: params.length,
        });
      }

      return result;
    } catch (err) {
      this.metrics.connectionErrors++;

      // Critical debug: Log actual query for review queue errors
      if (
        actualQueryString ||
        (text && (text.includes('ar.*') || text.includes('requester_name')))
      ) {
        const queryToLog = actualQueryString || String(text);
        console.error(
          '❌ [ConnectionPool] ERROR - Query we tried to send:',
          JSON.stringify(queryToLog),
        );
        console.error(
          '❌ [ConnectionPool] ERROR - Query length:',
          queryToLog.length,
        );
        console.error(
          '❌ [ConnectionPool] ERROR - Has ar.*:',
          queryToLog.includes('ar.*'),
        );
        console.error(
          '❌ [ConnectionPool] ERROR - Has u.name:',
          queryToLog.includes('u.name'),
        );
        console.error(
          '❌ [ConnectionPool] ERROR - PostgreSQL error:',
          err.message,
        );
        console.error('❌ [ConnectionPool] ERROR - Error code:', err.code);
        console.error(
          '❌ [ConnectionPool] ERROR - Error position:',
          err.position,
        );
      }

      logger.error('Database query error:', {
        query: text.substring(0, 100) + '...',
        error: err.message,
        params: params.length,
      });
      throw err;
    }
  }

  /**
   * Execute transaction with automatic rollback on error
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Execute batch operations efficiently
   */
  async batchQuery(queries) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const results = [];
      for (const { text, params } of queries) {
        const result = await client.query(text, params);
        results.push(result);
      }

      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    try {
      const client = await this.pool.connect();
      return client;
    } catch (err) {
      this.metrics.connectionErrors++;
      throw err;
    }
  }

  /**
   * Update query performance metrics
   */
  updateQueryMetrics(queryTime) {
    this.queryTimes.push(queryTime);

    // Keep only recent samples
    if (this.queryTimes.length > this.maxQueryTimeSamples) {
      this.queryTimes.shift();
    }

    // Calculate average
    this.metrics.averageQueryTime =
      this.queryTimes.reduce((sum, time) => sum + time, 0) /
      this.queryTimes.length;
  }

  /**
   * Get pool health status
   */
  getHealthStatus() {
    return {
      isConnected: this.isConnected,
      poolSize: this.pool.totalCount,
      activeConnections: this.pool.totalCount - this.pool.idleCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount,
      metrics: this.metrics,
    };
  }

  /**
   * Close pool gracefully
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.system('Database connection pool closed');
    }
  }
}

module.exports = { DatabaseConnectionPool };
