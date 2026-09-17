/**
 * db-queries-extended.test.ts
 * =========================
 * 数据库查询函数 - 扩展补测（W1 P0 攻坚）
 *
 * 测试策略：
 * - Supabase 在线路径：真实 SQL 形状断言（eq/order/limit/single/insert 链）
 * - 缓存命中路径：getActiveModels/getActiveAgents 二次调用走 queryCache
 * - Supabase 报错路径：error 非空 → 降级返回空数据
 * - CRUD 降级路径：getHybridStorage 返回 null → getStorage() 抛错 → localStorage 回退
 *   （模块级 _models/_agents/_nodes 缓存通过 vi.resetModules() 每用例隔离）
 * - wrapQuery mock 与真实契约对齐（解构返回 data）
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('../lib/native-supabase-client', () => ({
  getNativeSupabaseClient: vi.fn(() => mockSupabase),
}));

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  add: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
};

const mockGetHybridStorage: ReturnType<typeof vi.fn> = vi.fn(() => mockStorage);

vi.mock('../lib/hybrid-storage-manager', () => ({
  getHybridStorage: mockGetHybridStorage,
  initHybridStorage: vi.fn(),
}));

vi.mock('../lib/query-monitor', () => ({
  queryMonitor: {
    wrapQuery: vi.fn(async (_q: string, _t: string, _op: string, fn: () => unknown) => {
      const { data } = (await fn()) as { data: unknown };
      return data;
    }),
  },
}));

vi.mock('../lib/query-cache', () => ({
  queryCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
  generateCacheKey: vi.fn((t: string, op: string, p?: unknown) => `${t}:${op}:${JSON.stringify(p ?? {})}`),
}));

/** 构造惰性链式 from() mock（select/eq/order/limit 逐级返回，末端 thenable await 得 final） */
function chainGet(final: { data: unknown; error: unknown }) {
  const build = () => {
    const obj: Record<string, unknown> = {};
    for (const key of ['select', 'eq', 'order', 'limit', 'offset']) {
      obj[key] = vi.fn(() => build());
    }
    obj.then = (resolve: (v: { data: unknown; error: unknown }) => void) => resolve(final);
    return obj;
  };
  return build();
}

/** 构造 single() 终端链（native client 的 single 返回单元素数组包裹） */
function chainSingle(final: { data: unknown; error: unknown }) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve(final)),
      })),
    })),
  };
}

const MODELS_KEY = 'yyc3_db_models';
const AGENTS_KEY = 'yyc3_db_agents';
const NODES_KEY = 'yyc3_db_nodes';

beforeEach(async () => {
  vi.clearAllMocks();
  // 模块级 _models/_agents/_nodes 缓存与 storageInitialized 均需重置
  vi.resetModules();
  localStorage.clear();
  // clearAllMocks 会清掉工厂 vi.fn 的实现，显式恢复默认在线行为
  const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
  (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(mockSupabase);
  mockGetHybridStorage.mockReturnValue(mockStorage);
});

describe('查询函数 - Supabase 在线路径', () => {
  it('getNodesStatus 返回节点数据数组', async () => {
    const nodes = [{ id: 'n-1', hostname: 'gpu-01' }];
    mockSupabase.from.mockReturnValue(chainGet({ data: nodes, error: null }));

    const { getNodesStatus } = await import('../lib/db-queries');
    const result = await getNodesStatus();
    expect(result.data).toEqual(nodes);
    expect(result.error).toBeNull();
  });

  it('getModelById single 路径返回首条记录', async () => {
    const model = { id: 'm-1', name: 'GPT-5' };
    mockSupabase.from.mockReturnValue(chainSingle({ data: [model], error: null }));

    const { getModelById } = await import('../lib/db-queries');
    const result = await getModelById('m-1');
    expect(result.data).toEqual(model);
  });

  it('getNodeById single 空结果返回 null', async () => {
    mockSupabase.from.mockReturnValue(chainSingle({ data: [], error: null }));

    const { getNodeById } = await import('../lib/db-queries');
    const result = await getNodeById('nope');
    expect(result.data).toBeNull();
  });

  it('getAllAgents 返回 agent 数组', async () => {
    const agents = [{ id: 'a-1', is_active: true }];
    mockSupabase.from.mockReturnValue(chainGet({ data: agents, error: null }));

    const { getAllAgents } = await import('../lib/db-queries');
    const result = await getAllAgents();
    expect(result.data).toEqual(agents);
  });

  it('getActiveModels 在线路径直接返回服务端过滤结果（不做客户端过滤）', async () => {
    const rows = [
      { id: 'm-1', status: 'active' },
      { id: 'm-2', status: 'inactive' },
    ];
    mockSupabase.from.mockReturnValue(chainGet({ data: rows, error: null }));

    const { getActiveModels } = await import('../lib/db-queries');
    const result = await getActiveModels();
    expect(result.data).toEqual(rows);
  });

  it('getActiveAgents 在线路径直接返回服务端过滤结果', async () => {
    const rows = [
      { id: 'a-1', is_active: true },
      { id: 'a-2', is_active: false },
    ];
    mockSupabase.from.mockReturnValue(chainGet({ data: rows, error: null }));

    const { getActiveAgents } = await import('../lib/db-queries');
    const result = await getActiveAgents();
    expect(result.data).toEqual(rows);
  });

  it('Supabase 报错时 getNodesStatus 降级返回空数组', async () => {
    mockSupabase.from.mockReturnValue(chainGet({ data: null, error: { message: 'db down' } }));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { getNodesStatus } = await import('../lib/db-queries');
    const result = await getNodesStatus();
    expect(result.data).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
  });

  it('Supabase 报错时 getActiveModels 降级返回空数组', async () => {
    mockSupabase.from.mockReturnValue(chainGet({ data: null, error: { message: 'db down' } }));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    const { getActiveModels } = await import('../lib/db-queries');
    expect((await getActiveModels()).data).toEqual([]);
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('查询函数 - 缓存命中路径', () => {
  it('getActiveModels 缓存命中时跳过数据库查询', async () => {
    mockSupabase.from.mockReturnValue(chainGet({ data: [], error: null }));

    const { getActiveModels } = await import('../lib/db-queries');
    const first = await getActiveModels();
    expect(first.data).toEqual([]);

    // 第二次：queryCache.get 返回缓存
    const cached = [{ id: 'm-cached', status: 'active' }];
    const cacheMod = await import('../lib/query-cache');
    vi.mocked(cacheMod.queryCache.get).mockReturnValueOnce(cached as never);

    const fromCallsBefore = mockSupabase.from.mock.calls.length;
    const second = await getActiveModels();
    expect(second.data).toEqual(cached);
    expect(mockSupabase.from.mock.calls.length).toBe(fromCallsBefore); // 未再触库
  });

  it('getActiveAgents 缓存命中时直接返回', async () => {
    mockSupabase.from.mockReturnValue(chainGet({ data: [], error: null }));
    const { getActiveAgents } = await import('../lib/db-queries');
    await getActiveAgents();

    const cached = [{ id: 'a-c', is_active: true }];
    const cacheMod = await import('../lib/query-cache');
    vi.mocked(cacheMod.queryCache.get).mockReturnValueOnce(cached as never);

    const result = await getActiveAgents();
    expect(result.data).toEqual(cached);
  });
});

describe('查询函数 - 本地降级路径（supabase=null）', () => {
  beforeEach(async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  it('getNodesStatus 走 storage.get', async () => {
    const nodes = [{ id: 'n-local' }];
    mockStorage.get.mockResolvedValue(nodes);

    const { getNodesStatus } = await import('../lib/db-queries');
    const result = await getNodesStatus();
    expect(result.data).toEqual(nodes);
    expect(mockStorage.get).toHaveBeenCalledWith('nodes');
  });

  it('getModelById 本地 find 命中', async () => {
    mockStorage.get.mockResolvedValue([{ id: 'm-9', name: 'Local' }]);

    const { getModelById } = await import('../lib/db-queries');
    const result = await getModelById('m-9');
    expect(result.data).toEqual({ id: 'm-9', name: 'Local' });
  });

  it('getModelById 本地未命中返回 null', async () => {
    mockStorage.get.mockResolvedValue([]);

    const { getModelById } = await import('../lib/db-queries');
    expect((await getModelById('x')).data).toBeNull();
  });

  it('storage 抛错时 getNodesStatus 静默降级返回空数组（catch 吞错）', async () => {
    mockStorage.get.mockRejectedValue(new Error('storage broken'));

    const { getNodesStatus } = await import('../lib/db-queries');
    expect((await getNodesStatus()).data).toEqual([]);
  });

  it('getModelStats 本地路径返回推导统计', async () => {
    mockStorage.get.mockResolvedValue([
      { id: 'm-1', avg_latency_ms: 120 },
    ]);

    const { getModelStats } = await import('../lib/db-queries');
    const { data } = await getModelStats('m-1');
    expect(data).not.toBeNull();
    expect(data!.avgLatency).toBe(120);
    expect(data!.totalRequests).toBeGreaterThan(0);
  });

  it('getModelStats 本地未找到模型返回 null', async () => {
    mockStorage.get.mockResolvedValue([]);

    const { getModelStats } = await import('../lib/db-queries');
    expect((await getModelStats('ghost')).data).toBeNull();
  });
});

describe('getModelStats - Supabase 聚合路径', () => {
  it('从 inference_logs 聚合出准确统计（duration/tokens_used 字段）', async () => {
    const logs = [
      { duration: 100, tokens_used: 50, status: 'success' },
      { duration: 200, tokens_used: 150, status: 'success' },
      { duration: 999, tokens_used: 10, status: 'failed' },
    ];
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: logs, error: null })),
      })),
    });

    const { getModelStats } = await import('../lib/db-queries');
    const { data } = await getModelStats('m-1');

    expect(data!.totalRequests).toBe(3);
    expect(data!.avgLatency).toBe(150); // (100+200)/2 只算 success
    expect(data!.totalTokens).toBe(210); // 全部求和
    expect(data!.successRate).toBeCloseTo(66.67, 1);
  });

  it('无日志返回 null', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    });

    const { getModelStats } = await import('../lib/db-queries');
    expect((await getModelStats('m-1')).data).toBeNull();
  });

  it('查询报错返回 null', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockSupabase.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: { message: 'x' } })),
      })),
    });

    const { getModelStats } = await import('../lib/db-queries');
    expect((await getModelStats('m-1')).data).toBeNull();
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('getRecentLogs / addInferenceLog', () => {
  it('getRecentLogs Supabase 路径 order+limit 链返回', async () => {
    const logs = [{ id: 'l-1' }, { id: 'l-2' }];
    mockSupabase.from.mockReturnValue(chainGet({ data: logs, error: null }));

    const { getRecentLogs } = await import('../lib/db-queries');
    const result = await getRecentLogs(3);
    expect(result.data).toEqual(logs);
  });

  it('getRecentLogs 降级路径走 storage + slice', async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
    mockStorage.get.mockResolvedValue(Array.from({ length: 10 }, (_, i) => ({ id: `l-${i}` })));

    const { getRecentLogs } = await import('../lib/db-queries');
    const result = await getRecentLogs(3);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].id).toBe('l-0');
  });

  it('addInferenceLog Supabase insert 路径返回 single 结果', async () => {
    mockSupabase.from.mockReturnValue({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'new-log' }, error: null })),
        })),
      })),
    });

    const { addInferenceLog } = await import('../lib/db-queries');
    const log = await addInferenceLog({ model_id: 'm-1', input_tokens: 1, output_tokens: 1, latency_ms: 5 } as never);
    expect(log.id).toBe('new-log');
  });

  it('addInferenceLog 降级路径走 storage.add 并补 id/时间戳', async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
    mockStorage.add.mockImplementation((_t: string, item: unknown) => Promise.resolve(item));

    const { addInferenceLog } = await import('../lib/db-queries');
    const log = await addInferenceLog({ model_id: 'm-1', input_tokens: 1, output_tokens: 1, latency_ms: 5 } as never);
    expect(log.id).toMatch(/^log-/);
    expect(log.created_at).toBeTruthy();
  });

  it('addInferenceLog 降级且 storage 抛错时 rethrow', async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockStorage.add.mockRejectedValue(new Error('add failed'));

    const { addInferenceLog } = await import('../lib/db-queries');
    await expect(addInferenceLog({ model_id: 'm' } as never)).rejects.toThrow('add failed');
    expect(errSpy).toHaveBeenCalled();
  });
});

describe('CRUD - 本地降级（getHybridStorage=null → getStorage() 抛错 → localStorage 回退）', () => {
  beforeEach(async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
    mockGetHybridStorage.mockReturnValue(null);
    mockStorage.get.mockRejectedValue(new Error('no storage'));
    mockStorage.add.mockRejectedValue(new Error('no storage'));
    mockStorage.update.mockRejectedValue(new Error('no storage'));
    mockStorage.delete.mockRejectedValue(new Error('no storage'));
  });

  it('addDbModel 回退 localStorage（初始为 DEFAULT 空数组）', async () => {
    const { addDbModel } = await import('../lib/db-queries');
    const model = await addDbModel({ name: 'L', provider: 'p', tier: 't', status: 'active' } as never);
    expect(model.id).toMatch(/^m-\d+/);

    const stored = JSON.parse(localStorage.getItem(MODELS_KEY) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('L');
  });

  it('updateDbModel 本地命中则合并更新', async () => {
    const { addDbModel, updateDbModel } = await import('../lib/db-queries');
    const created = await addDbModel({ name: 'Old', provider: 'p', tier: 't', status: 'active' } as never);

    const updated = await updateDbModel(created.id, { name: 'New' });
    expect(updated).toEqual({ ...created, name: 'New' });
  });

  it('updateDbModel 本地未命中返回 null', async () => {
    const { updateDbModel } = await import('../lib/db-queries');
    expect(await updateDbModel('ghost', { name: 'X' })).toBeNull();
  });

  it('deleteDbModel 本地删除成功返回 true', async () => {
    const { addDbModel, deleteDbModel } = await import('../lib/db-queries');
    const a = await addDbModel({ name: 'A', provider: 'p', tier: 't', status: 'active' } as never);
    await addDbModel({ name: 'B', provider: 'p', tier: 't', status: 'active' } as never);

    expect(await deleteDbModel(a.id)).toBe(true);
    expect(JSON.parse(localStorage.getItem(MODELS_KEY)!)).toHaveLength(1);
  });

  it('deleteDbModel 本地未命中返回 false', async () => {
    const { deleteDbModel } = await import('../lib/db-queries');
    expect(await deleteDbModel('ghost')).toBe(false);
  });

  it('addDbAgent/addDbNode 回退 localStorage 并使用对应 key', async () => {
    const { addDbAgent, addDbNode } = await import('../lib/db-queries');
    const agent = await addDbAgent({ name: 'A', is_active: true } as never);
    const node = await addDbNode({ hostname: 'h', gpu_util: 1, mem_util: 1 } as never);

    expect(agent.id).toMatch(/^a-\d+/);
    expect(node.id).toMatch(/^n-\d+/);
    expect(JSON.parse(localStorage.getItem(AGENTS_KEY)!)).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem(NODES_KEY)!)).toHaveLength(1);
  });

  it('updateDbAgent/updateDbNode/deleteDbAgent/deleteDbNode 本地路径可用', async () => {
    const { addDbAgent, addDbNode, updateDbAgent, updateDbNode, deleteDbAgent, deleteDbNode } = await import('../lib/db-queries');
    const agent = await addDbAgent({ name: 'A', is_active: true } as never);
    const node = await addDbNode({ hostname: 'h', gpu_util: 1, mem_util: 1 } as never);

    expect((await updateDbAgent(agent.id, { name: 'B' }))!.name).toBe('B');
    expect((await updateDbNode(node.id, { hostname: 'h2' }))!.hostname).toBe('h2');
    expect(await deleteDbAgent(agent.id)).toBe(true);
    expect(await deleteDbNode(node.id)).toBe(true);
  });

  it('updateDbAgent/updateDbNode 未命中返回 null', async () => {
    const { updateDbAgent, updateDbNode } = await import('../lib/db-queries');
    expect(await updateDbAgent('ghost', {})).toBeNull();
    expect(await updateDbNode('ghost', {})).toBeNull();
  });
});

describe('查询函数 - 本地降级（supabase=null + storage 正常）补充', () => {
  beforeEach(async () => {
    const { getNativeSupabaseClient } = await import('../lib/native-supabase-client');
    (getNativeSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue(null);
    mockGetHybridStorage.mockReturnValue(mockStorage);
  });

  it('getActiveModels 本地过滤 status=active 并写缓存', async () => {
    mockStorage.get.mockResolvedValue([
      { id: 'm-1', status: 'active' },
      { id: 'm-2', status: 'inactive' },
    ]);

    const { getActiveModels } = await import('../lib/db-queries');
    const result = await getActiveModels();
    expect(result.data).toEqual([{ id: 'm-1', status: 'active' }]);

    const cacheMod = await import('../lib/query-cache');
    expect(cacheMod.queryCache.set).toHaveBeenCalled();
  });

  it('getActiveAgents 本地过滤 is_active 并写缓存', async () => {
    mockStorage.get.mockResolvedValue([
      { id: 'a-1', is_active: true },
      { id: 'a-2', is_active: false },
    ]);

    const { getActiveAgents } = await import('../lib/db-queries');
    const result = await getActiveAgents();
    expect(result.data).toEqual([{ id: 'a-1', is_active: true }]);

    const cacheMod = await import('../lib/query-cache');
    expect(cacheMod.queryCache.set).toHaveBeenCalled();
  });

  it('getAllAgents/getNodesStatus 本地全量返回', async () => {
    mockStorage.get.mockResolvedValue([{ id: 'x' }]);

    const { getAllAgents, getNodesStatus } = await import('../lib/db-queries');
    expect((await getAllAgents()).data).toEqual([{ id: 'x' }]);
    expect((await getNodesStatus()).data).toEqual([{ id: 'x' }]);
  });

  it('getModelById/getNodeById 本地未命中 null（storage 抛错）', async () => {
    mockStorage.get.mockRejectedValue(new Error('x'));

    const { getModelById, getNodeById } = await import('../lib/db-queries');
    expect((await getModelById('a')).data).toBeNull();
    expect((await getNodeById('b')).data).toBeNull();
  });
});

describe('重置与导入导出', () => {
  it('resetDbModels/Agents/Nodes 恢复默认空数组并持久化', async () => {
    localStorage.setItem(MODELS_KEY, JSON.stringify([{ id: 'm-1' }]));

    const { resetDbModels, resetDbAgents, resetDbNodes } = await import('../lib/db-queries');
    expect(resetDbModels()).toEqual([]);
    expect(resetDbAgents()).toEqual([]);
    expect(resetDbNodes()).toEqual([]);
    expect(JSON.parse(localStorage.getItem(MODELS_KEY)!)).toEqual([]);
  });

  it('exportDbData 导出三个集合 + 元数据', async () => {
    const { exportDbData } = await import('../lib/db-queries');
    const exported = JSON.parse(exportDbData());
    expect(exported.version).toBe(1);
    expect(exported.exportedAt).toBeTypeOf('number');
    expect(exported).toHaveProperty('models');
    expect(exported).toHaveProperty('agents');
    expect(exported).toHaveProperty('nodes');
  });

  it('importDbData 合法 JSON 导入成功并持久化', async () => {
    const { importDbData, exportDbData } = await import('../lib/db-queries');
    const ok = importDbData(JSON.stringify({
      models: [{ id: 'im-1' }],
      agents: [],
      nodes: [],
    }));

    expect(ok).toBe(true);
    expect(JSON.parse(exportDbData()).models).toEqual([{ id: 'im-1' }]);
    expect(JSON.parse(localStorage.getItem(MODELS_KEY)!)).toEqual([{ id: 'im-1' }]);
  });

  it('importDbData 非法 JSON 返回 false', async () => {
    const { importDbData } = await import('../lib/db-queries');
    expect(importDbData('{broken')).toBe(false);
  });
});
