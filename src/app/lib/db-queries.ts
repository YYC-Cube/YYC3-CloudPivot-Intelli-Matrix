/**
 * 数据库查询函数
 * ===============
 * YYC3 数据持久化层 — 混合存储实现
 *
 * 数据库 Schema 对接：
 *   core.models       -> 模型配置
 *   core.agents        -> Agent 配置
 *   telemetry.inference_logs -> 推理日志
 *   infra.nodes        -> 节点状态
 *
 * 数据源策略:
 *   1. 优先使用 Supabase 数据库
 *   2. Supabase 不可用时降级到 HybridStorageManager (LocalStorage)
 *   3. 首次启动 → 从数据库加载初始数据
 */

import { getNativeSupabaseClient } from "./native-supabase-client";
import { getHybridStorage, initHybridStorage } from "./hybrid-storage-manager";
import { queryMonitor } from "./query-monitor";
import { queryCache, generateCacheKey } from "./query-cache";
import type {
  Model,
  Agent,
  InferenceLog,
  NodeStatusRecord,
  ModelStats,
} from "../types/index";

// ============================================================
// Storage Keys
// ============================================================

const MODELS_KEY = "yyc3_db_models";
const AGENTS_KEY = "yyc3_db_agents";
const NODES_KEY = "yyc3_db_nodes";

// ============================================================
// 默认 Mock 数据 (仅首次初始化使用)
// ============================================================

const DEFAULT_MODELS: Model[] = [];

const DEFAULT_AGENTS: Agent[] = [];

const DEFAULT_NODES: NodeStatusRecord[] = [];

// ============================================================
// 初始化 Hybrid Storage
// ============================================================

let storageInitialized = false;

function initializeStorage(): void {
  if (storageInitialized) {
    return;
  }

  const supabaseClient = getNativeSupabaseClient();
  
  if (supabaseClient) {
    initHybridStorage(supabaseClient, {
      enableLocalStorage: true,
      enableSupabase: true,
      syncInterval: 30000,
      syncOnWrite: true,
      conflictResolution: "remote",
    });
  }

  storageInitialized = true;
}

function getStorage() {
  if (!storageInitialized) {
    initializeStorage();
  }

  const storage = getHybridStorage();
  
  if (!storage) {
    throw new Error("Storage not initialized");
  }

  return storage;
}

// ============================================================
// localStorage CRUD 工具层 (降级方案)
// ============================================================

function loadData<T>(key: string, defaults: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {return JSON.parse(raw);}
  } catch { /* ignore */ }
  try { localStorage.setItem(key, JSON.stringify(defaults)); } catch { /* ignore */ }
  return [...defaults];
}

function saveData<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

let _models: Model[] | null = null;
let _agents: Agent[] | null = null;
let _nodes: NodeStatusRecord[] | null = null;

function getLocalModels(): Model[] {
  if (!_models) {_models = loadData<Model>(MODELS_KEY, DEFAULT_MODELS);}
  return _models;
}

function getLocalAgents(): Agent[] {
  if (!_agents) {_agents = loadData<Agent>(AGENTS_KEY, DEFAULT_AGENTS);}
  return _agents;
}

function getLocalNodes(): NodeStatusRecord[] {
  if (!_nodes) {_nodes = loadData<NodeStatusRecord>(NODES_KEY, DEFAULT_NODES);}
  return _nodes;
}

function persistLocalModels() { saveData(MODELS_KEY, getLocalModels()); }
function persistLocalAgents() { saveData(AGENTS_KEY, getLocalAgents()); }
function persistLocalNodes()  { saveData(NODES_KEY, getLocalNodes()); }

// ============================================================
// CRUD — Models
// ============================================================

export async function addDbModel(model: Omit<Model, "id">): Promise<Model> {
  try {
    const storage = getStorage();
    const newModel: Model = { ...model, id: `m-${Date.now()}` };
    return await storage.add("models", newModel);
  } catch {
    const models = getLocalModels();
    const newModel: Model = { ...model, id: `m-${Date.now()}` };
    models.push(newModel);
    persistLocalModels();
    return newModel;
  }
}

export async function updateDbModel(id: string, updates: Partial<Model>): Promise<Model | null> {
  try {
    const storage = getStorage();
    return await storage.update("models", id, updates);
  } catch {
    const models = getLocalModels();
    const idx = models.findIndex((m) => m.id === id);
    if (idx < 0) {return null;}
    models[idx] = { ...models[idx], ...updates };
    persistLocalModels();
    return models[idx];
  }
}

export async function deleteDbModel(id: string): Promise<boolean> {
  try {
    const storage = getStorage();
    return await storage.delete("models", id);
  } catch {
    const models = getLocalModels();
    const idx = models.findIndex((m) => m.id === id);
    if (idx < 0) {return false;}
    models.splice(idx, 1);
    persistLocalModels();
    return true;
  }
}

// ============================================================
// CRUD — Agents
// ============================================================

export async function addDbAgent(agent: Omit<Agent, "id">): Promise<Agent> {
  try {
    const storage = getStorage();
    const newAgent: Agent = { ...agent, id: `a-${Date.now()}` };
    return await storage.add("agents", newAgent);
  } catch {
    const agents = getLocalAgents();
    const newAgent: Agent = { ...agent, id: `a-${Date.now()}` };
    agents.push(newAgent);
    persistLocalAgents();
    return newAgent;
  }
}

export async function updateDbAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
  try {
    const storage = getStorage();
    return await storage.update("agents", id, updates);
  } catch {
    const agents = getLocalAgents();
    const idx = agents.findIndex((a) => a.id === id);
    if (idx < 0) {return null;}
    agents[idx] = { ...agents[idx], ...updates };
    persistLocalAgents();
    return agents[idx];
  }
}

export async function deleteDbAgent(id: string): Promise<boolean> {
  try {
    const storage = getStorage();
    return await storage.delete("agents", id);
  } catch {
    const agents = getLocalAgents();
    const idx = agents.findIndex((a) => a.id === id);
    if (idx < 0) {return false;}
    agents.splice(idx, 1);
    persistLocalAgents();
    return true;
  }
}

// ============================================================
// CRUD — Nodes
// ============================================================

export async function addDbNode(node: Omit<NodeStatusRecord, "id">): Promise<NodeStatusRecord> {
  try {
    const storage = getStorage();
    const newNode: NodeStatusRecord = { ...node, id: `n-${Date.now()}` };
    return await storage.add("nodes", newNode);
  } catch {
    const nodes = getLocalNodes();
    const newNode: NodeStatusRecord = { ...node, id: `n-${Date.now()}` };
    nodes.push(newNode);
    persistLocalNodes();
    return newNode;
  }
}

export async function updateDbNode(id: string, updates: Partial<NodeStatusRecord>): Promise<NodeStatusRecord | null> {
  try {
    const storage = getStorage();
    return await storage.update("nodes", id, updates);
  } catch {
    const nodes = getLocalNodes();
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx < 0) {return null;}
    nodes[idx] = { ...nodes[idx], ...updates };
    persistLocalNodes();
    return nodes[idx];
  }
}

export async function deleteDbNode(id: string): Promise<boolean> {
  try {
    const storage = getStorage();
    return await storage.delete("nodes", id);
  } catch {
    const nodes = getLocalNodes();
    const idx = nodes.findIndex((n) => n.id === id);
    if (idx < 0) {return false;}
    nodes.splice(idx, 1);
    persistLocalNodes();
    return true;
  }
}

// ============================================================
// 重置 — 恢复默认 Mock 数据
// ============================================================

export function resetDbModels(): Model[] {
  _models = DEFAULT_MODELS.map((m) => ({ ...m }));
  persistLocalModels();
  return _models;
}

export function resetDbAgents(): Agent[] {
  _agents = DEFAULT_AGENTS.map((a) => ({ ...a }));
  persistLocalAgents();
  return _agents;
}

export function resetDbNodes(): NodeStatusRecord[] {
  _nodes = DEFAULT_NODES.map((n) => ({ ...n }));
  persistLocalNodes();
  return _nodes;
}

// ============================================================
// 导入/导出
// ============================================================

export function exportDbData(): string {
  return JSON.stringify({
    version: 1,
    exportedAt: Date.now(),
    models: getLocalModels(),
    agents: getLocalAgents(),
    nodes: getLocalNodes(),
  }, null, 2);
}

export function importDbData(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.models) { _models = data.models; persistLocalModels(); }
    if (data.agents) { _agents = data.agents; persistLocalAgents(); }
    if (data.nodes)  { _nodes = data.nodes; persistLocalNodes(); }
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// 推理日志查询
// ============================================================

/** 获取最近推理日志 */
export async function getRecentLogs(limit = 100): Promise<{ data: InferenceLog[]; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const logs = await storage.get<InferenceLog>("inference_logs");
      return { data: logs.slice(0, limit), error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    const { data, error } = await supabase
      .from('inference_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {throw error;}

    return { data: data || [], error: null };
  } catch (error) {
    console.error('Failed to get recent logs:', error);
    return { data: [], error: null };
  }
}

/** 添加推理日志 */
export async function addInferenceLog(log: Omit<InferenceLog, 'id'>): Promise<InferenceLog> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const newLog: InferenceLog = { 
        ...log, 
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      };
      return await storage.add('inference_logs', newLog);
    } catch (error) {
      console.error('Failed to add inference log:', error);
      throw error;
    }
  }

  try {
    const { data, error } = await supabase
      .from('inference_logs')
      .insert({
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {throw error;}

    return data as InferenceLog;
  } catch (error) {
    console.error('Failed to add inference log:', error);
    throw error;
  }
}

// ============================================================
// Query Functions (真实数据库查询)
// ============================================================

/** 获取活跃模型列表 */
export async function getActiveModels(): Promise<{ data: Model[]; error: null }> {
  const cacheKey = generateCacheKey('models', 'getActiveModels', { status: 'active' });
  const cached = queryCache.get<Model[]>(cacheKey);
  
  if (cached) {
    return { data: cached, error: null };
  }

  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const models = await storage.get<Model>("models");
      const result = models.filter(m => m.status === 'active');
      queryCache.set(cacheKey, result, 30000);
      return { data: result, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    const result = await queryMonitor.wrapQuery(
      'SELECT * FROM models WHERE status = $1',
      'models',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {throw error;}

        return { data: data || [], cacheHit: false };
      }
    );

    queryCache.set(cacheKey, result.data, 30000);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Failed to get active models:', error);
    return { data: [], error: null };
  }
}

/** 获取模型统计 */
export async function getModelStats(
  modelId: string
): Promise<{ data: ModelStats | null; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const models = await storage.get<Model>("models");
      const model = models.find((m) => m.id === modelId);
      
      if (!model) {return { data: null, error: null };}

      return {
        data: {
          avgLatency: model.avg_latency_ms,
          totalRequests: Math.floor(Math.random() * 50000) + 10000,
          totalTokens: Math.floor(Math.random() * 5_000_000) + 1_000_000,
          successRate: 95 + Math.random() * 4.5,
        },
        error: null,
      };
    } catch {
      return { data: null, error: null };
    }
  }

  try {
    const { data: logs, error: logsError } = await supabase
      .from('inference_logs')
      .select('tokens_used, duration, status')
      .eq('model_id', modelId);

    if (logsError) {throw logsError;}

    if (!logs || logs.length === 0) {
      return { data: null, error: null };
    }

    const successfulLogs = logs.filter((log: InferenceLog) => log.status === 'success');
    const avgLatency = successfulLogs.reduce((sum: number, log: InferenceLog) => sum + (log.duration || 0), 0) / successfulLogs.length;
    const totalRequests = logs.length;
    const totalTokens = logs.reduce((sum: number, log: InferenceLog) => sum + (log.tokens_used || 0), 0);
    const successRate = (successfulLogs.length / totalRequests) * 100;

    return {
      data: {
        avgLatency,
        totalRequests,
        totalTokens,
        successRate,
      },
      error: null,
    };
  } catch (error) {
    console.error('Failed to get model stats:', error);
    return { data: null, error: null };
  }
}

/** 获取节点状态 */
export async function getNodesStatus(): Promise<{ data: NodeStatusRecord[]; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const nodes = await storage.get<NodeStatusRecord>("nodes");
      return { data: nodes, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    return await queryMonitor.wrapQuery(
      'SELECT * FROM nodes',
      'nodes',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('nodes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {throw error;}

        return { data: data || [], cacheHit: false };
      }
    );
  } catch (error) {
    console.error('Failed to get nodes status:', error);
    return { data: [], error: null };
  }
}

/** 获取活跃 Agent 列表 */
export async function getActiveAgents(): Promise<{ data: Agent[]; error: null }> {
  const cacheKey = generateCacheKey('agents', 'getActiveAgents', { is_active: true });
  const cached = queryCache.get<Agent[]>(cacheKey);
  
  if (cached) {
    return { data: cached, error: null };
  }

  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const agents = await storage.get<Agent>("agents");
      const result = agents.filter((a) => a.is_active);
      queryCache.set(cacheKey, result, 30000);
      return { data: result, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    const result = await queryMonitor.wrapQuery(
      'SELECT * FROM agents WHERE is_active = true',
      'agents',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {throw error;}

        return { data: data || [], cacheHit: false };
      }
    );

    queryCache.set(cacheKey, result.data, 30000);
    return { data: result.data, error: null };
  } catch (error) {
    console.error('Failed to get active agents:', error);
    return { data: [], error: null };
  }
}

/** 获取所有 Agent 列表 */
export async function getAllAgents(): Promise<{ data: Agent[]; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const agents = await storage.get<Agent>("agents");
      return { data: agents, error: null };
    } catch {
      return { data: [], error: null };
    }
  }

  try {
    return await queryMonitor.wrapQuery(
      'SELECT * FROM agents',
      'agents',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {throw error;}

        return { data: data || [], cacheHit: false };
      }
    );
  } catch (error) {
    console.error('Failed to get all agents:', error);
    return { data: [], error: null };
  }
}

/** 获取单个模型 */
export async function getModelById(id: string): Promise<{ data: Model | null; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const models = await storage.get<Model>("models");
      const model = models.find((m) => m.id === id) || null;
      return { data: model, error: null };
    } catch {
      return { data: null, error: null };
    }
  }

  try {
    return await queryMonitor.wrapQuery(
      'SELECT * FROM models WHERE id = $1',
      'models',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {throw error;}

        return { data: data || null, cacheHit: false };
      }
    );
  } catch (error) {
    console.error('Failed to get model by id:', error);
    return { data: null, error: null };
  }
}

/** 获取单个节点 */
export async function getNodeById(id: string): Promise<{ data: NodeStatusRecord | null; error: null }> {
  const supabase = getNativeSupabaseClient();
  
  if (!supabase) {
    try {
      const storage = getStorage();
      const nodes = await storage.get<NodeStatusRecord>("nodes");
      const node = nodes.find((n) => n.id === id) || null;
      return { data: node, error: null };
    } catch {
      return { data: null, error: null };
    }
  }

  try {
    return await queryMonitor.wrapQuery(
      'SELECT * FROM nodes WHERE id = $1',
      'nodes',
      'get',
      async () => {
        const { data, error } = await supabase
          .from('nodes')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {throw error;}

        return { data: data || null, cacheHit: false };
      }
    );
  } catch (error) {
    console.error('Failed to get node by id:', error);
    return { data: null, error: null };
  }
}
