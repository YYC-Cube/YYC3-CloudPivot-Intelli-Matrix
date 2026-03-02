/**
 * types/index.ts
 * ===============
 * YYC³ 全局统一类型定义
 *
 * 设计原则：
 * - 同一业务概念只定义一次，全局引用
 * - 所有组件、Hooks、工具函数从此处 import 类型
 * - 字段命名遵循 camelCase (前端) / snake_case (DB Schema) 双标准
 *
 * ============================================================
 *  1. 用户与认证
 * ============================================================
 */

/** 系统角色 */
export type UserRole = "admin" | "developer";

/** 认证用户 */
export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

/** 认证会话 */
export interface AppSession {
  user: AppUser;
  token: string;
  expiresAt: number;
}

/** 认证上下文数据 */
export interface AuthContextValue {
  logout: () => void;
  userEmail: string;
  userRole: UserRole | "";
  isGhost?: boolean;
}

/**
 * ============================================================
 *  2. 节点与集群
 * ============================================================
 */

/** 节点运行状态 */
export type NodeStatusType = "active" | "warning" | "inactive";

/**
 * 实时节点数据（WebSocket 推送 / 前端展示）
 * 字段使用 camelCase 短名，适合高频 UI 渲染
 */
export interface NodeData {
  id: string;
  status: NodeStatusType;
  gpu: number;       // GPU 利用率 0-100
  mem: number;       // 内存利用率 0-100
  temp: number;      // 温度 °C
  model: string;     // 当前部署模型
  tasks: number;     // 活跃任务数
}

/**
 * 数据库节点状态（PostgreSQL Schema: infra.nodes）
 * 字段使用 snake_case，与 DB 列名一致
 */
export interface NodeStatusRecord {
  id: string;
  hostname: string;
  gpu_util: number;
  mem_util: number;
  temp_celsius: number;
  model_deployed: string;
  active_tasks: number;
  status: NodeStatusType;
}

/** NodeStatusRecord → NodeData 转换 */
export function toNodeData(record: NodeStatusRecord): NodeData {
  return {
    id: record.hostname,
    status: record.status,
    gpu: record.gpu_util,
    mem: record.mem_util,
    temp: record.temp_celsius,
    model: record.model_deployed,
    tasks: record.active_tasks,
  };
}

/**
 * ============================================================
 *  3. 模型与 Agent
 * ============================================================
 */

/** 模型层级 */
export type ModelTier = "primary" | "secondary" | "standby";

/** 模型配置（DB Schema: core.models） */
export interface Model {
  id: string;
  name: string;
  provider: string;
  tier: ModelTier;
  avg_latency_ms: number;
  throughput: number;
  created_at: string;
}

/** Agent 配置（DB Schema: core.agents） */
export interface Agent {
  id: string;
  name: string;
  name_cn: string;
  role: string;
  description: string;
  is_active: boolean;
}

/** 推理日志状态 */
export type InferenceStatus = "success" | "error" | "timeout";

/** 推理日志（DB Schema: telemetry.inference_logs） */
export interface InferenceLog {
  id: string;
  model_id: string;
  agent_id: string;
  latency_ms: number;
  tokens_in: number;
  tokens_out: number;
  status: InferenceStatus;
  created_at: string;
}

/** 模型性能统计（聚合查询结果） */
export interface ModelStats {
  avgLatency: number;
  totalRequests: number;
  totalTokens: number;
  successRate: number;
}

/**
 * ============================================================
 *  4. WebSocket 通信
 * ============================================================
 */

/** WebSocket 连接状态 */
export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "simulated";

/** 告警严重级别 */
export type AlertLevel = "info" | "warning" | "error" | "critical";

/** 告警通知数据 */
export interface AlertData {
  id: string;
  level: AlertLevel;
  message: string;
  source: string;
  timestamp: number;
}

/** 吞吐量历史数据点 */
export interface ThroughputPoint {
  time: string;
  qps: number;
  latency: number;
  tokens: number;
}

/** 系统总览指标 */
export interface SystemStats {
  activeNodes: string;
  gpuUtil: string;
  tokenThroughput: string;
  storageUsed: string;
}

/** WebSocket 消息类型联合 */
export type WSMessage =
  | { type: "qps_update"; payload: { qps: number; trend: string } }
  | { type: "latency_update"; payload: { latency: number; trend: string } }
  | { type: "node_status"; payload: NodeData[] }
  | { type: "alert"; payload: AlertData }
  | { type: "throughput_history"; payload: ThroughputPoint[] }
  | { type: "system_stats"; payload: SystemStats }
  | { type: "heartbeat_ack" };

/** useWebSocketData Hook 返回的完整数据状态 */
export interface WebSocketDataState {
  // 连接状态
  connectionState: ConnectionState;
  reconnectCount: number;
  lastSyncTime: string;

  // 实时指标
  liveQPS: number;
  qpsTrend: string;
  liveLatency: number;
  latencyTrend: string;

  // 系统指标
  activeNodes: string;
  gpuUtil: string;
  tokenThroughput: string;
  storageUsed: string;

  // 节点数据
  nodes: NodeData[];

  // 吞吐量历史
  throughputHistory: ThroughputPoint[];

  // 告警列表
  alerts: AlertData[];

  // 操作方法
  manualReconnect: () => void;
  clearAlerts: () => void;
}

/**
 * ============================================================
 *  5. 网络配置
 * ============================================================
 */

/** 网络接口信息 */
export interface NetworkInterface {
  name: string;
  type: string;
  ip: string;
  status: "active" | "inactive" | "unknown";
}

/** 网络配置模式 */
export type NetworkMode = "auto" | "wifi" | "manual";

/** 网络配置项 */
export interface NetworkConfig {
  serverAddress: string;
  port: string;
  nasAddress: string;
  wsUrl: string;
  mode: NetworkMode;
}

/** 连接测试状态 */
export type TestStatus = "idle" | "testing" | "success" | "failed";

/** 连接测试结果 */
export interface ConnectionTestResult {
  success: boolean;
  latency: number;
  error?: string;
}

/** useNetworkConfig Hook 状态 */
export interface NetworkConfigState {
  config: NetworkConfig;
  interfaces: NetworkInterface[];
  localIP: string;
  testStatus: TestStatus;
  testLatency: number;
  testError: string;
  detecting: boolean;
}

/**
 * ============================================================
 *  6. 后台同步
 * ============================================================
 */

/** 同步项类型 */
export type SyncItemType = "config_update" | "audit_log" | "user_action";

/** 同步队列项 */
export interface SyncItem {
  id: string;
  type: SyncItemType;
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

/** 同步队列统计 */
export interface SyncQueueStats {
  total: number;
  pending: number;
  retrying: number;
  oldestTimestamp: number | null;
}

/** 同步处理结果 */
export interface SyncProcessResult {
  success: number;
  failed: number;
}

/**
 * ============================================================
 *  7. 错误处理
 * ============================================================
 */

/** 错误分类 */
export type ErrorCategory =
  | "NETWORK"
  | "PARSE"
  | "AUTH"
  | "RUNTIME"
  | "VALIDATION"
  | "STORAGE"
  | "UNKNOWN";

/** 错误严重级别 */
export type ErrorSeverity = "info" | "warning" | "error" | "critical";

/** 应用级错误 */
export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  detail?: string;
  source?: string;
  stack?: string;
  timestamp: number;
  resolved: boolean;
  userAction?: string;
}

/** 错误统计 */
export interface ErrorStats {
  total: number;
  byCategory: Record<ErrorCategory, number>;
  bySeverity: Record<ErrorSeverity, number>;
  unresolvedCount: number;
  lastErrorTime: number | null;
}

/**
 * ============================================================
 *  8. 响应式布局
 * ============================================================
 */

/** 响应式断点 */
export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

/** 视口状态 */
export interface ViewState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  isTouch: boolean;
}

/**
 * ============================================================
 *  9. UI 组件公共 Props
 * ============================================================
 */

/** ErrorBoundary 级别 */
export type ErrorBoundaryLevel = "page" | "module" | "widget";

/** AI 助理聊天消息 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  model?: string;
  provider?: ModelProviderId;
  tokens?: { input: number; output: number };
}

/** AI 助理系统命令类别 */
export type CommandCategory = "cluster" | "model" | "data" | "security" | "monitor";

/** PWA beforeinstallprompt 事件接口 */
export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * ============================================================
 *  10. 一键跟进系统 (Follow-up System)
 * ============================================================
 */

/** 告警 / 异常严重级别 */
export type FollowUpSeverity = "info" | "warning" | "error" | "critical";

/** 告警状态 */
export type FollowUpStatus = "active" | "investigating" | "resolved" | "ignored";

/** 操作链路条目类型 */
export type ChainEventType =
  | "model_load"
  | "task_start"
  | "alert_trigger"
  | "auto_action"
  | "manual_action"
  | "resolved"
  | "system_event";

/** 操作链路单条事件 */
export interface ChainEvent {
  id: string;
  time: string;           // HH:mm:ss
  type: ChainEventType;
  label: string;
  detail: string;
  isCurrent?: boolean;
}

/** 跟进卡片数据 */
export interface FollowUpItem {
  id: string;
  severity: FollowUpSeverity;
  title: string;
  source: string;         // 节点/模型/服务 来源
  metric?: string;        // 关键指标 e.g. "2,450ms > 2,000ms"
  status: FollowUpStatus;
  timestamp: number;
  chain: ChainEvent[];    // 关联操作链路
  relatedAlerts?: string[]; // 关联告警 ID
  assignee?: string;      // 当前负责人
  tags?: string[];        // 标签
}

/** 快速操作定义 */
export interface QuickAction {
  id: string;
  label: string;
  icon: string;           // lucide icon name
  variant: "default" | "primary" | "warning" | "danger" | "success";
  action: () => void;
}

/**
 * ============================================================
 *  11. 操作中心 (Operation Center)
 * ============================================================
 */

/** 操作分类 */
export type OperationCategoryType =
  | "node"
  | "model"
  | "task"
  | "system"
  | "custom";

/** 操作分类元信息 */
export interface OperationCategoryMeta {
  key: OperationCategoryType;
  label: string;
  icon: string;
  color: string;
}

/** 操作状态 */
export type OperationStatus = "pending" | "running" | "success" | "failed" | "cancelled";

/** 操作项 */
export interface OperationItem {
  id: string;
  category: OperationCategoryType;
  label: string;
  description: string;
  icon: string;
  status: OperationStatus;
  dangerous?: boolean;
}

/** 操作模板 */
export interface OperationTemplateItem {
  id: string;
  name: string;
  description: string;
  category: OperationCategoryType;
  steps: string[];
  createdAt: number;
  lastUsed?: number;
}

/** 操作日志条目 */
export interface OperationLogEntry {
  id: string;
  timestamp: number;
  category: OperationCategoryType;
  action: string;
  user: string;
  status: OperationStatus;
  detail?: string;
  duration?: number;        // ms
}

/** 操作日志筛选 */
export type LogFilterType = "all" | "byCategory" | "byUser" | "search";

/**
 * ============================================================
 *  12. IDE 终端集成 (Terminal & IDE)
 * ============================================================
 */

/** 终端命令历史条目 */
export interface TerminalHistoryEntry {
  id: string;
  input: string;
  output: string;
  timestamp: number;
  status: "success" | "error" | "info";
}

/** IDE 面板 Tab */
export type IDEPanelTab = "monitor" | "alerts" | "operations" | "logs";

/**
 * ============================================================
 *  13. 本地文件系统 (Local File System)
 * ============================================================
 */

/** 文件类型 */
export type FileItemType = "file" | "directory";

/** 文件条目 */
export interface FileItem {
  id: string;
  name: string;
  type: FileItemType;
  size?: number;          // bytes
  modifiedAt: number;
  path: string;           // 完整路径
  extension?: string;     // 文件扩展名
  children?: FileItem[];  // 子目录
}

/** 日志级别 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/** 日志条目 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
  detail?: string;
}

/** 报告类型 */
export type ReportType = "performance" | "health" | "security" | "custom";

/** 报告格式 */
export type ReportFormat = "json" | "markdown" | "csv";

/** 报告配置 */
export interface ReportConfig {
  type: ReportType;
  format: ReportFormat;
  dateRange: "today" | "week" | "month" | "custom";
  includeCharts: boolean;
  includeRawData: boolean;
}

/** 报告结果 */
export interface ReportResult {
  id: string;
  config: ReportConfig;
  generatedAt: number;
  filename: string;
  size: number;
  previewContent: string;
}

/**
 * ============================================================
 *  14. 快捷键系统 (Keyboard Shortcuts)
 * ============================================================
 */

/** 快捷键绑定 */
export interface KeyboardShortcut {
  id: string;
  keys: string;          // 显示用 e.g. "⌘+Shift+O"
  description: string;
  category: string;
  action: () => void;
}

/**
 * ============================================================
 *  15. AI 辅助决策 (AI-Assisted Decision)
 * ============================================================
 */

/** 异常模式类型 */
export type AnomalyPatternType =
  | "latency_spike"
  | "memory_pressure"
  | "gpu_overheat"
  | "throughput_drop"
  | "error_burst"
  | "storage_near_full";

/** 异常模式严重级别 */
export type PatternSeverity = "low" | "medium" | "high" | "critical";

/** 检测到的异常模式 */
export interface DetectedPattern {
  id: string;
  type: AnomalyPatternType;
  severity: PatternSeverity;
  title: string;
  description: string;
  source: string;
  metric: string;
  detectedAt: number;
  occurrences: number;      // 近期出现次数
  trend: "rising" | "stable" | "declining";
}

/** AI 推荐操作 */
export interface AIRecommendation {
  id: string;
  patternId: string;        // 关联的异常模式
  action: string;
  description: string;
  impact: "low" | "medium" | "high";
  confidence: number;       // 0-100 置信度
  autoExecutable: boolean;  // 是否可自动执行
  applied?: boolean;
}

/** AI 分析结果 */
export interface AIAnalysisResult {
  patterns: DetectedPattern[];
  recommendations: AIRecommendation[];
  overallHealth: number;     // 0-100
  analysisTime: number;      // ms
  lastAnalyzedAt: number;
}

/**
 * ============================================================
 *  16. 命令面板 (Command Palette)
 * ============================================================
 */

/** 命令面板条目 */
export interface CommandPaletteItem {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
}

/**
 * ============================================================
 *  17. PWA & 离线支持 (PWA & Offline)
 * ============================================================
 */

/** Service Worker 状态 */
export type SWStatus = "idle" | "installing" | "waiting" | "active" | "error" | "unsupported";

/** 缓存条目 */
export interface CacheEntry {
  name: string;
  size: number;       // bytes
  count: number;      // 缓存请求数
  lastUpdated: number;
}

/** PWA 状态概览 */
export interface PWAState {
  swStatus: SWStatus;
  swVersion: string;
  isOnline: boolean;
  cacheEntries: CacheEntry[];
  totalCacheSize: number;
  offlineReady: boolean;
  lastCacheUpdate: number;
}

/**
 * ============================================================
 *  18. 国际化 (i18n)
 * ============================================================
 */

/** 支持的语言 */
export type Locale = "zh-CN" | "en-US";

/** 语言元信息 */
export interface LocaleInfo {
  code: Locale;
  label: string;
  nativeLabel: string;
}

/**
 * ============================================================
 *  19. 一站式服务闭环 (Service Loop)
 * ============================================================
 */

/** 闭环阶段 */
export type LoopStage =
  | "monitor"   // 监测层
  | "analyze"   // 分析层
  | "decide"    // 决策层
  | "execute"   // 执行层
  | "verify"    // 验证层
  | "optimize"; // 优化层

/** 阶段运行状态 */
export type StageStatus = "idle" | "running" | "completed" | "error" | "skipped";

/** 单阶段结果 */
export interface StageResult {
  stage: LoopStage;
  status: StageStatus;
  startedAt: number | null;
  completedAt: number | null;
  duration: number | null;    // ms
  summary: string;
  details: string[];
  metrics?: Record<string, number>;
}

/** 闭环运行记录 */
export interface LoopRun {
  id: string;
  startedAt: number;
  completedAt: number | null;
  trigger: "manual" | "auto" | "alert";
  currentStage: LoopStage;
  stages: StageResult[];
  overallStatus: StageStatus;
}

/** 数据流节点 */
export type DataFlowNodeType = "device" | "storage" | "dashboard" | "terminal";

/** 数据流连线 */
export interface DataFlowEdge {
  from: DataFlowNodeType;
  to: DataFlowNodeType;
  label: string;
  bandwidth: string;          // e.g. "2.4 GB/s"
  active: boolean;
}

/**
 * ============================================================
 *  20. AI 模型提供商 (Model Provider)
 * ============================================================
 */

/** 服务商标识 */
export type ModelProviderId =
  | "zhipu"
  | "zhipu-plan"
  | "kimi-cn"
  | "kimi-global"
  | "deepseek"
  | "volcengine"
  | "volcengine-plan"
  | "openai"
  | "ollama";

/** 服务商定义 */
export interface ModelProviderDef {
  id: ModelProviderId;
  label: string;
  baseUrl: string;
  authType: "bearer" | "api-key" | "none";
  models: string[];
  requiresApiKey: boolean;
  isLocal: boolean;           // Ollama = true
}

/** 已配置的模型实例 */
export interface ConfiguredModel {
  id: string;
  providerId: ModelProviderId;
  providerLabel: string;
  model: string;
  apiKey: string;             // 加密存储
  baseUrl: string;
  createdAt: number;
  lastUsed: number | null;
  status: "active" | "error" | "unchecked";
}

/** Ollama 本地模型标签 (来自 /api/tags) */
export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

/** Ollama /api/tags 响应 */
export interface OllamaTagsResponse {
  models: OllamaModel[];
}

/**
 * ============================================================
 *  21. BigModel SDK 集成 (SDK Bridge)
 * ============================================================
 */

/** SDK 连接状态 */
export type SDKConnectionStatus = "idle" | "connecting" | "connected" | "error";

/** 聊天消息角色 */
export type ChatRole = "system" | "user" | "assistant";

/** 聊天会话 */
export interface ChatSession {
  id: string;
  title: string;
  modelId: string;           // ConfiguredModel.id
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

/** SDK 能力枚举 */
export type SDKCapability =
  | "chat"
  | "chat-stream"
  | "file-upload"
  | "knowledge-base"
  | "image-gen"
  | "tts"
  | "stt"
  | "video-gen"
  | "code-gen";

/** SDK 使用统计 */
export interface SDKUsageStats {
  totalRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  avgLatencyMs: number;
  lastRequestAt: number | null;
  errorCount: number;
}

/** SDK 提供商能力映射 */
export interface SDKProviderCapabilities {
  providerId: ModelProviderId;
  capabilities: SDKCapability[];
}

/** SDK Chat Completion 请求 */
export interface SDKChatRequest {
  model: string;
  messages: { role: ChatRole; content: string }[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

/** SDK Chat Completion 响应 */
export interface SDKChatResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}