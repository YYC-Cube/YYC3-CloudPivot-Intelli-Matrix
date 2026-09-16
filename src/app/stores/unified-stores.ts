/**
 * unified-stores.ts
 * ==================
 * 统一应用数据存储
 *
 * 整合所有分散的数据存储，提供统一的数据访问接口
 * 解决数据不一致问题的核心方案
 */

import { createLocalStore } from "../lib/create-local-store";
import { globalStoreRegistry, createStoreHook } from "./global-store-registry";

// ============================================================
// 类型定义
// ============================================================

export interface ModelProviderConfig {
  id: string;
  providerId: string;
  providerLabel: string;
  model: string;
  apiKey: string;
  baseUrl: string;
  proxyUrl?: string;
  createdAt: number;
  lastUsed: number | null;
  status: "active" | "error" | "unchecked" | "checking";
  latency?: number;
}

export interface OllamaInstanceConfig {
  id: string;
  name: string;
  baseUrl: string;
  status: "online" | "offline" | "checking";
  lastHealthCheck?: number;
  models?: string[];
  autoDiscovery?: boolean;
}

export interface FileSystemConfig {
  id: string;
  name: string;
  path: string;
  type: "local" | "host";
  createdAt: number;
  lastAccessed?: number;
}

export interface AppSettings {
  id: string;
  key: string;
  value: unknown;
  category: string;
  description?: string;
  updatedAt: number;
}

export interface NetworkConfig {
  id: string;
  name: string;
  type: "wifi" | "ethernet" | "vpn";
  status: "connected" | "disconnected" | "connecting";
  ipAddress?: string;
  macAddress?: string;
  signalStrength?: number;
  lastConnected?: number;
}

export interface AlertRuleConfig {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  severity: "info" | "warning" | "error" | "critical";
  enabled: boolean;
  notifyChannels: string[];
  createdAt: number;
  lastTriggered?: number;
}

export interface PatrolConfig {
  id: string;
  name: string;
  interval: number;
  enabled: boolean;
  targets: string[];
  checks: string[];
  lastRun?: number;
  nextRun?: number;
}

export interface OperationHistory {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: number;
  status: "success" | "failed" | "pending";
  details?: string;
}

// ============================================================
// 默认数据
// ============================================================

const DEFAULT_MODEL_PROVIDERS: ModelProviderConfig[] = [];

const DEFAULT_OLLAMA_INSTANCES: OllamaInstanceConfig[] = [
  {
    id: "ollama-local",
    name: "本地 Ollama",
    baseUrl: "http://localhost:11434",
    status: "offline",
    autoDiscovery: true,
  },
];

const DEFAULT_FILE_SYSTEMS: FileSystemConfig[] = [];

const DEFAULT_APP_SETTINGS: AppSettings[] = [
  {
    id: "setting-theme",
    key: "theme",
    value: "dark",
    category: "appearance",
    description: "应用主题",
    updatedAt: Date.now(),
  },
  {
    id: "setting-language",
    key: "language",
    value: "zh-CN",
    category: "localization",
    description: "界面语言",
    updatedAt: Date.now(),
  },
  {
    id: "setting-auto-save",
    key: "autoSave",
    value: true,
    category: "editor",
    description: "自动保存",
    updatedAt: Date.now(),
  },
  {
    id: "setting-notification",
    key: "notification",
    value: true,
    category: "system",
    description: "系统通知",
    updatedAt: Date.now(),
  },
];

const DEFAULT_NETWORK_CONFIGS: NetworkConfig[] = [];

const DEFAULT_ALERT_RULES: AlertRuleConfig[] = [
  {
    id: "alert-gpu-temp",
    name: "GPU 温度告警",
    condition: "gpu_temp > threshold",
    threshold: 80,
    severity: "warning",
    enabled: true,
    notifyChannels: ["toast", "log"],
    createdAt: Date.now(),
  },
  {
    id: "alert-memory-usage",
    name: "内存使用告警",
    condition: "memory_usage > threshold",
    threshold: 90,
    severity: "error",
    enabled: true,
    notifyChannels: ["toast", "log", "email"],
    createdAt: Date.now(),
  },
];

const DEFAULT_PATROL_CONFIGS: PatrolConfig[] = [
  {
    id: "patrol-default",
    name: "默认巡查",
    interval: 300000,
    enabled: true,
    targets: ["all"],
    checks: ["health", "performance", "security"],
  },
];

const DEFAULT_OPERATION_HISTORY: OperationHistory[] = [];

// ============================================================
// 创建存储实例
// ============================================================

export const modelProviderStore = createLocalStore<ModelProviderConfig>(
  "yyc3_model_providers",
  DEFAULT_MODEL_PROVIDERS,
  "mp"
);

export const ollamaInstanceStore = createLocalStore<OllamaInstanceConfig>(
  "yyc3_ollama_instances",
  DEFAULT_OLLAMA_INSTANCES,
  "ollama"
);

export const fileSystemStore = createLocalStore<FileSystemConfig>(
  "yyc3_file_systems",
  DEFAULT_FILE_SYSTEMS,
  "fs"
);

export const appSettingsStore = createLocalStore<AppSettings>(
  "yyc3_app_settings",
  DEFAULT_APP_SETTINGS,
  "setting"
);

export const networkConfigStore = createLocalStore<NetworkConfig>(
  "yyc3_network_configs",
  DEFAULT_NETWORK_CONFIGS,
  "net"
);

export const alertRuleStore = createLocalStore<AlertRuleConfig>(
  "yyc3_alert_rules",
  DEFAULT_ALERT_RULES,
  "alert"
);

export const patrolConfigStore = createLocalStore<PatrolConfig>(
  "yyc3_patrol_configs",
  DEFAULT_PATROL_CONFIGS,
  "patrol"
);

export const operationHistoryStore = createLocalStore<OperationHistory>(
  "yyc3_operation_history",
  DEFAULT_OPERATION_HISTORY,
  "op"
);

// ============================================================
// 注册到全局注册表
// ============================================================

globalStoreRegistry.registerStore("modelProviders", modelProviderStore);
globalStoreRegistry.registerStore("ollamaInstances", ollamaInstanceStore);
globalStoreRegistry.registerStore("fileSystem", fileSystemStore);
globalStoreRegistry.registerStore("settings", appSettingsStore);
globalStoreRegistry.registerStore("networkConfig", networkConfigStore);
globalStoreRegistry.registerStore("alertRules", alertRuleStore);
globalStoreRegistry.registerStore("patrolConfig", patrolConfigStore);
globalStoreRegistry.registerStore("operationHistory", operationHistoryStore);

// ============================================================
// 创建统一 Hook
// ============================================================

export const useModelProviders = createStoreHook("modelProviders", modelProviderStore);
export const useOllamaInstances = createStoreHook("ollamaInstances", ollamaInstanceStore);
export const useFileSystems = createStoreHook("fileSystem", fileSystemStore);
export const useAppSettings = createStoreHook("settings", appSettingsStore);
export const useNetworkConfigs = createStoreHook("networkConfig", networkConfigStore);
export const useAlertRules = createStoreHook("alertRules", alertRuleStore);
export const usePatrolConfigs = createStoreHook("patrolConfig", patrolConfigStore);
export const useOperationHistory = createStoreHook("operationHistory", operationHistoryStore);

// ============================================================
// 便捷工具函数
// ============================================================

export function getSetting<T = unknown>(key: string, defaultValue?: T): T | undefined {
  const settings = appSettingsStore.getAll();
  const setting = settings.find((s) => s.key === key);
  return setting ? (setting.value as T) : defaultValue;
}

export function setSetting<T = unknown>(key: string, value: T, category = "general", description?: string): void {
  const settings = appSettingsStore.getAll();
  const existing = settings.find((s) => s.key === key);

  if (existing) {
    appSettingsStore.update(existing.id, {
      value,
      updatedAt: Date.now(),
      description: description || existing.description,
    });
  } else {
    appSettingsStore.add({
      key,
      value,
      category,
      description,
      updatedAt: Date.now(),
    });
  }

  globalStoreRegistry.broadcast("settings", {
    action: "update",
    storeKey: "settings",
    data: { key, value } as unknown as AppSettings,
  });
}

export function addOperationHistory(
  action: string,
  target: string,
  user: string,
  status: "success" | "failed" | "pending",
  details?: string
): void {
  operationHistoryStore.add({
    action,
    target,
    user,
    timestamp: Date.now(),
    status,
    details,
  });

  // 保留最近1000条记录
  const all = operationHistoryStore.getAll();
  if (all.length > 1000) {
    const toRemove = all.slice(0, all.length - 1000);
    toRemove.forEach((item) => operationHistoryStore.remove(item.id));
  }
}

// ============================================================
// 数据迁移工具
// ============================================================

export function migrateFromLocalStorage(): void {
  // 迁移模型配置
  const oldModelKey = "yyc3_configured_models";
  const oldModels = localStorage.getItem(oldModelKey);
  if (oldModels) {
    try {
      const parsed = JSON.parse(oldModels);
      if (Array.isArray(parsed)) {
        parsed.forEach((model: ModelProviderConfig) => {
          if (!modelProviderStore.getById(model.id)) {
            modelProviderStore.add(model);
          }
        });
        localStorage.removeItem(oldModelKey);
        console.info("[Migration] Migrated model providers to unified store");
      }
    } catch (e) {
      console.error("[Migration] Failed to migrate model providers:", e);
    }
  }

  // 迁移Ollama配置
  const oldOllamaKey = "yyc3_ollama_config";
  const oldOllama = localStorage.getItem(oldOllamaKey);
  if (oldOllama) {
    try {
      const parsed = JSON.parse(oldOllama);
      if (parsed.instances && Array.isArray(parsed.instances)) {
        parsed.instances.forEach((instance: OllamaInstanceConfig) => {
          if (!ollamaInstanceStore.getById(instance.id)) {
            ollamaInstanceStore.add(instance);
          }
        });
        localStorage.removeItem(oldOllamaKey);
        console.info("[Migration] Migrated Ollama instances to unified store");
      }
    } catch (e) {
      console.error("[Migration] Failed to migrate Ollama instances:", e);
    }
  }

  // 迁移数据库连接配置
  const oldDbKey = "yyc3_db_connections";
  const oldDb = localStorage.getItem(oldDbKey);
  if (oldDb) {
    try {
      const parsed = JSON.parse(oldDb);
      if (Array.isArray(parsed)) {
        // 使用 dashboard-stores 中的 dbConnectionStore
        const { dbConnectionStore } = require("./dashboard-stores");
        parsed.forEach((conn: { id: string }) => {
          if (!dbConnectionStore.getById(conn.id)) {
            dbConnectionStore.add(conn);
          }
        });
        console.info("[Migration] Migrated database connections to unified store");
      }
    } catch (e) {
      console.error("[Migration] Failed to migrate database connections:", e);
    }
  }
}

// 自动执行迁移
if (typeof window !== "undefined") {
  migrateFromLocalStorage();
}
