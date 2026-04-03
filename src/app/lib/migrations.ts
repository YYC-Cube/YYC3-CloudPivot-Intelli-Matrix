/**
 * @file migrations.ts
 * @description YYC³ 数据库迁移定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags migration,database
 */

import { Migration } from './migration-manager';

/**
 * 迁移 1: 初始化基础表结构
 */
export const migrationV1: Migration = {
  version: 1,
  name: 'Initial Schema',
  description: 'Initialize base table structure',
  up: async (db) => {
    if (!db.objectStoreNames.contains('models')) {
      const modelStore = db.createObjectStore('models', {
        keyPath: 'id',
        autoIncrement: false,
      });
      modelStore.createIndex('name', 'name', { unique: false });
      modelStore.createIndex('provider', 'provider', { unique: false });
      modelStore.createIndex('createdAt', 'createdAt', { unique: false });
    }

    if (!db.objectStoreNames.contains('agents')) {
      const agentStore = db.createObjectStore('agents', {
        keyPath: 'id',
        autoIncrement: false,
      });
      agentStore.createIndex('name', 'name', { unique: false });
      agentStore.createIndex('isActive', 'isActive', { unique: false });
    }

    if (!db.objectStoreNames.contains('inferenceLogs')) {
      const logStore = db.createObjectStore('inferenceLogs', {
        keyPath: 'id',
        autoIncrement: false,
      });
      logStore.createIndex('modelId', 'modelId', { unique: false });
      logStore.createIndex('timestamp', 'timestamp', { unique: false });
    }
  },
  down: async (db) => {
    if (db.objectStoreNames.contains('models')) {
      db.deleteObjectStore('models');
    }
    if (db.objectStoreNames.contains('agents')) {
      db.deleteObjectStore('agents');
    }
    if (db.objectStoreNames.contains('inferenceLogs')) {
      db.deleteObjectStore('inferenceLogs');
    }
  },
};

/**
 * 迁移 2: 添加加密支持
 */
export const migrationV2: Migration = {
  version: 2,
  name: 'Add Encryption Support',
  description: 'Add encryption fields to models',
  up: async (db) => {
    const transaction = db.transaction(['models'], 'readwrite');
    const modelStore = transaction.objectStore('models');

    if (!modelStore.indexNames.contains('isEncrypted')) {
      modelStore.createIndex('isEncrypted', 'isEncrypted', {
        unique: false,
      });
    }

    const models = await new Promise<any[]>((resolve, reject) => {
      const request = modelStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const model of models) {
      if (!Object.prototype.hasOwnProperty.call(model, 'isEncrypted')) {
        model.isEncrypted = false;
        modelStore.put(model);
      }
    }
  },
  down: async (db) => {
    const transaction = db.transaction(['models'], 'readwrite');
    const modelStore = transaction.objectStore('models');

    if (modelStore.indexNames.contains('isEncrypted')) {
      modelStore.deleteIndex('isEncrypted');
    }

    const models = await new Promise<any[]>((resolve, reject) => {
      const request = modelStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    for (const model of models) {
      delete model.isEncrypted;
      modelStore.put(model);
    }
  },
};

/**
 * 迁移 3: 添加版本控制
 */
export const migrationV3: Migration = {
  version: 3,
  name: 'Add Version Control',
  description: 'Add version field to all entities',
  up: async (db) => {
    const stores = ['models', 'agents', 'inferenceLogs'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (!store.indexNames.contains('version')) {
        store.createIndex('version', 'version', { unique: false });
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        if (!Object.prototype.hasOwnProperty.call(item, 'version')) {
          item.version = 1;
          store.put(item);
        }
      }
    }
  },
  down: async (db) => {
    const stores = ['models', 'agents', 'inferenceLogs'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (store.indexNames.contains('version')) {
        store.deleteIndex('version');
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        delete item.version;
        store.put(item);
      }
    }
  },
};

/**
 * 迁移 4: 添加同步状态
 */
export const migrationV4: Migration = {
  version: 4,
  name: 'Add Sync Status',
  description: 'Add sync status and timestamp fields',
  up: async (db) => {
    const stores = ['models', 'agents'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (!store.indexNames.contains('syncStatus')) {
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
      }

      if (!store.indexNames.contains('lastSyncedAt')) {
        store.createIndex('lastSyncedAt', 'lastSyncedAt', {
          unique: false,
        });
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        if (!Object.prototype.hasOwnProperty.call(item, 'syncStatus')) {
          item.syncStatus = 'pending';
        }
        if (!Object.prototype.hasOwnProperty.call(item, 'lastSyncedAt')) {
          item.lastSyncedAt = null;
        }
        store.put(item);
      }
    }
  },
  down: async (db) => {
    const stores = ['models', 'agents'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (store.indexNames.contains('syncStatus')) {
        store.deleteIndex('syncStatus');
      }

      if (store.indexNames.contains('lastSyncedAt')) {
        store.deleteIndex('lastSyncedAt');
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        delete item.syncStatus;
        delete item.lastSyncedAt;
        store.put(item);
      }
    }
  },
};

/**
 * 迁移 5: 添加标签支持
 */
export const migrationV5: Migration = {
  version: 5,
  name: 'Add Tags Support',
  description: 'Add tags field and create tags store',
  up: async (db) => {
    if (!db.objectStoreNames.contains('tags')) {
      const tagStore = db.createObjectStore('tags', {
        keyPath: 'id',
        autoIncrement: true,
      });
      tagStore.createIndex('name', 'name', { unique: true });
      tagStore.createIndex('color', 'color', { unique: false });
    }

    const stores = ['models', 'agents'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (!store.indexNames.contains('tags')) {
        store.createIndex('tags', 'tags', {
          unique: false,
          multiEntry: true,
        });
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        if (!Object.prototype.hasOwnProperty.call(item, 'tags')) {
          item.tags = [];
          store.put(item);
        }
      }
    }
  },
  down: async (db) => {
    if (db.objectStoreNames.contains('tags')) {
      db.deleteObjectStore('tags');
    }

    const stores = ['models', 'agents'];

    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      if (store.indexNames.contains('tags')) {
        store.deleteIndex('tags');
      }

      const items = await new Promise<any[]>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      for (const item of items) {
        delete item.tags;
        store.put(item);
      }
    }
  },
};

/**
 * 导出所有迁移
 */
export const migrations: Migration[] = [
  migrationV1,
  migrationV2,
  migrationV3,
  migrationV4,
  migrationV5,
];
