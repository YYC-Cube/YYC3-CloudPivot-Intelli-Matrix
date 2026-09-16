/**
 * hybrid-storage-manager.ts
 * =======================
 * YYC³ 混合存储管理器
 *
 * 架构设计：
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    应用层 (Components)                     │
 * └────────────────────┬────────────────────────────────────────┘
 *                      │
 *                      ▼
 * ┌─────────────────────────────────────────────────────────────┐
 * │              HybridStorageManager                          │
 * │  ┌─────────────────────────────────────────────────────┐  │
 * │  │         数据同步策略                             │  │
 * │  │  - 优先读取本地数据（快速响应）              │  │
 * │  │  - 后台同步到远程（异步）                    │  │
 * │  │  - 冲突解决（远程优先）                    │  │
 * │  └─────────────────────────────────────────────────────┘  │
 * ┌──────────────────────┐  ┌──────────────────────┐       │
 * │  LocalStorageStore   │  │  SupabaseStore     │       │
 * │  (本地快速存储)      │  │  (远程持久化)      │       │
 * └──────────────────────┘  └──────────────────────┘       │
 └─────────────────────────────────────────────────────────────┘
 */

// ============================================================
// 配置类型
// ============================================================

export interface StorageConfig {
  enableLocalStorage: boolean;
  enableSupabase: boolean;
  syncInterval: number;
  syncOnWrite: boolean;
  conflictResolution: "local" | "remote" | "manual";
}

/** 存储记录最小结构约定：所有表记录必须携带 id，同步冲突判定依赖 updated_at */
interface StorageRecord {
  id: string;
  updated_at?: string | number;
  [key: string]: unknown;
}

/** Supabase 客户端最小结构：覆盖 from 惰性链（select/eq/limit/insert/update/delete）与 channel 订阅 */
interface SupabaseQueryLike {
  eq: (col: string, val: unknown) => SupabaseQueryLike;
  limit: (count: number) => SupabaseQueryLike;
  select: (columns?: string) => SupabaseQueryLike;
  single: () => PromiseLike<{ data: unknown; error: unknown }>;
  then: <R>(
    onfulfilled?: (value: { data: unknown[] | null; error: unknown }) => R | PromiseLike<R>
  ) => PromiseLike<R>;
}

export interface MinimalSupabaseClient {
  from: (table: string) => SupabaseQueryLike &
    Pick<MinimalSupabaseClient, "insert" | "update" | "delete">;
  insert: (data: unknown) => SupabaseQueryLike;
  update: (data: unknown) => SupabaseQueryLike;
  delete: () => SupabaseQueryLike;
  channel: (name: string) => {
    on: (
      event: string,
      config: { event: string; schema: string; table: string },
      callback: () => void | Promise<void>
    ) => { subscribe: () => { unsubscribe: () => void } };
  };
}

export interface SyncStatus {
  lastSyncTime: number | null;
  isSyncing: boolean;
  pendingChanges: number;
  conflicts: Array<{
    table: string;
    id: string;
    localData: unknown;
    remoteData: unknown;
  }>;
}

export interface StorageStats {
  localStorageSize: number;
  localStorageUsed: number;
  supabaseConnected: boolean;
  tablesSynced: string[];
}

// ============================================================
// 存储操作接口
// ============================================================

export interface IStorage {
  get<T>(table: string, id?: string): Promise<T[]>;
  add<T>(table: string, data: T): Promise<T>;
  update<T>(table: string, id: string, data: Partial<T>): Promise<T | null>;
  delete(table: string, id: string): Promise<boolean>;
  query<T>(table: string, filters?: Record<string, unknown>): Promise<T[]>;
  subscribe<T>(table: string, callback: (data: T[]) => void): () => void;
}

// ============================================================
// LocalStorageStore 实现
// ============================================================

class LocalStorageStore implements IStorage {
  private cache: Map<string, unknown[]> = new Map();
  private storagePrefix = "yyc3_hybrid_";

  private getStorageKey(table: string): string {
    return `${this.storagePrefix}${table}`;
  }

  async get<T>(table: string, id?: string): Promise<T[]> {
    const key = this.getStorageKey(table);

    if (this.cache.has(key)) {
      const cachedData = this.cache.get(key) as T[];
      return id ? cachedData.filter((item) => (item as StorageRecord).id === id) : cachedData;
    }

    try {
      const raw = localStorage.getItem(key);
      const parsedData = raw ? JSON.parse(raw) : [];
      this.cache.set(key, parsedData);
      return id ? (parsedData as T[]).filter((item) => (item as StorageRecord).id === id) : parsedData;
    } catch {
      return [];
    }
  }

  async add<T>(table: string, data: T): Promise<T> {
    const items = await this.get<T>(table);
    const newItem = { ...data, id: (data as StorageRecord).id || `local_${Date.now()}` };
    items.push(newItem);

    const key = this.getStorageKey(table);
    localStorage.setItem(key, JSON.stringify(items));
    this.cache.set(key, items);

    return newItem;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const items = await this.get<T>(table);
    const index = items.findIndex((item) => (item as StorageRecord).id === id);

    if (index === -1) { return null; }

    items[index] = { ...items[index], ...data };
    const key = this.getStorageKey(table);
    localStorage.setItem(key, JSON.stringify(items));
    this.cache.set(key, items);

    return items[index];
  }

  async delete(table: string, id: string): Promise<boolean> {
    const items = await this.get(table);
    const filtered = items.filter((item) => (item as StorageRecord).id !== id);

    if (filtered.length === items.length) { return false; }

    const key = this.getStorageKey(table);
    localStorage.setItem(key, JSON.stringify(filtered));
    this.cache.set(key, filtered);

    return true;
  }

  async query<T>(table: string, filters?: Record<string, unknown>): Promise<T[]> {
    const items = await this.get<T>(table);

    if (!filters) { return items; }

    return items.filter((item) => {
      const record = item as StorageRecord;
      return Object.entries(filters).every(([key, value]) => record[key] === value);
    });
  }

  subscribe<T>(table: string, callback: (data: T[]) => void): () => void {
    const key = this.getStorageKey(table);
    const handler = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const data = JSON.parse(event.newValue) as T[];
          this.cache.set(key, data);
          callback(data);
        } catch { }
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }
}

// ============================================================
// SupabaseStore 实现
// ============================================================

class SupabaseStore implements IStorage {
  private client: MinimalSupabaseClient;
  private isConnected = false;

  constructor(client: MinimalSupabaseClient) {
    this.client = client;
    this.checkConnection();
  }

  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await this.client.from("_test").select("*").limit(1);
      this.isConnected = !error;
      return this.isConnected;
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  async get<T>(table: string, id?: string): Promise<T[]> {
    if (!this.isConnected) { return []; }

    try {
      let query = this.client.from(table).select("*");

      if (id) {
        query = query.eq("id", id);
      }

      const { data: responseData, error } = await query;

      if (error) { throw error; }

      return (responseData || []) as T[];
    } catch {
      return [];
    }
  }

  async add<T>(table: string, data: T): Promise<T> {
    if (!this.isConnected) { throw new Error("Supabase not connected"); }

    const { data: responseData, error } = await this.client
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) { throw error; }

    return responseData as T;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    if (!this.isConnected) { throw new Error("Supabase not connected"); }

    const { data: responseData, error } = await this.client
      .from(table)
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) { throw error; }

    return responseData as T;
  }

  async delete(table: string, id: string): Promise<boolean> {
    if (!this.isConnected) { throw new Error("Supabase not connected"); }

    const { error } = await this.client.from(table).delete().eq("id", id);

    if (error) { throw error; }

    return true;
  }

  async query<T>(table: string, filters?: Record<string, unknown>): Promise<T[]> {
    if (!this.isConnected) { return []; }

    try {
      let query = this.client.from(table).select("*");

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data: responseData, error } = await query;

      if (error) { throw error; }

      return (responseData || []) as T[];
    } catch {
      return [];
    }
  }

  subscribe<T>(table: string, callback: (data: T[]) => void): () => void {
    if (!this.isConnected) {
      return () => { };
    }

    const channel = this.client
      .channel(`table:${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
        },
        async () => {
          const tableData = await this.get<T>(table);
          callback(tableData);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

// ============================================================
// HybridStorageManager 实现
// ============================================================

export class HybridStorageManager {
  private localStore: LocalStorageStore;
  private remoteStore: SupabaseStore | null = null;
  private config: StorageConfig;
  private syncStatus: SyncStatus = {
    lastSyncTime: null,
    isSyncing: false,
    pendingChanges: 0,
    conflicts: [],
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private subscribers: Map<string, Set<(data: unknown[]) => void>> = new Map();

  constructor(
    supabaseClient: MinimalSupabaseClient | null,
    config: Partial<StorageConfig> = {}
  ) {
    this.config = {
      enableLocalStorage: true,
      enableSupabase: !!supabaseClient,
      syncInterval: 30000,
      syncOnWrite: true,
      conflictResolution: "remote",
      ...config,
    };

    this.localStore = new LocalStorageStore();

    if (this.config.enableSupabase && supabaseClient) {
      this.remoteStore = new SupabaseStore(supabaseClient);
    }

    if (this.config.enableSupabase && this.config.syncInterval > 0) {
      this.startAutoSync();
    }
  }

  private async startAutoSync(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      this.syncAll();
    }, this.config.syncInterval);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  async get<T>(table: string, id?: string): Promise<T[]> {
    if (this.config.enableLocalStorage) {
      return this.localStore.get<T>(table, id);
    }

    if (this.remoteStore) {
      return this.remoteStore.get<T>(table, id);
    }

    return [];
  }

  async add<T>(table: string, data: T): Promise<T> {
    const result = await this.localStore.add<T>(table, data);

    if (this.config.syncOnWrite && this.remoteStore) {
      this.syncStatus.pendingChanges++;
      this.syncTable(table).catch(() => {
        this.syncStatus.pendingChanges--;
      });
    }

    return result;
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    const result = await this.localStore.update<T>(table, id, data);

    if (this.config.syncOnWrite && this.remoteStore) {
      this.syncStatus.pendingChanges++;
      this.syncTable(table).catch(() => {
        this.syncStatus.pendingChanges--;
      });
    }

    return result;
  }

  async delete(table: string, id: string): Promise<boolean> {
    const result = await this.localStore.delete(table, id);

    if (this.config.syncOnWrite && this.remoteStore) {
      this.syncStatus.pendingChanges++;
      this.syncTable(table).catch(() => {
        this.syncStatus.pendingChanges--;
      });
    }

    return result;
  }

  async query<T>(table: string, filters?: Record<string, unknown>): Promise<T[]> {
    if (this.config.enableLocalStorage) {
      return this.localStore.query<T>(table, filters);
    }

    if (this.remoteStore) {
      return this.remoteStore.query<T>(table, filters);
    }

    return [];
  }

  subscribe<T>(table: string, callback: (data: T[]) => void): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }

    this.subscribers.get(table)!.add(callback as (data: unknown[]) => void);

    const unsubscribe = () => {
      const subs = this.subscribers.get(table);
      if (subs) {
        subs.delete(callback as (data: unknown[]) => void);
        if (subs.size === 0) {
          this.subscribers.delete(table);
        }
      }
    };

    if (this.remoteStore) {
      const remoteUnsubscribe = this.remoteStore.subscribe<T>(table, (tableData) => {
        this.localStore.add(table, tableData[0]).catch(() => { });
        this.notifySubscribers(table, tableData);
      });

      return () => {
        remoteUnsubscribe();
        unsubscribe();
      };
    }

    const localUnsubscribe = this.localStore.subscribe<T>(table, (tableData) => {
      this.notifySubscribers(table, tableData);
    });

    return () => {
      localUnsubscribe();
      unsubscribe();
    };
  }

  private notifySubscribers(table: string, data: unknown[]): void {
    const subs = this.subscribers.get(table);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(data);
        } catch { }
      });
    }
  }

  async syncTable(table: string): Promise<void> {
    if (!this.remoteStore || this.syncStatus.isSyncing) {
      return;
    }

    this.syncStatus.isSyncing = true;

    try {
      const localData = await this.localStore.get(table);
      const remoteData = await this.remoteStore.get(table);

      const localIds = new Set(localData.map((item) => (item as StorageRecord).id));
      const remoteIds = new Set(remoteData.map((item) => (item as StorageRecord).id));

      for (const item of localData) {
        const id = (item as StorageRecord).id;

        if (!remoteIds.has(id)) {
          await this.remoteStore!.add(table, item);
        } else {
          const remoteItem = remoteData.find((r) => (r as StorageRecord).id === id);

          if (this.config.conflictResolution === "remote" && remoteItem) {
            const localTimestamp = (item as StorageRecord).updated_at || 0;
            const remoteTimestamp = (remoteItem as StorageRecord).updated_at || 0;

            if (remoteTimestamp > localTimestamp) {
              await this.localStore.update(table, id, remoteItem as Partial<typeof item>);
            } else {
              await this.remoteStore!.update(table, id, item as Partial<StorageRecord>);
            }
          }
        }
      }

      for (const item of remoteData) {
        const id = (item as StorageRecord).id;

        if (!localIds.has(id)) {
          await this.localStore.add(table, item);
        }
      }

      this.syncStatus.lastSyncTime = Date.now();
      this.syncStatus.pendingChanges = Math.max(0, this.syncStatus.pendingChanges - 1);
    } catch {
    } finally {
      this.syncStatus.isSyncing = false;
    }
  }

  async syncAll(): Promise<void> {
    const tables = ["models", "agents", "nodes", "inference_logs"];

    for (const table of tables) {
      await this.syncTable(table);
    }
  }

  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  async getStats(): Promise<StorageStats> {
    let localStorageUsed = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("yyc3_hybrid_")) {
          localStorageUsed += localStorage.getItem(key)?.length || 0;
        }
      }
    } catch { }

    const supabaseConnected = this.remoteStore ? await this.remoteStore.checkConnection() : false;

    return {
      localStorageSize: 5 * 1024 * 1024,
      localStorageUsed,
      supabaseConnected,
      tablesSynced: this.syncStatus.lastSyncTime
        ? ["models", "agents", "nodes", "inference_logs"]
        : [],
    };
  }

  updateConfig(config: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.syncInterval !== undefined) {
      if (this.config.enableSupabase && this.config.syncInterval > 0) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  destroy(): void {
    this.stopAutoSync();
    this.subscribers.clear();
  }
}

// ============================================================
// 单例导出
// ============================================================

let hybridManagerInstance: HybridStorageManager | null = null;

export function initHybridStorage(
  supabaseClient: MinimalSupabaseClient | null,
  config?: Partial<StorageConfig>
): HybridStorageManager {
  if (!hybridManagerInstance) {
    hybridManagerInstance = new HybridStorageManager(supabaseClient, config);
  }
  return hybridManagerInstance;
}

export function getHybridStorage(): HybridStorageManager | null {
  return hybridManagerInstance;
}
