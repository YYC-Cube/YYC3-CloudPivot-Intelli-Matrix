/**
 * 数据库查询函数
 * ===============
 * YYC³ 数据持久化层 - Mock 实现
 *
 * 数据库 Schema 对接：
 *   core.models       → 模型配置
 *   core.agents        → Agent 配置
 *   telemetry.inference_logs → 推理日志
 *
 * 接入 Supabase 后，将 mock 返回替换为 supabase.from() 调用
 */

// import { supabase } from "./supabaseClient";

// ============================================================
// 类型定义 — 从全局类型中心导入
// ============================================================

import type {
  Model,
  Agent,
  InferenceLog,
  NodeStatusRecord,
  ModelStats,
} from "../types";

// Re-export for backward compatibility
export type { Model, Agent, InferenceLog };

/**
 * NodeStatus 类型别名 — 保持向后兼容
 * 新代码应使用 NodeStatusRecord (from types/index.ts)
 */
export type NodeStatus = NodeStatusRecord;

// ============================================================
// Mock 数据
// ============================================================

const MOCK_MODELS: Model[] = [
  { id: "m1", name: "LLaMA-70B", provider: "Meta", tier: "primary", avg_latency_ms: 45, throughput: 3200, created_at: "2025-12-01" },
  { id: "m2", name: "Qwen-72B", provider: "Alibaba", tier: "primary", avg_latency_ms: 42, throughput: 3500, created_at: "2025-11-15" },
  { id: "m3", name: "DeepSeek-V3", provider: "DeepSeek", tier: "primary", avg_latency_ms: 55, throughput: 2800, created_at: "2026-01-20" },
  { id: "m4", name: "GLM-4", provider: "Zhipu", tier: "secondary", avg_latency_ms: 38, throughput: 4100, created_at: "2025-10-08" },
  { id: "m5", name: "Mixtral-8x7B", provider: "Mistral", tier: "secondary", avg_latency_ms: 32, throughput: 4800, created_at: "2025-09-20" },
];

const MOCK_AGENTS: Agent[] = [
  { id: "a1", name: "orchestrator", name_cn: "编排器", role: "core", description: "任务调度与编排", is_active: true },
  { id: "a2", name: "retriever", name_cn: "检索器", role: "rag", description: "向量检索与文档召回", is_active: true },
  { id: "a3", name: "evaluator", name_cn: "评估器", role: "quality", description: "输出质量评估", is_active: true },
  { id: "a4", name: "router", name_cn: "路由器", role: "routing", description: "模型路由与负载均衡", is_active: true },
  { id: "a5", name: "monitor", name_cn: "监控器", role: "ops", description: "系统监控与告警", is_active: true },
];

const generateMockLogs = (limit: number): InferenceLog[] => {
  const logs: InferenceLog[] = [];
  const statuses: InferenceLog["status"][] = ["success", "success", "success", "success", "error", "timeout"];
  for (let i = 0; i < limit; i++) {
    const modelIdx = Math.floor(Math.random() * MOCK_MODELS.length);
    const agentIdx = Math.floor(Math.random() * MOCK_AGENTS.length);
    const now = new Date();
    now.setMinutes(now.getMinutes() - i * 2);
    logs.push({
      id: `log-${String(i).padStart(5, "0")}`,
      model_id: MOCK_MODELS[modelIdx].id,
      agent_id: MOCK_AGENTS[agentIdx].id,
      latency_ms: Math.floor(20 + Math.random() * 80),
      tokens_in: Math.floor(100 + Math.random() * 2000),
      tokens_out: Math.floor(50 + Math.random() * 4000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      created_at: now.toISOString(),
    });
  }
  return logs;
};

const MOCK_NODES: NodeStatus[] = [
  { id: "n1", hostname: "GPU-A100-01", gpu_util: 87, mem_util: 72, temp_celsius: 68, model_deployed: "LLaMA-70B", active_tasks: 128, status: "active" },
  { id: "n2", hostname: "GPU-A100-02", gpu_util: 92, mem_util: 85, temp_celsius: 74, model_deployed: "Qwen-72B", active_tasks: 156, status: "active" },
  { id: "n3", hostname: "GPU-A100-03", gpu_util: 98, mem_util: 94, temp_celsius: 82, model_deployed: "DeepSeek-V3", active_tasks: 89, status: "warning" },
  { id: "n4", hostname: "GPU-H100-01", gpu_util: 65, mem_util: 58, temp_celsius: 55, model_deployed: "GLM-4", active_tasks: 210, status: "active" },
  { id: "n5", hostname: "GPU-H100-02", gpu_util: 78, mem_util: 66, temp_celsius: 62, model_deployed: "Mixtral", active_tasks: 178, status: "active" },
  { id: "n6", hostname: "GPU-H100-03", gpu_util: 0, mem_util: 12, temp_celsius: 32, model_deployed: "-", active_tasks: 0, status: "inactive" },
  { id: "n7", hostname: "TPU-v4-01", gpu_util: 82, mem_util: 70, temp_celsius: 58, model_deployed: "LLaMA-70B", active_tasks: 95, status: "active" },
  { id: "n8", hostname: "TPU-v4-02", gpu_util: 55, mem_util: 48, temp_celsius: 50, model_deployed: "Qwen-72B", active_tasks: 134, status: "active" },
];

// ============================================================
// 查询接口
// ============================================================

/**
 * 查询活跃模型列表
 * SQL: SELECT * FROM core.models WHERE tier IN ('primary','secondary') ORDER BY avg_latency_ms ASC
 */
export async function getActiveModels(): Promise<{ data: Model[]; error: null }> {
  // TODO: 接入 Supabase 后替换为
  // return supabase.from('core.models').select('*').in('tier', ['primary','secondary']).order('avg_latency_ms')
  return { data: MOCK_MODELS, error: null };
}

/**
 * 查询最近推理日志
 * SQL: SELECT * FROM telemetry.inference_logs ORDER BY created_at DESC LIMIT $1
 */
export async function getRecentLogs(limit: number = 100): Promise<{ data: InferenceLog[]; error: null }> {
  return { data: generateMockLogs(limit), error: null };
}

/**
 * 查询模型性能统计（24 小时）
 * SQL: SELECT model_id, AVG(latency_ms), COUNT(*), SUM(tokens_out) FROM telemetry.inference_logs
 *      WHERE created_at > NOW() - INTERVAL '24 hours' AND model_id = $1 GROUP BY model_id
 */
export async function getModelStats(modelId: string): Promise<{
  data: ModelStats | null;
  error: null;
}> {
  const model = MOCK_MODELS.find(m => m.id === modelId);
  if (!model) {return { data: null, error: null };}
  return {
    data: {
      avgLatency: model.avg_latency_ms,
      totalRequests: Math.floor(10000 + Math.random() * 50000),
      totalTokens: Math.floor(1000000 + Math.random() * 5000000),
      successRate: 96.5 + Math.random() * 3,
    },
    error: null,
  };
}

/**
 * 查询节点实时状态
 * SQL: SELECT * FROM infra.nodes ORDER BY hostname
 */
export async function getNodesStatus(): Promise<{ data: NodeStatus[]; error: null }> {
  return { data: MOCK_NODES, error: null };
}

/**
 * 查询 Agent 列表
 * SQL: SELECT * FROM core.agents WHERE is_active = true
 */
export async function getActiveAgents(): Promise<{ data: Agent[]; error: null }> {
  return { data: MOCK_AGENTS.filter(a => a.is_active), error: null };
}