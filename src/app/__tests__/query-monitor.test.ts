/**
 * query-monitor.test.ts
 * ====================
 * 查询性能监控服务 - 单元测试
 *
 * 测试策略（W1 P0 攻坚）：
 * - 使用 fake timers 隔离 setInterval 自动清理
 * - 单例隔离：每个用例重置 QueryMonitor.instance（模块内部静态）
 * - 覆盖 startQuery/endQuery/wrapQuery 全路径（成功/失败/慢查询/禁用态）
 * - 统计函数（getStats/ByTable/ByOperation）数值精确断言
 * - 订阅通知、导入导出、报告生成
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryMetric } from '../lib/query-monitor';
import { generatePerformanceReport, getQueryStats, monitorQuery, QueryMonitor, queryMonitor } from '../lib/query-monitor';

/** 重置单例（QueryMonitor.instance 为私有静态，借助 hack 重置） */
function resetInstance(config?: { enabled?: boolean; slowQueryThreshold?: number; autoCleanup?: boolean; maxHistorySize?: number; cleanupInterval?: number }) {
  (QueryMonitor as unknown as { instance: QueryMonitor | undefined }).instance = undefined;
  const instance = QueryMonitor.getInstance(config);
  instance.stopAutoCleanup();
  return instance;
}

/** 快捷构造一条已入库指标 */
function recordMetric(m: QueryMonitor, overrides: Partial<QueryMetric> = {}) {
  const id = m.startQuery('SELECT 1', 't', 'get');
  m.endQuery(
    id,
    overrides.query ?? 'SELECT 1',
    overrides.table ?? 't',
    overrides.operation ?? 'get',
    Date.now() - (overrides.duration ?? 100),
    overrides.cacheHit ?? false,
    overrides.resultCount ?? 1,
    overrides.success ?? true,
    overrides.errorMessage
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('QueryMonitor 单例', () => {
  it('getInstance 返回同一实例且导出单例可用', () => {
    const a = resetInstance();
    const b = QueryMonitor.getInstance();
    expect(b).toBe(a);
    expect(queryMonitor).toBeInstanceOf(QueryMonitor);
  });

  it('配置合并：自定义 slowQueryThreshold 生效', () => {
    const m = resetInstance({ slowQueryThreshold: 50 });
    expect(m.getStats().slowQueryThreshold).toBe(50);
  });
});

describe('startQuery / endQuery 基础记录', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance();
  });

  it('startQuery 返回唯一 id', () => {
    const id1 = m.startQuery('Q1', 't', 'get');
    const id2 = m.startQuery('Q2', 't', 'get');
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
  });

  it('endQuery 入库指标字段完整', () => {
    const id = m.startQuery('SELECT * FROM users', 'users', 'get');
    m.endQuery(id, 'SELECT * FROM users', 'users', 'get', Date.now() - 120, true, 5, true);

    const metrics = m.getMetrics();
    expect(metrics).toHaveLength(1);
    expect(metrics[0]).toMatchObject({
      id,
      query: 'SELECT * FROM users',
      table: 'users',
      operation: 'get',
      cacheHit: true,
      resultCount: 5,
      success: true,
    });
  });

  it('disabled 态：startQuery 返回空串且 endQuery 不入库', () => {
    const m2 = resetInstance({ enabled: false });
    const id = m2.startQuery('Q', 't', 'get');
    expect(id).toBe('');

    m2.endQuery('any-id', 'Q', 't', 'get', Date.now(), false, 0, true);
    expect(m2.getMetrics()).toHaveLength(0);
  });

  it('maxHistorySize 超限后淘汰最旧指标', () => {
    const m2 = resetInstance({ maxHistorySize: 3 });
    for (let i = 0; i < 5; i++) {
      recordMetric(m2, { duration: 10 });
    }
    expect(m2.getMetrics()).toHaveLength(3);
  });
});

describe('wrapQuery 包装', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance();
  });

  it('成功路径：返回数据并记录成功指标', async () => {
    const data = await m.wrapQuery('Q', 'users', 'get', async () => ({
      data: [1, 2, 3],
      cacheHit: true,
    }));

    expect(data).toEqual([1, 2, 3]);
    const metric = m.getMetrics()[0];
    expect(metric.success).toBe(true);
    expect(metric.cacheHit).toBe(true);
    expect(metric.resultCount).toBe(3); // 数组 → 长度
  });

  it('单值结果 resultCount 记为 1', async () => {
    await m.wrapQuery('Q', 'users', 'get', async () => ({ data: { id: 1 }, cacheHit: false }));
    expect(m.getMetrics()[0].resultCount).toBe(1);
  });

  it('失败路径：抛出原始错误并记录失败指标', async () => {
    await expect(
      m.wrapQuery('Q', 'users', 'get', async () => {
        throw new Error('boom');
      })
    ).rejects.toThrow('boom');

    const metric = m.getMetrics()[0];
    expect(metric.success).toBe(false);
    expect(metric.errorMessage).toBe('boom');
    expect(metric.resultCount).toBe(0);
  });
});

describe('过滤查询', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance({ slowQueryThreshold: 500 });
  });

  it('getSlowQueries 只返回超阈值指标', () => {
    recordMetric(m, { duration: 100 });
    recordMetric(m, { duration: 900 });
    recordMetric(m, { duration: 1000 });

    const slow = m.getSlowQueries();
    expect(slow).toHaveLength(2);
    expect(slow.every((x) => x.duration > 500)).toBe(true);
  });

  it('getFailedQueries 只返回失败指标', () => {
    recordMetric(m, { success: true });
    recordMetric(m, { success: false, errorMessage: 'x' });

    expect(m.getFailedQueries()).toHaveLength(1);
    expect(m.getFailedQueries()[0].errorMessage).toBe('x');
  });

  it('getRecentMetrics 返回最后 N 条', () => {
    for (let i = 0; i < 10; i++) {
      recordMetric(m, { duration: 10 });
    }
    expect(m.getRecentMetrics(3)).toHaveLength(3);
  });
});

describe('getStats 统计', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance({ slowQueryThreshold: 500 });
  });

  it('空指标返回零值统计', () => {
    const s = m.getStats();
    expect(s).toEqual({
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      cacheHitRate: 0,
      slowQueries: 0,
      slowQueryThreshold: 500,
    });
  });

  it('混合指标统计数值精确', () => {
    // durations: 100, 300, 900(fail, slow) → avg = 1300/3
    recordMetric(m, { duration: 100, cacheHit: false });
    recordMetric(m, { duration: 300, cacheHit: true });
    recordMetric(m, { duration: 900, success: false });

    const s = m.getStats();
    expect(s.totalQueries).toBe(3);
    expect(s.successfulQueries).toBe(2);
    expect(s.failedQueries).toBe(1);
    expect(s.averageDuration).toBeCloseTo(1300 / 3, 5);
    expect(s.minDuration).toBe(100);
    expect(s.maxDuration).toBe(900);
    expect(s.cacheHitRate).toBeCloseTo(1 / 3, 5);
    expect(s.slowQueries).toBe(1);
  });
});

describe('getStatsByTable / getStatsByOperation', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance({ slowQueryThreshold: 500 });
  });

  it('按表分组：每表独立统计', () => {
    recordMetric(m, { table: 'users', duration: 100 });
    recordMetric(m, { table: 'users', duration: 200, cacheHit: true });
    recordMetric(m, { table: 'nodes', duration: 50 });

    const byTable = m.getStatsByTable();
    expect(byTable.size).toBe(2);

    const users = byTable.get('users')!;
    expect(users.totalQueries).toBe(2);
    expect(users.averageDuration).toBe(150);
    expect(users.cacheHitRate).toBeCloseTo(0.5, 5);

    const nodes = byTable.get('nodes')!;
    expect(nodes.totalQueries).toBe(1);
  });

  it('按操作分组：每操作独立统计', () => {
    recordMetric(m, { operation: 'get', duration: 100 });
    recordMetric(m, { operation: 'add', duration: 400 });

    const byOp = m.getStatsByOperation();
    expect(byOp.size).toBe(2);
    expect(byOp.get('get')!.totalQueries).toBe(1);
    expect(byOp.get('add')!.totalQueries).toBe(1);
  });
});

describe('订阅通知', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance();
  });

  it('endQuery 触发订阅者回调，退订后不再触发', () => {
    const received: QueryMetric[] = [];
    const unsubscribe = m.subscribe((metric) => received.push(metric));

    recordMetric(m, { duration: 10 });
    expect(received).toHaveLength(1);

    unsubscribe();
    recordMetric(m, { duration: 10 });
    expect(received).toHaveLength(1);
  });

  it('订阅者抛错不影响主流程', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    m.subscribe(() => {
      throw new Error('subscriber crash');
    });

    expect(() => recordMetric(m, { duration: 10 })).not.toThrow();
    expect(m.getMetrics()).toHaveLength(1);
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('清理', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance();
  });

  it('clearMetrics 清空全部', () => {
    recordMetric(m, { duration: 10 });
    m.clearMetrics();
    expect(m.getMetrics()).toHaveLength(0);
  });

  it('clearOldMetrics 只清超龄指标', () => {
    // fake timers 冻结 Date.now()，直接改 timestamp 模拟 2h 前的旧指标
    recordMetric(m, { duration: 10 });
    m.getMetrics()[0].timestamp = Date.now() - 7200_000;
    recordMetric(m, { duration: 10 }); // timestamp = 当前冻结时刻

    m.clearOldMetrics(3600_000); // 清 1h 前的
    expect(m.getMetrics()).toHaveLength(1);
  });

  it('自动清理定时器按 interval 触发（fake timers）', () => {
    // autoCleanup 定时器在构造器中创建；不调用 stopAutoCleanup 以保留定时器
    (QueryMonitor as unknown as { instance: QueryMonitor | undefined }).instance = undefined;
    const m2 = QueryMonitor.getInstance({ autoCleanup: true, cleanupInterval: 1000 });

    recordMetric(m2, { duration: 10 });
    m2.getMetrics()[0].timestamp = Date.now() - 7200_000; // 构造 2h 前的旧指标

    vi.advanceTimersByTime(1000);
    expect(m2.getMetrics()).toHaveLength(0);
    m2.stopAutoCleanup(); // 清理定时器，避免泄漏到下一个用例
  });

  it('stopAutoCleanup 后定时器不再触发', () => {
    const m2 = resetInstance({ autoCleanup: true, cleanupInterval: 1000 });
    recordMetric(m2, { duration: 10 });
    m2.getMetrics()[0].timestamp = Date.now() - 7200_000;

    m2.stopAutoCleanup();
    vi.advanceTimersByTime(5000);
    expect(m2.getMetrics()).toHaveLength(1);
  });
});

describe('导入导出与报告', () => {
  let m: QueryMonitor;

  beforeEach(() => {
    m = resetInstance();
  });

  it('exportMetrics → importMetrics 往返一致', () => {
    recordMetric(m, { duration: 42 });
    const json = m.exportMetrics();
    expect(JSON.parse(json)).toHaveLength(1);

    m.clearMetrics();
    expect(m.getMetrics()).toHaveLength(0);

    m.importMetrics(json);
    expect(m.getMetrics()).toHaveLength(1);
    expect(m.getMetrics()[0].duration).toBe(42);
  });

  it('importMetrics 非法 JSON 不抛错且保留原数据', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    recordMetric(m, { duration: 10 });

    m.importMetrics('{invalid json');
    expect(m.getMetrics()).toHaveLength(1);
    expect(errSpy).toHaveBeenCalled();
  });

  it('generateReport 包含关键统计段', () => {
    recordMetric(m, { table: 'users', operation: 'get', duration: 100 });
    const report = m.generateReport();

    expect(report).toContain('Query Performance Report');
    expect(report).toContain('Total Queries: 1');
    expect(report).toContain('By Table');
    expect(report).toContain('By Operation');
    expect(report).toContain('users');
  });

  it('便捷函数 monitorQuery/getQueryStats/generatePerformanceReport 可用', async () => {
    const data = await monitorQuery('Q', 't', 'get', async () => ({ data: 'ok', cacheHit: false }));
    expect(data).toBe('ok');

    const stats = getQueryStats();
    expect(stats.totalQueries).toBeGreaterThanOrEqual(1);

    expect(generatePerformanceReport()).toContain('Query Performance Report');
  });
});
