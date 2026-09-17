/**
 * migrations.test.ts
 * ================
 * 数据库迁移定义 - 单元测试
 *
 * 测试策略（W1 P0 攻坚）：
 * - 内存版 IDBDatabase mock 驱动 migrationV1~V5 的 up/down 全路径
 * - 结构变更断言（objectStore/index 创建与删除）
 * - 数据回填断言（isEncrypted/version/syncStatus/tags 字段注入）
 * - 迁移元数据完整性（version 单调、名称描述非空）
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { Migration } from '../lib/migration-manager';
import {
  migrationV1,
  migrationV2,
  migrationV3,
  migrationV4,
  migrationV5,
  migrations,
} from '../lib/migrations';

// ============================================================
// 内存版 IndexedDB Mock
// ============================================================

class MockIndex {
  constructor(
    public name: string,
    public keyPath: string,
    public options: { unique?: boolean; multiEntry?: boolean } = {}
  ) { }
}

class MockObjectStore {
  indexes = new Map<string, MockIndex>();
  records: Record<string, unknown>[] = [];
  puts: Record<string, unknown>[] = [];

  constructor(
    public name: string,
    public keyPath: string | null,
    public autoIncrement: boolean
  ) { }

  indexNames = {
    contains: (name: string) => this.indexes.has(name),
  };

  createIndex(name: string, keyPath: string, options?: { unique?: boolean; multiEntry?: boolean }) {
    this.indexes.set(name, new MockIndex(name, keyPath, options));
    return this.indexes.get(name)!;
  }

  deleteIndex(name: string) {
    this.indexes.delete(name);
  }

  getAll() {
    return this.makeRequest(this.records.map((r) => ({ ...r })));
  }

  put(record: Record<string, unknown>) {
    this.puts.push({ ...record });
    const key = this.keyPath ? (record as { id?: string }).id : undefined;
    const idx = key !== undefined ? this.records.findIndex((r) => (r as { id?: string }).id === key) : -1;
    if (idx >= 0) {
      this.records[idx] = { ...record };
    } else {
      this.records.push({ ...record });
    }
    return this.makeRequest(undefined);
  }

  /** 构造 IDBRequest 形状的 thenable（onsuccess/onerror 模式） */
  private makeRequest<T>(result: T) {
    const request = {
      result,
      onsuccess: null as (() => void) | null,
      onerror: null as (() => void) | null,
      error: null as unknown,
    };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  }
}

class MockDB {
  stores = new Map<string, MockObjectStore>();

  objectStoreNames = {
    contains: (name: string) => this.stores.has(name),
  };

  createObjectStore(name: string, options: { keyPath: string; autoIncrement: boolean }) {
    const store = new MockObjectStore(name, options.keyPath, options.autoIncrement);
    this.stores.set(name, store);
    return store;
  }

  deleteObjectStore(name: string) {
    this.stores.delete(name);
  }

  transaction(storeNames: string[], _mode?: string) {
    const stores = storeNames.map((n) => {
      const s = this.stores.get(n);
      if (!s) { throw new Error(`store not found: ${n}`); }
      return s;
    });
    return {
      objectStore: (name: string) => {
        const s = stores.find((x) => x.name === name);
        if (!s) { throw new Error(`store not found in tx: ${name}`); }
        return s;
      },
    };
  }

  /** 便捷方法：注入初始记录 */
  seed(storeName: string, records: Record<string, unknown>[]) {
    const store = this.stores.get(storeName);
    if (!store) { throw new Error(`store not found: ${storeName}`); }
    store.records.push(...records);
  }
}

function createMockDB(): MockDB {
  return new MockDB();
}

/** 预置 V1 结构（供 V2~V5 测试使用） */
async function setupBaseSchema(db: MockDB) {
  await migrationV1.up(db as unknown as IDBDatabase);
  db.seed('models', [
    { id: 'm-1', name: 'GPT-5' },
    { id: 'm-2', name: 'Claude-5' },
  ]);
  db.seed('agents', [{ id: 'a-1', name: 'agent-x' }]);
  db.seed('inferenceLogs', [{ id: 'log-1' }]);
}

// ============================================================
// 迁移元数据完整性
// ============================================================

describe('migrations 元数据', () => {
  it('包含全部 5 个迁移且按版本升序', () => {
    expect(migrations).toHaveLength(5);
    expect(migrations.map((m) => m.version)).toEqual([1, 2, 3, 4, 5]);
  });

  it('每个迁移的 name/description 非空且 up 函数存在', () => {
    for (const m of migrations) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
      expect(typeof m.up).toBe('function');
    }
  });

  it('V1~V5 均支持 down 回滚', () => {
    for (const m of migrations) {
      expect(typeof m.down).toBe('function');
    }
  });
});

// ============================================================
// Migration V1: 初始化基础表结构
// ============================================================

describe('migrationV1 - Initial Schema', () => {
  let db: MockDB;

  beforeEach(() => {
    db = createMockDB();
  });

  it('up: 创建 models/agents/inferenceLogs 三个 store 及索引', async () => {
    await migrationV1.up(db as unknown as IDBDatabase);

    expect(db.stores.has('models')).toBe(true);
    expect(db.stores.has('agents')).toBe(true);
    expect(db.stores.has('inferenceLogs')).toBe(true);

    const models = db.stores.get('models')!;
    expect(models.keyPath).toBe('id');
    expect(models.indexes.has('name')).toBe(true);
    expect(models.indexes.has('provider')).toBe(true);
    expect(models.indexes.has('createdAt')).toBe(true);

    const agents = db.stores.get('agents')!;
    expect(agents.indexes.has('isActive')).toBe(true);

    const logs = db.stores.get('inferenceLogs')!;
    expect(logs.indexes.has('modelId')).toBe(true);
    expect(logs.indexes.has('timestamp')).toBe(true);
  });

  it('up: 幂等 - 已存在的 store 不重复创建', async () => {
    await migrationV1.up(db as unknown as IDBDatabase);
    // 第二次执行不应抛错，也不应覆盖已有 store
    await migrationV1.up(db as unknown as IDBDatabase);

    expect(db.stores.size).toBe(3);
  });

  it('down: 删除全部三个 store', async () => {
    await migrationV1.up(db as unknown as IDBDatabase);
    await migrationV1.down!(db as unknown as IDBDatabase);

    expect(db.stores.size).toBe(0);
  });
});

// ============================================================
// Migration V2: 添加加密支持
// ============================================================

describe('migrationV2 - Add Encryption Support', () => {
  let db: MockDB;

  beforeEach(async () => {
    db = createMockDB();
    await setupBaseSchema(db);
  });

  it('up: 为缺失 isEncrypted 的模型注入 false 并创建索引', async () => {
    await migrationV2.up(db as unknown as IDBDatabase);

    const models = db.stores.get('models')!;
    expect(models.indexes.has('isEncrypted')).toBe(true);
    // 两条记录均被回填
    expect(models.puts).toHaveLength(2);
    expect(models.puts.every((r) => r.isEncrypted === false)).toBe(true);
    // 已有字段不被覆盖
    db.seed('models', []);
  });

  it('up: 已有 isEncrypted 值的记录不被覆盖', async () => {
    db.seed('models', []);
    const store = db.stores.get('models')!;
    store.records = [
      { id: 'm-1', name: 'GPT-5' },
      { id: 'm-2', name: 'Encrypted', isEncrypted: true },
    ];
    store.puts = [];

    await migrationV2.up(db as unknown as IDBDatabase);

    const encrypted = store.puts.find((r) => r.id === 'm-2');
    const plain = store.puts.find((r) => r.id === 'm-1');
    expect(encrypted).toBeUndefined(); // 已有字段 → 不回写
    expect(plain?.isEncrypted).toBe(false);
  });

  it('down: 删除 isEncrypted 索引并移除记录字段', async () => {
    await migrationV2.up(db as unknown as IDBDatabase);
    const store = db.stores.get('models')!;
    store.puts = [];
    await migrationV2.down!(db as unknown as IDBDatabase);

    expect(store.indexes.has('isEncrypted')).toBe(false);
    expect(store.puts.length).toBe(2);
    expect(store.puts.every((r) => !('isEncrypted' in r))).toBe(true);
  });
});

// ============================================================
// Migration V3: 添加版本控制
// ============================================================

describe('migrationV3 - Add Version Control', () => {
  let db: MockDB;

  beforeEach(async () => {
    db = createMockDB();
    await setupBaseSchema(db);
  });

  it('up: 三个 store 全部创建 version 索引并回填 version=1', async () => {
    await migrationV3.up(db as unknown as IDBDatabase);

    for (const name of ['models', 'agents', 'inferenceLogs']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.has('version')).toBe(true);
      expect(store.puts.length).toBeGreaterThan(0);
      expect(store.puts.every((r) => r.version === 1)).toBe(true);
    }
  });

  it('down: 移除 version 索引与字段', async () => {
    await migrationV3.up(db as unknown as IDBDatabase);
    for (const name of ['models', 'agents', 'inferenceLogs']) {
      db.stores.get(name)!.puts = [];
    }

    await migrationV3.down!(db as unknown as IDBDatabase);

    for (const name of ['models', 'agents', 'inferenceLogs']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.has('version')).toBe(false);
      expect(store.puts.every((r) => !('version' in r))).toBe(true);
    }
  });
});

// ============================================================
// Migration V4: 添加同步状态
// ============================================================

describe('migrationV4 - Add Sync Status', () => {
  let db: MockDB;

  beforeEach(async () => {
    db = createMockDB();
    await setupBaseSchema(db);
  });

  it('up: models/agents 注入 syncStatus 与 lastSyncedAt 并创建双索引', async () => {
    await migrationV4.up(db as unknown as IDBDatabase);

    for (const name of ['models', 'agents']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.has('syncStatus')).toBe(true);
      expect(store.indexes.has('lastSyncedAt')).toBe(true);
      expect(store.puts.every((r) => r.syncStatus === 'pending')).toBe(true);
      expect(store.puts.every((r) => r.lastSyncedAt === null)).toBe(true);
    }
    // inferenceLogs 不在 V4 范围内
    expect(db.stores.get('inferenceLogs')!.indexes.has('syncStatus')).toBe(false);
  });

  it('down: 移除 syncStatus/lastSyncedAt 索引与字段', async () => {
    await migrationV4.up(db as unknown as IDBDatabase);
    for (const name of ['models', 'agents']) {
      db.stores.get(name)!.puts = [];
    }

    await migrationV4.down!(db as unknown as IDBDatabase);

    for (const name of ['models', 'agents']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.has('syncStatus')).toBe(false);
      expect(store.indexes.has('lastSyncedAt')).toBe(false);
      expect(store.puts.every((r) => !('syncStatus' in r) && !('lastSyncedAt' in r))).toBe(true);
    }
  });
});

// ============================================================
// Migration V5: 添加标签支持
// ============================================================

describe('migrationV5 - Add Tags Support', () => {
  let db: MockDB;

  beforeEach(async () => {
    db = createMockDB();
    await setupBaseSchema(db);
  });

  it('up: 创建 tags store + multiEntry 索引并回填空数组', async () => {
    await migrationV5.up(db as unknown as IDBDatabase);

    const tags = db.stores.get('tags')!;
    expect(tags.keyPath).toBe('id');
    expect(tags.autoIncrement).toBe(true);
    expect(tags.indexes.get('name')?.options.unique).toBe(true);
    expect(tags.indexes.get('color')?.options.unique).toBe(false);

    for (const name of ['models', 'agents']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.get('tags')?.options.multiEntry).toBe(true);
      expect(store.puts.every((r) => Array.isArray(r.tags) && r.tags.length === 0)).toBe(true);
    }
  });

  it('down: 删除 tags store 并移除 tags 字段', async () => {
    await migrationV5.up(db as unknown as IDBDatabase);
    for (const name of ['models', 'agents']) {
      db.stores.get(name)!.puts = [];
    }

    await migrationV5.down!(db as unknown as IDBDatabase);

    expect(db.stores.has('tags')).toBe(false);
    for (const name of ['models', 'agents']) {
      const store = db.stores.get(name)!;
      expect(store.indexes.has('tags')).toBe(false);
      expect(store.puts.every((r) => !('tags' in r))).toBe(true);
    }
  });
});

// ============================================================
// up/down 往返一致性（快照式结构断言）
// ============================================================

describe('迁移往返一致性', () => {
  it('V1 up → down → up 结构稳定', async () => {
    const db = createMockDB();
    const idb = db as unknown as IDBDatabase;

    await migrationV1.up(idb);
    await migrationV1.down!(idb);
    await migrationV1.up(idb);

    expect(db.stores.size).toBe(3);
  });

  it('全量迁移链 up 后版本结构齐备（回归快照）', async () => {
    const db = createMockDB();
    const idb = db as unknown as IDBDatabase;

    for (const m of migrations as Migration[]) {
      await m.up(idb);
    }

    const expectedIndexes: Record<string, string[]> = {
      models: ['name', 'provider', 'createdAt', 'isEncrypted', 'version', 'syncStatus', 'lastSyncedAt', 'tags'],
      agents: ['name', 'isActive', 'version', 'syncStatus', 'lastSyncedAt', 'tags'],
      inferenceLogs: ['modelId', 'timestamp', 'version'],
      tags: ['name', 'color'],
    };

    for (const [storeName, idx] of Object.entries(expectedIndexes)) {
      const store = db.stores.get(storeName);
      expect(store, storeName).toBeDefined();
      expect([...store!.indexes.keys()].sort()).toEqual([...idx].sort());
    }
  });
});
