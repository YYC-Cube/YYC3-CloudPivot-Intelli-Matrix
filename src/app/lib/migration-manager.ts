/**
 * @file migration-manager.ts
 * @description YYC³ 版本化数据库迁移管理器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags migration,database,versioning
 */

/**
 * 迁移版本接口
 */
export interface MigrationVersion {
  version: number;
  name: string;
  description: string;
  createdAt: number;
  appliedAt: number | null;
  status: 'pending' | 'applied' | 'failed';
  errorMessage?: string;
}

/**
 * 迁移函数类型
 */
export type MigrationFunction = (
  db: IDBDatabase
) => Promise<void> | void;

/**
 * 迁移定义接口
 */
export interface Migration {
  version: number;
  name: string;
  description: string;
  up: MigrationFunction;
  down?: MigrationFunction;
}

/**
 * 迁移配置接口
 */
export interface MigrationConfig {
  dbName: string;
  storeName: string;
  keyPath: string;
}

/**
 * 迁移管理器类
 */
export class MigrationManager {
  private static instance: MigrationManager;
  private migrations: Map<number, Migration> = new Map();
  private appliedVersions: Set<number> = new Set();
  private config: MigrationConfig;

  private constructor(config: MigrationConfig) {
    this.config = config;
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: MigrationConfig): MigrationManager {
    if (!MigrationManager.instance && config) {
      MigrationManager.instance = new MigrationManager(config);
    }
    return MigrationManager.instance;
  }

  /**
   * 注册迁移
   */
  register(migration: Migration): void {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} already registered`);
    }
    this.migrations.set(migration.version, migration);
  }

  /**
   * 批量注册迁移
   */
  registerBatch(migrations: Migration[]): void {
    for (const migration of migrations) {
      this.register(migration);
    }
  }

  /**
   * 获取所有迁移
   */
  getAllMigrations(): Migration[] {
    return Array.from(this.migrations.values()).sort(
      (a, b) => a.version - b.version
    );
  }

  /**
   * 获取待执行的迁移
   */
  getPendingMigrations(): Migration[] {
    return this.getAllMigrations().filter(
      (migration) => !this.appliedVersions.has(migration.version)
    );
  }

  /**
   * 获取已应用的迁移
   */
  getAppliedMigrations(): Migration[] {
    return this.getAllMigrations().filter((migration) =>
      this.appliedVersions.has(migration.version)
    );
  }

  /**
   * 执行迁移
   */
  async migrate(db: IDBDatabase): Promise<MigrationVersion[]> {
    const pendingMigrations = this.getPendingMigrations();
    const results: MigrationVersion[] = [];

    for (const migration of pendingMigrations) {
      const result: MigrationVersion = {
        version: migration.version,
        name: migration.name,
        description: migration.description,
        createdAt: Date.now(),
        appliedAt: null,
        status: 'pending',
      };

      try {
        console.info(`Applying migration ${migration.version}: ${migration.name}`);
        
        await migration.up(db);
        
        result.appliedAt = Date.now();
        result.status = 'applied';
        this.appliedVersions.add(migration.version);

        await this.saveMigrationRecord(db, result);

        console.info(`Migration ${migration.version} applied successfully`);
      } catch (error) {
        result.status = 'failed';
        result.errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Migration ${migration.version} failed:`,
          error
        );
      }

      results.push(result);
    }

    return results;
  }

  /**
   * 回滚迁移
   */
  async rollback(
    db: IDBDatabase,
    targetVersion: number
  ): Promise<MigrationVersion[]> {
    const appliedMigrations = this.getAppliedMigrations()
      .filter((migration) => migration.version > targetVersion)
      .sort((a, b) => b.version - a.version);

    const results: MigrationVersion[] = [];

    for (const migration of appliedMigrations) {
      if (!migration.down) {
        console.warn(
          `Migration ${migration.version} does not support rollback`
        );
        continue;
      }

      const result: MigrationVersion = {
        version: migration.version,
        name: migration.name,
        description: migration.description,
        createdAt: Date.now(),
        appliedAt: null,
        status: 'pending',
      };

      try {
        console.info(`Rolling back migration ${migration.version}: ${migration.name}`);
        
        await migration.down(db);
        
        this.appliedVersions.delete(migration.version);
        await this.deleteMigrationRecord(db, migration.version);

        console.info(`Migration ${migration.version} rolled back successfully`);
        
        result.status = 'applied';
      } catch (error) {
        result.status = 'failed';
        result.errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Rollback of migration ${migration.version} failed:`,
          error
        );
      }

      results.push(result);
    }

    return results;
  }

  /**
   * 加载已应用的迁移记录
   */
  async loadAppliedMigrations(db: IDBDatabase): Promise<void> {
    const transaction = db.transaction([this.config.storeName], 'readonly');
    const store = transaction.objectStore(this.config.storeName);

    try {
      const request = store.getAll();
      const records = await new Promise<MigrationVersion[]>(
        (resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        }
      );

      for (const record of records) {
        if (record.status === 'applied') {
          this.appliedVersions.add(record.version);
        }
      }
    } catch (error) {
      console.error('Failed to load migration records:', error);
    }
  }

  /**
   * 保存迁移记录
   */
  private async saveMigrationRecord(
    db: IDBDatabase,
    record: MigrationVersion
  ): Promise<void> {
    const transaction = db.transaction([this.config.storeName], 'readwrite');
    const store = transaction.objectStore(this.config.storeName);

    return new Promise<void>((resolve, reject) => {
      const request = store.put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 删除迁移记录
   */
  private async deleteMigrationRecord(
    db: IDBDatabase,
    version: number
  ): Promise<void> {
    const transaction = db.transaction([this.config.storeName], 'readwrite');
    const store = transaction.objectStore(this.config.storeName);

    return new Promise<void>((resolve, reject) => {
      const request = store.delete(version);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): number {
    if (this.appliedVersions.size === 0) {
      return 0;
    }
    return Math.max(...this.appliedVersions);
  }

  /**
   * 获取目标版本
   */
  getTargetVersion(): number {
    if (this.migrations.size === 0) {
      return 0;
    }
    return Math.max(...this.migrations.keys());
  }

  /**
   * 检查是否需要迁移
   */
  needsMigration(): boolean {
    return this.getCurrentVersion() < this.getTargetVersion();
  }

  /**
   * 清空迁移记录
   */
  clear(): void {
    this.appliedVersions.clear();
  }
}

/**
 * 创建迁移存储
 */
export async function createMigrationStore(
  db: IDBDatabase,
  storeName: string,
  keyPath: string
): Promise<void> {
  if (!db.objectStoreNames.contains(storeName)) {
    const objectStore = db.createObjectStore(storeName, {
      keyPath,
      autoIncrement: false,
    });

    objectStore.createIndex('status', 'status', { unique: false });
    objectStore.createIndex('appliedAt', 'appliedAt', { unique: false });
  }
}

/**
 * 导出便捷函数
 */
export function createMigrationManager(
  config: MigrationConfig
): MigrationManager {
  return MigrationManager.getInstance(config);
}
