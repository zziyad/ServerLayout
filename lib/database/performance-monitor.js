// FILE: lib/database/performance-monitor.js
'use strict';

const logger = require('../logger.js');

/**
 * Database Performance Monitor
 * Tracks query performance, connection health, and optimization opportunities
 */
class DatabasePerformanceMonitor {
  constructor(database, options = {}) {
    this.database = database;
    this.options = {
      slowQueryThreshold: options.slowQueryThreshold || 1000, // 1 second
      monitoringInterval: options.monitoringInterval || 60000, // 1 minute
      maxSlowQueries: options.maxSlowQueries || 100,
      enableAlerts: options.enableAlerts || true,
      ...options,
    };

    this.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      connectionErrors: 0,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
    };

    this.slowQueries = [];
    this.queryTimes = [];
    this.maxQueryTimeSamples = 1000;

    this.monitoringInterval = null;
    this.isMonitoring = false;

    this.startMonitoring();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.checkAlerts();
    }, this.options.monitoringInterval);

    logger.system('Database performance monitoring started', {
      interval: this.options.monitoringInterval,
      slowQueryThreshold: this.options.slowQueryThreshold,
    });
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    logger.system('Database performance monitoring stopped');
  }

  /**
   * Record query execution
   */
  recordQuery(query, params, executionTime, result) {
    this.metrics.totalQueries++;

    // Update query times
    this.queryTimes.push(executionTime);
    if (this.queryTimes.length > this.maxQueryTimeSamples) {
      this.queryTimes.shift();
    }

    // Calculate average query time
    this.metrics.averageQueryTime =
      this.queryTimes.reduce((sum, time) => sum + time, 0) /
      this.queryTimes.length;

    // Check for slow queries
    if (executionTime > this.options.slowQueryThreshold) {
      this.metrics.slowQueries++;
      this.recordSlowQuery(query, params, executionTime, result);
    }

    // Update cache metrics if available
    if (this.database.optimizer) {
      const cacheStats = this.database.optimizer.getCacheStats();
      this.metrics.cacheHits = cacheStats.hits;
      this.metrics.cacheMisses = cacheStats.misses;
      this.metrics.cacheHitRate = parseFloat(cacheStats.hitRate);
    }
  }

  /**
   * Record slow query
   */
  recordSlowQuery(query, params, executionTime, result) {
    const slowQuery = {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      params: params.length,
      executionTime,
      timestamp: new Date().toISOString(),
      rows: result?.rowCount || 0,
    };

    this.slowQueries.push(slowQuery);

    // Keep only recent slow queries
    if (this.slowQueries.length > this.options.maxSlowQueries) {
      this.slowQueries.shift();
    }

    logger.warn('Slow query detected', slowQuery);
  }

  /**
   * Collect current metrics
   */
  async collectMetrics() {
    try {
      // Get database metrics
      const dbMetrics = this.database.getMetrics();

      this.metrics.connectionPoolSize = dbMetrics.pool.poolSize;
      this.metrics.activeConnections = dbMetrics.pool.activeConnections;
      this.metrics.idleConnections = dbMetrics.pool.idleConnections;
      this.metrics.waitingClients = dbMetrics.pool.waitingClients;
      this.metrics.connectionErrors = dbMetrics.pool.metrics.connectionErrors;

      // Get PostgreSQL statistics
      await this.collectPostgreSQLStats();
    } catch (err) {
      logger.error('Failed to collect database metrics:', err);
    }
  }

  /**
   * Collect PostgreSQL-specific statistics
   */
  async collectPostgreSQLStats() {
    try {
      // Get database size
      const dbSizeQuery = `
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size
      `;
      const dbSizeResult = await this.database.query(dbSizeQuery);
      this.metrics.databaseSize = dbSizeResult.rows[0]?.database_size;

      // Get table sizes
      const tableSizeQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 10
      `;
      const tableSizeResult = await this.database.query(tableSizeQuery);
      this.metrics.largestTables = tableSizeResult.rows;

      // Get index usage
      const indexUsageQuery = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE idx_scan = 0
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10
      `;
      const indexUsageResult = await this.database.query(indexUsageQuery);
      this.metrics.unusedIndexes = indexUsageResult.rows;
    } catch (err) {
      logger.error('Failed to collect PostgreSQL statistics:', err);
    }
  }

  /**
   * Check for performance alerts
   */
  checkAlerts() {
    const alerts = [];

    // High query time alert
    if (this.metrics.averageQueryTime > this.options.slowQueryThreshold * 2) {
      alerts.push({
        type: 'HIGH_AVERAGE_QUERY_TIME',
        message: `Average query time is ${this.metrics.averageQueryTime}ms (threshold: ${this.options.slowQueryThreshold}ms)`,
        severity: 'warning',
      });
    }

    // High slow query count alert
    if (this.metrics.slowQueries > 10) {
      alerts.push({
        type: 'HIGH_SLOW_QUERY_COUNT',
        message: `${this.metrics.slowQueries} slow queries detected`,
        severity: 'warning',
      });
    }

    // Connection pool exhaustion alert
    if (this.metrics.waitingClients > 5) {
      alerts.push({
        type: 'CONNECTION_POOL_EXHAUSTION',
        message: `${this.metrics.waitingClients} clients waiting for connections`,
        severity: 'critical',
      });
    }

    // High connection error rate alert
    if (this.metrics.connectionErrors > 10) {
      alerts.push({
        type: 'HIGH_CONNECTION_ERROR_RATE',
        message: `${this.metrics.connectionErrors} connection errors detected`,
        severity: 'critical',
      });
    }

    // Low cache hit rate alert
    if (
      this.metrics.cacheHitRate < 50 &&
      this.metrics.cacheHits + this.metrics.cacheMisses > 100
    ) {
      alerts.push({
        type: 'LOW_CACHE_HIT_RATE',
        message: `Cache hit rate is ${this.metrics.cacheHitRate}% (threshold: 50%)`,
        severity: 'warning',
      });
    }

    // Send alerts
    if (alerts.length > 0 && this.options.enableAlerts) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * Send performance alerts
   */
  sendAlerts(alerts) {
    alerts.forEach((alert) => {
      const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
      logger[logLevel]('Database performance alert', alert);
    });
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      slowQueries: this.slowQueries.slice(-10), // Last 10 slow queries
      recommendations: this.generateRecommendations(),
      health: this.getHealthStatus(),
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Query optimization recommendations
    if (this.metrics.averageQueryTime > 500) {
      recommendations.push({
        type: 'QUERY_OPTIMIZATION',
        priority: 'high',
        message: 'Consider optimizing slow queries or adding indexes',
        action: 'Review slow queries and add appropriate indexes',
      });
    }

    // Connection pool recommendations
    if (this.metrics.waitingClients > 0) {
      recommendations.push({
        type: 'CONNECTION_POOL',
        priority: 'medium',
        message: 'Consider increasing connection pool size',
        action: 'Increase max connections in database configuration',
      });
    }

    // Cache recommendations
    if (
      this.metrics.cacheHitRate < 70 &&
      this.metrics.cacheHits + this.metrics.cacheMisses > 100
    ) {
      recommendations.push({
        type: 'CACHE_OPTIMIZATION',
        priority: 'medium',
        message: 'Consider increasing cache size or TTL',
        action: 'Review cache configuration and increase cache size',
      });
    }

    // Index recommendations
    if (this.metrics.unusedIndexes && this.metrics.unusedIndexes.length > 5) {
      recommendations.push({
        type: 'INDEX_CLEANUP',
        priority: 'low',
        message: 'Consider removing unused indexes',
        action: 'Review and remove unused indexes to save space',
      });
    }

    return recommendations;
  }

  /**
   * Get database health status
   */
  getHealthStatus() {
    const health = {
      status: 'healthy',
      score: 100,
      issues: [],
    };

    // Deduct points for issues
    if (this.metrics.averageQueryTime > 1000) {
      health.score -= 20;
      health.issues.push('High average query time');
    }

    if (this.metrics.slowQueries > 5) {
      health.score -= 15;
      health.issues.push('Multiple slow queries');
    }

    if (this.metrics.waitingClients > 2) {
      health.score -= 25;
      health.issues.push('Connection pool pressure');
    }

    if (this.metrics.connectionErrors > 5) {
      health.score -= 30;
      health.issues.push('Connection errors');
    }

    if (this.metrics.cacheHitRate < 50) {
      health.score -= 10;
      health.issues.push('Low cache hit rate');
    }

    // Determine overall status
    if (health.score >= 90) {
      health.status = 'excellent';
    } else if (health.score >= 70) {
      health.status = 'good';
    } else if (health.score >= 50) {
      health.status = 'fair';
    } else {
      health.status = 'poor';
    }

    return health;
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      database: {
        totalQueries: this.metrics.totalQueries,
        slowQueries: this.metrics.slowQueries,
        averageQueryTime: Math.round(this.metrics.averageQueryTime),
        connectionPoolSize: this.metrics.connectionPoolSize,
        activeConnections: this.metrics.activeConnections,
        idleConnections: this.metrics.idleConnections,
        waitingClients: this.metrics.waitingClients,
        connectionErrors: this.metrics.connectionErrors,
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: this.metrics.cacheHitRate,
      },
      health: this.getHealthStatus(),
    };
  }
}

module.exports = { DatabasePerformanceMonitor };
