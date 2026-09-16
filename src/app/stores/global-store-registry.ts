/**
 * global-store-registry.ts
 * ========================
 * 全局统一状态管理中心
 *
 * 核心功能:
 * 1. 统一管理所有应用数据存储
 * 2. 跨标签页数据同步 (BroadcastChannel)
 * 3. 数据变更通知 (EventEmitter)
 * 4. 统一的CRUD API
 * 5. 数据导入/导出
 * 6. 数据版本控制
 *
 * 使用方式:
 *   // 获取全局实例
 *   const registry = GlobalStoreRegistry.getInstance();
 *
 *   // 注册数据存储
 *   registry.registerStore('models', modelStore);
 *
 *   // 获取数据
 *   const models = registry.getStore('models').getAll();
 *
 *   // 监听变更
 *   registry.subscribe('models', (data) => console.log(data));
 *
 *   // 跨标签页同步
 *   registry.broadcast('models', { action: 'update', id: 'm1', data: {...} });
 */

import { type LocalStore } from "../lib/create-local-store";

// ============================================================
// 类型定义
// ============================================================

export type StoreKey =
  | "nodes"
  | "modelPerformance"
  | "modelDistribution"
  | "recentOps"
  | "radarData"
  | "logs"
  | "dbConnections"
  | "deployedModels"
  | "wifiNetworks"
  | "users"
  | "wifiAutoReconnect"
  | "modelProviders"
  | "configuredModels"
  | "ollamaInstances"
  | "fileSystem"
  | "settings"
  | "networkConfig"
  | "alertRules"
  | "patrolConfig"
  | "operationHistory";

export interface StoreChangeEvent<T = unknown> {
  storeKey: StoreKey;
  action: "add" | "update" | "remove" | "reset" | "import";
  data?: T;
  id?: string;
  timestamp: number;
  source: "local" | "broadcast";
}

export type StoreChangeCallback<T = unknown> = (event: StoreChangeEvent<T>) => void;

export interface GlobalStoreRegistry {
  registerStore<T extends { id: string }>(key: StoreKey, store: LocalStore<T>): void;
  getStore<T extends { id: string }>(key: StoreKey): LocalStore<T> | undefined;
  getAllStores(): Map<StoreKey, LocalStore<{ id: string }>>;
  subscribe<T extends { id: string }>(key: StoreKey, callback: StoreChangeCallback<T>): () => void;
  unsubscribe(key: StoreKey, callback: StoreChangeCallback): void;
  broadcast<T extends { id: string }>(key: StoreKey, event: Omit<StoreChangeEvent<T>, "timestamp" | "source">): void;
  exportAll(): Record<string, unknown>;
  importAll(data: Record<string, unknown>): boolean;
  resetAll(): void;
  getStats(): { totalStores: number; totalItems: number; lastSync: number };
}

// ============================================================
// 全局状态管理实现
// ============================================================

class GlobalStoreRegistryImpl implements GlobalStoreRegistry {
  private static instance: GlobalStoreRegistryImpl | null = null;
  private stores: Map<StoreKey, LocalStore<{ id: string }>> = new Map();
  private subscribers: Map<StoreKey, Set<StoreChangeCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private lastSync: number = Date.now();

  private constructor() {
    this.initBroadcastChannel();
  }

  static getInstance(): GlobalStoreRegistryImpl {
    if (!GlobalStoreRegistryImpl.instance) {
      GlobalStoreRegistryImpl.instance = new GlobalStoreRegistryImpl();
    }
    return GlobalStoreRegistryImpl.instance;
  }

  private initBroadcastChannel(): void {
    if (typeof BroadcastChannel !== "undefined") {
      this.broadcastChannel = new BroadcastChannel("yyc3_global_store_sync");
      this.broadcastChannel.onmessage = (event) => {
        const { key, changeEvent } = event.data as { key: StoreKey; changeEvent: StoreChangeEvent };
        this.handleBroadcast(key, changeEvent);
      };
    }
  }

  private handleBroadcast(key: StoreKey, event: StoreChangeEvent): void {
    const store = this.stores.get(key);
    if (!store) {return;}

    // 应用远程变更
    if (event.action === "update" && event.id && event.data) {
      store.update(event.id, event.data as { id: string });
    } else if (event.action === "add" && event.data) {
      store.add(event.data as { id: string });
    } else if (event.action === "remove" && event.id) {
      store.remove(event.id);
    } else if (event.action === "reset") {
      store.reset();
    }

    // 通知本地订阅者
    this.notifySubscribers(key, { ...event, source: "broadcast" });
    this.lastSync = Date.now();
  }

  private notifySubscribers(key: StoreKey, event: StoreChangeEvent): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => callback(event));
    }
  }

  registerStore<T extends { id: string }>(key: StoreKey, store: LocalStore<T>): void {
    this.stores.set(key, store as unknown as LocalStore<{ id: string }>);
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
  }

  getStore<T extends { id: string }>(key: StoreKey): LocalStore<T> | undefined {
    return this.stores.get(key) as LocalStore<T> | undefined;
  }

  getAllStores(): Map<StoreKey, LocalStore<{ id: string }>> {
    return new Map(this.stores);
  }

  subscribe<T extends { id: string }>(key: StoreKey, callback: StoreChangeCallback<T>): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    const callbacks = this.subscribers.get(key)!;
    callbacks.add(callback as StoreChangeCallback);

    // 返回取消订阅函数
    return () => {
      callbacks.delete(callback as StoreChangeCallback);
    };
  }

  unsubscribe(key: StoreKey, callback: StoreChangeCallback): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  broadcast<T extends { id: string }>(
    key: StoreKey,
    event: Omit<StoreChangeEvent<T>, "timestamp" | "source">
  ): void {
    const fullEvent: StoreChangeEvent<T> = {
      ...event,
      timestamp: Date.now(),
      source: "local",
    };

    // 通知本地订阅者
    this.notifySubscribers(key, fullEvent);

    // 广播到其他标签页
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ key, changeEvent: fullEvent });
    }

    this.lastSync = Date.now();
  }

  exportAll(): Record<string, unknown> {
    const data: Record<string, unknown> = {
      _exportedAt: new Date().toISOString(),
      _version: "2.0",
    };

    this.stores.forEach((store, key) => {
      data[key] = store.getAll();
    });

    return data;
  }

  importAll(data: Record<string, unknown>): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith("_")) {return;}
        const store = this.stores.get(key as StoreKey);
        if (store && Array.isArray(value)) {
          // 清空并导入
          const current = store.getAll();
          current.forEach((item) => store.remove(item.id));
          value.forEach((item) => store.add(item as { id: string }));
        }
      });

      // 广播导入事件
      this.stores.forEach((_, key) => {
        this.broadcast(key, { action: "import", storeKey: key });
      });

      return true;
    } catch {
      return false;
    }
  }

  resetAll(): void {
    this.stores.forEach((store, key) => {
      store.reset();
      this.broadcast(key, { action: "reset", storeKey: key });
    });
  }

  getStats(): { totalStores: number; totalItems: number; lastSync: number } {
    let totalItems = 0;
    this.stores.forEach((store) => {
      totalItems += store.count();
    });

    return {
      totalStores: this.stores.size,
      totalItems,
      lastSync: this.lastSync,
    };
  }
}

// ============================================================
// 导出单例
// ============================================================

export const globalStoreRegistry = GlobalStoreRegistryImpl.getInstance();

// ============================================================
// 便捷 Hook 工厂
// ============================================================

import { useState, useEffect, useCallback } from "react";

/**
 * 创建统一数据访问 Hook
 *
 * 用法:
 *   const useModels = createStoreHook<Model>('models', modelStore);
 *   const { data, add, update, remove, loading } = useModels();
 */
export function createStoreHook<T extends { id: string }>(
  storeKey: StoreKey,
  store: LocalStore<T>
) {
  // 注册到全局注册表
  globalStoreRegistry.registerStore(storeKey, store);

  return function useStore() {
    const [data, setData] = useState<T[]>(() => store.getAll());
    const [loading, setLoading] = useState(false);

    // 订阅变更
    useEffect(() => {
      const unsubscribe = globalStoreRegistry.subscribe<T>(storeKey, () => {
        // 刷新数据
        setData(store.getAll());
      });

      return unsubscribe;
    }, []);

    const add = useCallback((item: Omit<T, "id"> & { id?: string }) => {
      const newItem = store.add(item);
      globalStoreRegistry.broadcast(storeKey, {
        action: "add",
        data: newItem,
        storeKey,
      });
      return newItem;
    }, []);

    const update = useCallback((id: string, updates: Partial<T>) => {
      const updated = store.update(id, updates);
      if (updated) {
        globalStoreRegistry.broadcast(storeKey, {
          action: "update",
          id,
          data: updates as T,
          storeKey,
        });
      }
      return updated;
    }, []);

    const remove = useCallback((id: string) => {
      const success = store.remove(id);
      if (success) {
        globalStoreRegistry.broadcast(storeKey, {
          action: "remove",
          id,
          storeKey,
        });
      }
      return success;
    }, []);

    const reset = useCallback(() => {
      const newData = store.reset();
      globalStoreRegistry.broadcast(storeKey, {
        action: "reset",
        storeKey,
      });
      return newData;
    }, []);

    const refresh = useCallback(() => {
      setLoading(true);
      setData(store.getAll());
      setLoading(false);
    }, []);

    return {
      data,
      loading,
      add,
      update,
      remove,
      reset,
      refresh,
      count: data.length,
      getById: (id: string) => store.getById(id),
    };
  };
}
