/**
 * GlobalStoreContext.tsx
 * =======================
 * 全局数据访问上下文
 *
 * 提供统一的数据访问接口，所有页面通过此Context访问数据
 * 确保数据一致性和实时同步
 *
 * 使用方式:
 *   // 在App.tsx中包裹
 *   <GlobalStoreProvider>
 *     <App />
 *   </GlobalStoreProvider>
 *
 *   // 在组件中使用
 *   const { modelProviders, addModelProvider, updateModelProvider } = useGlobalStore();
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  globalStoreRegistry,
  type StoreKey,
} from "../stores/global-store-registry";
import {
  modelProviderStore,
  ollamaInstanceStore,
  appSettingsStore,
  networkConfigStore,
  alertRuleStore,
  patrolConfigStore,
  operationHistoryStore,
  type ModelProviderConfig,
  type OllamaInstanceConfig,
  type NetworkConfig,
  type AlertRuleConfig,
  type PatrolConfig,
  type OperationHistory,
  getSetting,
  setSetting,
  addOperationHistory,
} from "../stores/unified-stores";
import {
  nodeStore,
  dbConnectionStore,
  userStore,
  type NodeData,
  type DBConnection,
  type UserRecord,
} from "../stores/dashboard-stores";

// ============================================================
// 类型定义
// ============================================================

interface GlobalStoreState {
  // 模型相关
  modelProviders: ModelProviderConfig[];
  ollamaInstances: OllamaInstanceConfig[];

  // 系统配置
  settings: Record<string, unknown>;
  networkConfigs: NetworkConfig[];

  // 监控数据
  nodes: (NodeData & { id: string })[];
  dbConnections: DBConnection[];
  users: UserRecord[];

  // 告警和巡查
  alertRules: AlertRuleConfig[];
  patrolConfigs: PatrolConfig[];

  // 操作历史
  operationHistory: OperationHistory[];

  // 统计信息
  stats: {
    totalStores: number;
    totalItems: number;
    lastSync: number;
  };
}

interface GlobalStoreActions {
  // 模型管理
  addModelProvider: (model: Omit<ModelProviderConfig, "id">) => ModelProviderConfig;
  updateModelProvider: (id: string, updates: Partial<ModelProviderConfig>) => ModelProviderConfig | null;
  removeModelProvider: (id: string) => boolean;

  // Ollama管理
  addOllamaInstance: (instance: Omit<OllamaInstanceConfig, "id">) => OllamaInstanceConfig;
  updateOllamaInstance: (id: string, updates: Partial<OllamaInstanceConfig>) => OllamaInstanceConfig | null;
  removeOllamaInstance: (id: string) => boolean;

  // 设置管理
  getSetting: <T = unknown>(key: string, defaultValue?: T) => T | undefined;
  setSetting: <T = unknown>(key: string, value: T, category?: string, description?: string) => void;

  // 数据库连接管理
  addDBConnection: (conn: Omit<DBConnection, "id">) => DBConnection;
  updateDBConnection: (id: string, updates: Partial<DBConnection>) => DBConnection | null;
  removeDBConnection: (id: string) => boolean;

  // 告警规则管理
  addAlertRule: (rule: Omit<AlertRuleConfig, "id">) => AlertRuleConfig;
  updateAlertRule: (id: string, updates: Partial<AlertRuleConfig>) => AlertRuleConfig | null;
  removeAlertRule: (id: string) => boolean;

  // 巡查配置管理
  addPatrolConfig: (config: Omit<PatrolConfig, "id">) => PatrolConfig;
  updatePatrolConfig: (id: string, updates: Partial<PatrolConfig>) => PatrolConfig | null;
  removePatrolConfig: (id: string) => boolean;

  // 操作历史
  addOperationHistory: (
    action: string,
    target: string,
    user: string,
    status: "success" | "failed" | "pending",
    details?: string
  ) => void;

  // 数据导入导出
  exportAllData: () => Record<string, unknown>;
  importAllData: (data: Record<string, unknown>) => boolean;

  // 重置
  resetAllData: () => void;

  // 刷新
  refreshAll: () => void;
}

type GlobalStoreContextValue = GlobalStoreState & GlobalStoreActions;

const GlobalStoreContext = createContext<GlobalStoreContextValue | null>(null);

// ============================================================
// Provider 组件
// ============================================================

export function GlobalStoreProvider({ children }: { children: React.ReactNode }) {
  // 初始化状态
  const [state, setState] = useState<GlobalStoreState>(() => ({
    modelProviders: modelProviderStore.getAll(),
    ollamaInstances: ollamaInstanceStore.getAll(),
    settings: Object.fromEntries(appSettingsStore.getAll().map((s) => [s.key, s.value])),
    networkConfigs: networkConfigStore.getAll(),
    nodes: nodeStore.getAll(),
    dbConnections: dbConnectionStore.getAll(),
    users: userStore.getAll(),
    alertRules: alertRuleStore.getAll(),
    patrolConfigs: patrolConfigStore.getAll(),
    operationHistory: operationHistoryStore.getAll(),
    stats: globalStoreRegistry.getStats(),
  }));

  // 订阅所有存储变更
  useEffect(() => {
    const storeKeys: StoreKey[] = [
      "modelProviders",
      "ollamaInstances",
      "settings",
      "networkConfig",
      "nodes",
      "dbConnections",
      "users",
      "alertRules",
      "patrolConfig",
      "operationHistory",
    ];

    const unsubscribers: (() => void)[] = [];

    storeKeys.forEach((key) => {
      const unsub = globalStoreRegistry.subscribe(key, () => {
        refreshAll();
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, []);

  // 刷新所有数据
  const refreshAll = useCallback(() => {
    setState({
      modelProviders: modelProviderStore.getAll(),
      ollamaInstances: ollamaInstanceStore.getAll(),
      settings: Object.fromEntries(appSettingsStore.getAll().map((s) => [s.key, s.value])),
      networkConfigs: networkConfigStore.getAll(),
      nodes: nodeStore.getAll(),
      dbConnections: dbConnectionStore.getAll(),
      users: userStore.getAll(),
      alertRules: alertRuleStore.getAll(),
      patrolConfigs: patrolConfigStore.getAll(),
      operationHistory: operationHistoryStore.getAll(),
      stats: globalStoreRegistry.getStats(),
    });
  }, []);

  // 模型管理
  const addModelProvider = useCallback((model: Omit<ModelProviderConfig, "id">) => {
    const newItem = modelProviderStore.add(model);
    globalStoreRegistry.broadcast("modelProviders", {
      action: "add",
      data: newItem,
      storeKey: "modelProviders",
    });
    addOperationHistory("添加模型配置", model.model, "system", "success");
    return newItem;
  }, []);

  const updateModelProvider = useCallback((id: string, updates: Partial<ModelProviderConfig>) => {
    const updated = modelProviderStore.update(id, updates);
    if (updated) {
      globalStoreRegistry.broadcast("modelProviders", {
        action: "update",
        id,
        data: updates as unknown as ModelProviderConfig,
        storeKey: "modelProviders",
      });
      addOperationHistory("更新模型配置", updated.model, "system", "success");
    }
    return updated;
  }, []);

  const removeModelProvider = useCallback((id: string) => {
    const item = modelProviderStore.getById(id);
    const success = modelProviderStore.remove(id);
    if (success) {
      globalStoreRegistry.broadcast("modelProviders", {
        action: "remove",
        id,
        storeKey: "modelProviders",
      });
      addOperationHistory("删除模型配置", item?.model || id, "system", "success");
    }
    return success;
  }, []);

  // Ollama管理
  const addOllamaInstance = useCallback((instance: Omit<OllamaInstanceConfig, "id">) => {
    const newItem = ollamaInstanceStore.add(instance);
    globalStoreRegistry.broadcast("ollamaInstances", {
      action: "add",
      data: newItem,
      storeKey: "ollamaInstances",
    });
    return newItem;
  }, []);

  const updateOllamaInstance = useCallback((id: string, updates: Partial<OllamaInstanceConfig>) => {
    const updated = ollamaInstanceStore.update(id, updates);
    if (updated) {
      globalStoreRegistry.broadcast("ollamaInstances", {
        action: "update",
        id,
        data: updates as unknown as OllamaInstanceConfig,
        storeKey: "ollamaInstances",
      });
    }
    return updated;
  }, []);

  const removeOllamaInstance = useCallback((id: string) => {
    const success = ollamaInstanceStore.remove(id);
    if (success) {
      globalStoreRegistry.broadcast("ollamaInstances", {
        action: "remove",
        id,
        storeKey: "ollamaInstances",
      });
    }
    return success;
  }, []);

  // 数据库连接管理
  const addDBConnection = useCallback((conn: Omit<DBConnection, "id">) => {
    const newItem = dbConnectionStore.add(conn);
    globalStoreRegistry.broadcast("dbConnections", {
      action: "add",
      data: newItem,
      storeKey: "dbConnections",
    });
    addOperationHistory("添加数据库连接", conn.name, "system", "success");
    return newItem;
  }, []);

  const updateDBConnection = useCallback((id: string, updates: Partial<DBConnection>) => {
    const updated = dbConnectionStore.update(id, updates);
    if (updated) {
      globalStoreRegistry.broadcast("dbConnections", {
        action: "update",
        id,
        data: updates as unknown as DBConnection,
        storeKey: "dbConnections",
      });
    }
    return updated;
  }, []);

  const removeDBConnection = useCallback((id: string) => {
    const item = dbConnectionStore.getById(id);
    const success = dbConnectionStore.remove(id);
    if (success) {
      globalStoreRegistry.broadcast("dbConnections", {
        action: "remove",
        id,
        storeKey: "dbConnections",
      });
      addOperationHistory("删除数据库连接", item?.name || id, "system", "success");
    }
    return success;
  }, []);

  // 告警规则管理
  const addAlertRule = useCallback((rule: Omit<AlertRuleConfig, "id">) => {
    const newItem = alertRuleStore.add(rule);
    globalStoreRegistry.broadcast("alertRules", {
      action: "add",
      data: newItem,
      storeKey: "alertRules",
    });
    return newItem;
  }, []);

  const updateAlertRule = useCallback((id: string, updates: Partial<AlertRuleConfig>) => {
    const updated = alertRuleStore.update(id, updates);
    if (updated) {
      globalStoreRegistry.broadcast("alertRules", {
        action: "update",
        id,
        data: updates as unknown as AlertRuleConfig,
        storeKey: "alertRules",
      });
    }
    return updated;
  }, []);

  const removeAlertRule = useCallback((id: string) => {
    const success = alertRuleStore.remove(id);
    if (success) {
      globalStoreRegistry.broadcast("alertRules", {
        action: "remove",
        id,
        storeKey: "alertRules",
      });
    }
    return success;
  }, []);

  // 巡查配置管理
  const addPatrolConfig = useCallback((config: Omit<PatrolConfig, "id">) => {
    const newItem = patrolConfigStore.add(config);
    globalStoreRegistry.broadcast("patrolConfig", {
      action: "add",
      data: newItem,
      storeKey: "patrolConfig",
    });
    return newItem;
  }, []);

  const updatePatrolConfig = useCallback((id: string, updates: Partial<PatrolConfig>) => {
    const updated = patrolConfigStore.update(id, updates);
    if (updated) {
      globalStoreRegistry.broadcast("patrolConfig", {
        action: "update",
        id,
        data: updates as unknown as PatrolConfig,
        storeKey: "patrolConfig",
      });
    }
    return updated;
  }, []);

  const removePatrolConfig = useCallback((id: string) => {
    const success = patrolConfigStore.remove(id);
    if (success) {
      globalStoreRegistry.broadcast("patrolConfig", {
        action: "remove",
        id,
        storeKey: "patrolConfig",
      });
    }
    return success;
  }, []);

  // 数据导入导出
  const exportAllData = useCallback(() => {
    return globalStoreRegistry.exportAll();
  }, []);

  const importAllData = useCallback((data: Record<string, unknown>) => {
    const success = globalStoreRegistry.importAll(data);
    if (success) {
      addOperationHistory("导入数据", "全部数据", "system", "success");
    }
    return success;
  }, []);

  // 重置
  const resetAllData = useCallback(() => {
    globalStoreRegistry.resetAll();
    addOperationHistory("重置数据", "全部数据", "system", "success");
  }, []);

  // 组合值
  const value = useMemo<GlobalStoreContextValue>(
    () => ({
      ...state,
      addModelProvider,
      updateModelProvider,
      removeModelProvider,
      addOllamaInstance,
      updateOllamaInstance,
      removeOllamaInstance,
      getSetting,
      setSetting,
      addDBConnection,
      updateDBConnection,
      removeDBConnection,
      addAlertRule,
      updateAlertRule,
      removeAlertRule,
      addPatrolConfig,
      updatePatrolConfig,
      removePatrolConfig,
      addOperationHistory,
      exportAllData,
      importAllData,
      resetAllData,
      refreshAll,
    }),
    [
      state,
      addModelProvider,
      updateModelProvider,
      removeModelProvider,
      addOllamaInstance,
      updateOllamaInstance,
      removeOllamaInstance,
      addDBConnection,
      updateDBConnection,
      removeDBConnection,
      addAlertRule,
      updateAlertRule,
      removeAlertRule,
      addPatrolConfig,
      updatePatrolConfig,
      removePatrolConfig,
      exportAllData,
      importAllData,
      resetAllData,
      refreshAll,
    ]
  );

  return <GlobalStoreContext.Provider value={value}>{children}</GlobalStoreContext.Provider>;
}

// ============================================================
// Hook
// ============================================================

export function useGlobalStore(): GlobalStoreContextValue {
  const context = useContext(GlobalStoreContext);
  if (!context) {
    throw new Error("useGlobalStore must be used within GlobalStoreProvider");
  }
  return context;
}

// ============================================================
// 便捷选择器 Hooks
// ============================================================

export function useModelProviders() {
  const { modelProviders, addModelProvider, updateModelProvider, removeModelProvider } = useGlobalStore();
  return { modelProviders, addModelProvider, updateModelProvider, removeModelProvider };
}

export function useOllamaInstances() {
  const { ollamaInstances, addOllamaInstance, updateOllamaInstance, removeOllamaInstance } = useGlobalStore();
  return { ollamaInstances, addOllamaInstance, updateOllamaInstance, removeOllamaInstance };
}

export function useDBConnections() {
  const { dbConnections, addDBConnection, updateDBConnection, removeDBConnection } = useGlobalStore();
  return { dbConnections, addDBConnection, updateDBConnection, removeDBConnection };
}

export function useAlertRules() {
  const { alertRules, addAlertRule, updateAlertRule, removeAlertRule } = useGlobalStore();
  return { alertRules, addAlertRule, updateAlertRule, removeAlertRule };
}

export function usePatrolConfigs() {
  const { patrolConfigs, addPatrolConfig, updatePatrolConfig, removePatrolConfig } = useGlobalStore();
  return { patrolConfigs, addPatrolConfig, updatePatrolConfig, removePatrolConfig };
}

export function useAppSettings() {
  const { settings, getSetting, setSetting } = useGlobalStore();
  return { settings, getSetting, setSetting };
}
