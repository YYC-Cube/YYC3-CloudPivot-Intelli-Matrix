/**
 * @file query-monitor.ts
 * @description YYC³ 查询性能监控服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags monitoring,performance,query
 */

/**
 * 查询指标接口
 */
export interface QueryMetric {
  id: string;
  query: string;
  table: string;
  operation: 'get' | 'add' | 'update' | 'delete' | 'query';
  duration: number;
  timestamp: number;
  cacheHit: boolean;
  resultCount: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * 性能统计接口
 */
export interface PerformanceStats {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  cacheHitRate: number;
  slowQueries: number;
  slowQueryThreshold: number;
}

/**
 * 查询监控配置
 */
export interface QueryMonitorConfig {
  enabled: boolean;
  maxHistorySize: number;
  slowQueryThreshold: number;
  autoCleanup: boolean;
  cleanupInterval: number;
}

/**
 * 查询监控器类
 */
export class QueryMonitor {
  private static instance: QueryMonitor;
  private metrics: QueryMetric[] = [];
  private config: QueryMonitorConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private subscribers: Set<(metric: QueryMetric) => void> = new Set();

  private constructor(config: Partial<QueryMonitorConfig> = {}) {
    this.config = {
      enabled: true,
      maxHistorySize: 1000,
      slowQueryThreshold: 1000, // 1 秒
      autoCleanup: true,
      cleanupInterval: 60000, // 1 分钟
      ...config,
    };

    if (this.config.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(
    config?: Partial<QueryMonitorConfig>
  ): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor(config);
    }
    return QueryMonitor.instance;
  }

  /**
   * 开始监控查询
   */
  startQuery(
    _query: string,
    _table: string,
    _operation: QueryMetric['operation']
  ): string {
    if (!this.config.enabled) {
      return '';
    }

    const id = `query-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return id;
  }

  /**
   * 结束监控查询
   */
  endQuery(
    id: string,
    query: string,
    table: string,
    operation: QueryMetric['operation'],
    startTime: number,
    cacheHit: boolean,
    resultCount: number,
    success: boolean,
    errorMessage?: string
  ): void {
    if (!this.config.enabled || !id) {
      return;
    }

    const duration = Date.now() - startTime;

    const metric: QueryMetric = {
      id,
      query,
      table,
      operation,
      duration,
      timestamp: Date.now(),
      cacheHit,
      resultCount,
      success,
      errorMessage,
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.config.maxHistorySize) {
      this.metrics.shift();
    }

    this.notifySubscribers(metric);

    if (duration > this.config.slowQueryThreshold) {
      console.warn(
        `[Slow Query] ${operation} on ${table} took ${duration}ms`,
        { query, duration }
      );
    }
  }

  /**
   * 包装查询函数
   */
  async wrapQuery<T>(
    query: string,
    table: string,
    operation: QueryMetric['operation'],
    fn: () => Promise<{ data: T; cacheHit: boolean }>
  ): Promise<T> {
    const id = this.startQuery(query, table, operation);
    const startTime = Date.now();

    try {
      const { data, cacheHit } = await fn();

      this.endQuery(
        id,
        query,
        table,
        operation,
        startTime,
        cacheHit,
        Array.isArray(data) ? data.length : 1,
        true
      );

      return data;
    } catch (error) {
      this.endQuery(
        id,
        query,
        table,
        operation,
        startTime,
        false,
        0,
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * 获取所有指标
   */
  getMetrics(): QueryMetric[] {
    return [...this.metrics];
  }

  /**
   * 获取最近的指标
   */
  getRecentMetrics(count: number = 100): QueryMetric[] {
    return this.metrics.slice(-count);
  }

  /**
   * 获取慢查询
   */
  getSlowQueries(): QueryMetric[] {
    return this.metrics.filter(
      (metric) => metric.duration > this.config.slowQueryThreshold
    );
  }

  /**
   * 获取失败的查询
   */
  getFailedQueries(): QueryMetric[] {
    return this.metrics.filter((metric) => !metric.success);
  }

  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        cacheHitRate: 0,
        slowQueries: 0,
        slowQueryThreshold: this.config.slowQueryThreshold,
      };
    }

    const successfulQueries = this.metrics.filter((m) => m.success);
    const failedQueries = this.metrics.filter((m) => !m.success);
    const cacheHits = this.metrics.filter((m) => m.cacheHit);

    const durations = this.metrics.map((m) => m.duration);
    const averageDuration =
      durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const slowQueries = this.getSlowQueries().length;

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      averageDuration,
      minDuration,
      maxDuration,
      cacheHitRate: cacheHits.length / this.metrics.length,
      slowQueries,
      slowQueryThreshold: this.config.slowQueryThreshold,
    };
  }

  /**
   * 按表分组统计
   */
  getStatsByTable(): Map<string, PerformanceStats> {
    const stats = new Map<string, QueryMetric[]>();

    for (const metric of this.metrics) {
      if (!stats.has(metric.table)) {
        stats.set(metric.table, []);
      }
      stats.get(metric.table)!.push(metric);
    }

    const result = new Map<string, PerformanceStats>();

    for (const [table, metrics] of stats.entries()) {
      const successfulQueries = metrics.filter((m) => m.success);
      const cacheHits = metrics.filter((m) => m.cacheHit);
      const durations = metrics.map((m) => m.duration);

      result.set(table, {
        totalQueries: metrics.length,
        successfulQueries: successfulQueries.length,
        failedQueries: metrics.length - successfulQueries.length,
        averageDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        cacheHitRate: cacheHits.length / metrics.length,
        slowQueries: metrics.filter(
          (m) => m.duration > this.config.slowQueryThreshold
        ).length,
        slowQueryThreshold: this.config.slowQueryThreshold,
      });
    }

    return result;
  }

  /**
   * 按操作分组统计
   */
  getStatsByOperation(): Map<
    QueryMetric['operation'],
    PerformanceStats
  > {
    const stats = new Map<QueryMetric['operation'], QueryMetric[]>();

    for (const metric of this.metrics) {
      if (!stats.has(metric.operation)) {
        stats.set(metric.operation, []);
      }
      stats.get(metric.operation)!.push(metric);
    }

    const result = new Map<QueryMetric['operation'], PerformanceStats>();

    for (const [operation, metrics] of stats.entries()) {
      const successfulQueries = metrics.filter((m) => m.success);
      const cacheHits = metrics.filter((m) => m.cacheHit);
      const durations = metrics.map((m) => m.duration);

      result.set(operation, {
        totalQueries: metrics.length,
        successfulQueries: successfulQueries.length,
        failedQueries: metrics.length - successfulQueries.length,
        averageDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        cacheHitRate: cacheHits.length / metrics.length,
        slowQueries: metrics.filter(
          (m) => m.duration > this.config.slowQueryThreshold
        ).length,
        slowQueryThreshold: this.config.slowQueryThreshold,
      });
    }

    return result;
  }

  /**
   * 清除所有指标
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 清除旧指标
   */
  clearOldMetrics(olderThan: number): void {
    const cutoff = Date.now() - olderThan;
    this.metrics = this.metrics.filter(
      (metric) => metric.timestamp > cutoff
    );
  }

  /**
   * 订阅指标更新
   */
  subscribe(callback: (metric: QueryMetric) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(metric: QueryMetric): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(metric);
      } catch (error) {
        console.error('Error in query monitor subscriber:', error);
      }
    }
  }

  /**
   * 开始自动清理
   */
  private startAutoCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.clearOldMetrics(3600000); // 1 小时
    }, this.config.cleanupInterval);
  }

  /**
   * 停止自动清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * 导出指标
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }

  /**
   * 导入指标
   */
  importMetrics(json: string): void {
    try {
      const metrics = JSON.parse(json) as QueryMetric[];
      this.metrics = metrics;
    } catch (error) {
      console.error('Failed to import metrics:', error);
    }
  }

  /**
   * 生成性能报告
   */
  generateReport(): string {
    const stats = this.getStats();
    const statsByTable = this.getStatsByTable();
    const statsByOperation = this.getStatsByOperation();

    let report = '=== Query Performance Report ===\n\n';
    report += `Total Queries: ${stats.totalQueries}\n`;
    report += `Successful: ${stats.successfulQueries}\n`;
    report += `Failed: ${stats.failedQueries}\n`;
    report += `Average Duration: ${stats.averageDuration.toFixed(2)}ms\n`;
    report += `Min Duration: ${stats.minDuration}ms\n`;
    report += `Max Duration: ${stats.maxDuration}ms\n`;
    report += `Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(2)}%\n`;
    report += `Slow Queries: ${stats.slowQueries}\n\n`;

    report += '=== By Table ===\n';
    for (const [table, tableStats] of statsByTable.entries()) {
      report += `\n${table}:\n`;
      report += `  Total: ${tableStats.totalQueries}\n`;
      report += `  Avg: ${tableStats.averageDuration.toFixed(2)}ms\n`;
      report += `  Cache Hit: ${(tableStats.cacheHitRate * 100).toFixed(2)}%\n`;
    }

    report += '\n=== By Operation ===\n';
    for (const [operation, opStats] of statsByOperation.entries()) {
      report += `\n${operation}:\n`;
      report += `  Total: ${opStats.totalQueries}\n`;
      report += `  Avg: ${opStats.averageDuration.toFixed(2)}ms\n`;
      report += `  Cache Hit: ${(opStats.cacheHitRate * 100).toFixed(2)}%\n`;
    }

    return report;
  }
}

/**
 * 导出单例实例
 */
export const queryMonitor = QueryMonitor.getInstance();

/**
 * 便捷函数：包装查询
 */
export async function monitorQuery<T>(
  query: string,
  table: string,
  operation: QueryMetric['operation'],
  fn: () => Promise<{ data: T; cacheHit: boolean }>
): Promise<T> {
  return queryMonitor.wrapQuery(query, table, operation, fn);
}

/**
 * 便捷函数：获取性能统计
 */
export function getQueryStats(): PerformanceStats {
  return queryMonitor.getStats();
}

/**
 * 便捷函数：生成性能报告
 */
export function generatePerformanceReport(): string {
  return queryMonitor.generateReport();
}
