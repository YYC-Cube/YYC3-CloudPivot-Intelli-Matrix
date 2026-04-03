/**
 * @file conflict-resolver.ts
 * @description YYC³ 冲突解决策略实现
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags conflict-resolution,sync,merge
 */

/**
 * 冲突类型
 */
export type ConflictType = 'version' | 'content' | 'timestamp' | 'custom';

/**
 * 冲突解决策略
 */
export type ConflictResolutionStrategy =
  | 'local' // 本地优先
  | 'remote' // 远程优先
  | 'timestamp' // 基于时间戳
  | 'version' // 基于版本号
  | 'priority' // 基于优先级
  | 'merge' // 智能合并
  | 'manual'; // 手动解决

/**
 * 冲突接口
 */
export interface Conflict<T = unknown> {
  id: string;
  table: string;
  entityId: string;
  entityType: string;
  localVersion: T;
  remoteVersion: T;
  localTimestamp: number;
  remoteTimestamp: number;
  localVersionNumber: number;
  remoteVersionNumber: number;
  conflictType: ConflictType;
  detectedAt: number;
  resolvedAt: number | null;
  resolution?: ConflictResolutionStrategy;
  resolvedVersion?: T;
}

/**
 * 合并结果接口
 */
export interface MergeResult<T> {
  success: boolean;
  mergedVersion: T | null;
  conflicts: Array<{
    field: string;
    localValue: unknown;
    remoteValue: unknown;
  }>;
}

/**
 * 冲突解决器配置
 */
export interface ConflictResolverConfig {
  defaultStrategy: ConflictResolutionStrategy;
  autoResolve: boolean;
  mergeStrategy: 'shallow' | 'deep' | 'smart';
  timestampTolerance: number;
  priorityFields: string[];
}

/**
 * 冲突解决器类
 */
export class ConflictResolver {
  private static instance: ConflictResolver;
  private conflicts: Map<string, Conflict> = new Map();
  private config: ConflictResolverConfig;
  private subscribers: Set<(conflict: Conflict) => void> = new Set();

  private constructor(config: Partial<ConflictResolverConfig> = {}) {
    this.config = {
      defaultStrategy: 'timestamp',
      autoResolve: true,
      mergeStrategy: 'smart',
      timestampTolerance: 1000, // 1 秒容差
      priorityFields: ['updatedAt', 'version', 'priority'],
      ...config,
    };
  }

  /**
   * 获取单例实例
   */
  static getInstance(
    config?: Partial<ConflictResolverConfig>
  ): ConflictResolver {
    if (!ConflictResolver.instance && config) {
      ConflictResolver.instance = new ConflictResolver(config);
    }
    return ConflictResolver.instance;
  }

  /**
   * 检测冲突
   */
  detectConflict<T>(
    table: string,
    entityId: string,
    entityType: string,
    localVersion: T,
    remoteVersion: T
  ): Conflict<T> | null {
    const localTimestamp = this.extractTimestamp(localVersion);
    const remoteTimestamp = this.extractTimestamp(remoteVersion);
    const localVersionNumber = this.extractVersionNumber(localVersion);
    const remoteVersionNumber = this.extractVersionNumber(remoteVersion);

    if (localVersionNumber === remoteVersionNumber) {
      return null; // 版本相同，无冲突
    }

    const conflictType = this.determineConflictType(
      localVersion,
      remoteVersion,
      localTimestamp,
      remoteTimestamp
    );

    const conflict: Conflict<T> = {
      id: `${table}-${entityId}-${Date.now()}`,
      table,
      entityId,
      entityType,
      localVersion,
      remoteVersion,
      localTimestamp,
      remoteTimestamp,
      localVersionNumber,
      remoteVersionNumber,
      conflictType,
      detectedAt: Date.now(),
      resolvedAt: null,
    };

    this.conflicts.set(conflict.id, conflict);
    this.notifySubscribers(conflict);

    return conflict;
  }

  /**
   * 解决冲突
   */
  async resolveConflict<T>(
    conflictId: string,
    strategy?: ConflictResolutionStrategy
  ): Promise<T> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict not found: ${conflictId}`);
    }

    const resolutionStrategy =
      strategy || this.config.defaultStrategy;

    let resolvedVersion: T;

    switch (resolutionStrategy) {
      case 'local':
        resolvedVersion = conflict.localVersion as T;
        break;

      case 'remote':
        resolvedVersion = conflict.remoteVersion as T;
        break;

      case 'timestamp':
        resolvedVersion =
          conflict.localTimestamp > conflict.remoteTimestamp
            ? (conflict.localVersion as T)
            : (conflict.remoteVersion as T);
        break;

      case 'version':
        resolvedVersion =
          conflict.localVersionNumber > conflict.remoteVersionNumber
            ? (conflict.localVersion as T)
            : (conflict.remoteVersion as T);
        break;

      case 'priority':
        resolvedVersion = this.resolveByPriority(
          conflict.localVersion as Record<string, unknown>,
          conflict.remoteVersion as Record<string, unknown>
        ) as T;
        break;

      case 'merge': {
        const mergeResult = await this.mergeVersions(
          conflict.localVersion as Record<string, unknown>,
          conflict.remoteVersion as Record<string, unknown>
        );
        resolvedVersion = mergeResult.mergedVersion as T;
        break;
      }

      case 'manual':
        throw new Error(
          'Manual resolution requires user intervention'
        );

      default:
        resolvedVersion = conflict.remoteVersion as T;
    }

    conflict.resolvedAt = Date.now();
    conflict.resolution = resolutionStrategy;
    conflict.resolvedVersion = resolvedVersion;

    return resolvedVersion;
  }

  /**
   * 批量解决冲突
   */
  async resolveConflicts<T>(
    conflictIds: string[],
    strategy?: ConflictResolutionStrategy
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();

    for (const conflictId of conflictIds) {
      try {
        const resolvedVersion = await this.resolveConflict<T>(
          conflictId,
          strategy
        );
        results.set(conflictId, resolvedVersion);
      } catch (error) {
        console.error(
          `Failed to resolve conflict ${conflictId}:`,
          error
        );
      }
    }

    return results;
  }

  /**
   * 自动解决所有冲突
   */
  async autoResolveAllConflicts(): Promise<void> {
    if (!this.config.autoResolve) {
      return;
    }

    const unresolvedConflicts = this.getUnresolvedConflicts();

    for (const conflict of unresolvedConflicts) {
      try {
        await this.resolveConflict(conflict.id);
      } catch (error) {
        console.error(
          `Auto-resolve failed for conflict ${conflict.id}:`,
          error
        );
      }
    }
  }

  /**
   * 合并版本
   */
  async mergeVersions<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T
  ): Promise<MergeResult<T>> {
    const conflicts: Array<{
      field: string;
      localValue: unknown;
      remoteValue: unknown;
    }> = [];

    const mergedVersion: T = {} as T;

    const allKeys = new Set([
      ...Object.keys(localVersion),
      ...Object.keys(remoteVersion),
    ]);

    for (const key of allKeys) {
      const localValue = (localVersion as Record<string, unknown>)[key];
      const remoteValue = (remoteVersion as Record<string, unknown>)[key];

      if (localValue === undefined) {
        (mergedVersion as Record<string, unknown>)[key] = remoteValue;
      } else if (remoteValue === undefined) {
        (mergedVersion as Record<string, unknown>)[key] = localValue;
      } else if (localValue === remoteValue) {
        (mergedVersion as Record<string, unknown>)[key] = localValue;
      } else {
        if (this.config.mergeStrategy === 'smart') {
          const smartMerge = this.smartMerge(
            key,
            localValue,
            remoteValue
          );
          if (smartMerge !== null) {
            (mergedVersion as Record<string, unknown>)[key] = smartMerge;
            continue;
          }
        }

        conflicts.push({
          field: key,
          localValue,
          remoteValue,
        });

        (mergedVersion as Record<string, unknown>)[key] = localValue;
      }
    }

    return {
      success: conflicts.length === 0,
      mergedVersion,
      conflicts,
    };
  }

  /**
   * 智能合并
   */
  private smartMerge(
    key: string,
    localValue: unknown,
    remoteValue: unknown
  ): unknown | null {
    if (this.config.priorityFields.includes(key)) {
      return remoteValue;
    }

    if (typeof localValue === 'number' && typeof remoteValue === 'number') {
      return Math.max(localValue, remoteValue);
    }

    if (Array.isArray(localValue) && Array.isArray(remoteValue)) {
      return [...new Set([...localValue, ...remoteValue])];
    }

    if (
      typeof localValue === 'object' &&
      typeof remoteValue === 'object' &&
      localValue !== null &&
      remoteValue !== null
    ) {
      return {
        ...(localValue as Record<string, unknown>),
        ...(remoteValue as Record<string, unknown>),
      };
    }

    return null;
  }

  /**
   * 基于优先级解决
   */
  private resolveByPriority<T extends Record<string, unknown>>(
    localVersion: T,
    remoteVersion: T
  ): T {
    for (const field of this.config.priorityFields) {
      const localValue = localVersion[field];
      const remoteValue = remoteVersion[field];

      if (localValue !== undefined && remoteValue !== undefined) {
        if (typeof localValue === 'number' && typeof remoteValue === 'number') {
          return localValue > remoteValue ? localVersion : remoteVersion;
        }

        if (typeof localValue === 'string' && typeof remoteValue === 'string') {
          return localValue > remoteValue ? localVersion : remoteVersion;
        }
      }
    }

    return remoteVersion;
  }

  /**
   * 确定冲突类型
   */
  private determineConflictType<T>(
    localVersion: T,
    remoteVersion: T,
    localTimestamp: number,
    remoteTimestamp: number
  ): ConflictType {
    const localVersionNumber = this.extractVersionNumber(localVersion);
    const remoteVersionNumber = this.extractVersionNumber(remoteVersion);

    if (localVersionNumber !== remoteVersionNumber) {
      return 'version';
    }

    if (
      Math.abs(localTimestamp - remoteTimestamp) >
      this.config.timestampTolerance
    ) {
      return 'timestamp';
    }

    if (JSON.stringify(localVersion) !== JSON.stringify(remoteVersion)) {
      return 'content';
    }

    return 'custom';
  }

  /**
   * 提取时间戳
   */
  private extractTimestamp<T>(version: T): number {
    if (typeof version === 'object' && version !== null) {
      const obj = version as Record<string, unknown>;
      return (obj.updatedAt as number) ||
             (obj.timestamp as number) ||
             (obj.createdAt as number) ||
             0;
    }
    return 0;
  }

  /**
   * 提取版本号
   */
  private extractVersionNumber<T>(version: T): number {
    if (typeof version === 'object' && version !== null) {
      const obj = version as Record<string, unknown>;
      return (obj.version as number) || 0;
    }
    return 0;
  }

  /**
   * 获取所有冲突
   */
  getAllConflicts(): Conflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * 获取未解决的冲突
   */
  getUnresolvedConflicts(): Conflict[] {
    return this.getAllConflicts().filter(
      (conflict) => conflict.resolvedAt === null
    );
  }

  /**
   * 获取已解决的冲突
   */
  getResolvedConflicts(): Conflict[] {
    return this.getAllConflicts().filter(
      (conflict) => conflict.resolvedAt !== null
    );
  }

  /**
   * 按表获取冲突
   */
  getConflictsByTable(table: string): Conflict[] {
    return this.getAllConflicts().filter(
      (conflict) => conflict.table === table
    );
  }

  /**
   * 按类型获取冲突
   */
  getConflictsByType(conflictType: ConflictType): Conflict[] {
    return this.getAllConflicts().filter(
      (conflict) => conflict.conflictType === conflictType
    );
  }

  /**
   * 获取冲突统计
   */
  getConflictStats(): {
    total: number;
    unresolved: number;
    resolved: number;
    byType: Record<ConflictType, number>;
    byTable: Record<string, number>;
  } {
    const conflicts = this.getAllConflicts();
    const byType: Record<ConflictType, number> = {
      version: 0,
      content: 0,
      timestamp: 0,
      custom: 0,
    };
    const byTable: Record<string, number> = {};

    for (const conflict of conflicts) {
      byType[conflict.conflictType]++;

      if (!byTable[conflict.table]) {
        byTable[conflict.table] = 0;
      }
      byTable[conflict.table]++;
    }

    return {
      total: conflicts.length,
      unresolved: this.getUnresolvedConflicts().length,
      resolved: this.getResolvedConflicts().length,
      byType,
      byTable,
    };
  }

  /**
   * 清除冲突
   */
  clearConflicts(): void {
    this.conflicts.clear();
  }

  /**
   * 清除已解决的冲突
   */
  clearResolvedConflicts(): void {
    const unresolved = this.getUnresolvedConflicts();
    this.conflicts.clear();

    for (const conflict of unresolved) {
      this.conflicts.set(conflict.id, conflict);
    }
  }

  /**
   * 订阅冲突更新
   */
  subscribe(callback: (conflict: Conflict) => void): () => void {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * 通知订阅者
   */
  private notifySubscribers(conflict: Conflict): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(conflict);
      } catch (error) {
        console.error('Error in conflict resolver subscriber:', error);
      }
    }
  }

  /**
   * 导出冲突
   */
  exportConflicts(): string {
    return JSON.stringify(this.getAllConflicts(), null, 2);
  }

  /**
   * 导入冲突
   */
  importConflicts(json: string): void {
    try {
      const conflicts = JSON.parse(json) as Conflict[];
      for (const conflict of conflicts) {
        this.conflicts.set(conflict.id, conflict);
      }
    } catch (error) {
      console.error('Failed to import conflicts:', error);
    }
  }

  /**
   * 生成冲突报告
   */
  generateReport(): string {
    const stats = this.getConflictStats();
    const unresolved = this.getUnresolvedConflicts();

    let report = '=== Conflict Resolution Report ===\n\n';
    report += `Total Conflicts: ${stats.total}\n`;
    report += `Unresolved: ${stats.unresolved}\n`;
    report += `Resolved: ${stats.resolved}\n\n`;

    report += '=== By Type ===\n';
    for (const [type, count] of Object.entries(stats.byType)) {
      report += `${type}: ${count}\n`;
    }

    report += '\n=== By Table ===\n';
    for (const [table, count] of Object.entries(stats.byTable)) {
      report += `${table}: ${count}\n`;
    }

    if (unresolved.length > 0) {
      report += '\n=== Unresolved Conflicts ===\n';
      for (const conflict of unresolved) {
        report += `\n${conflict.id}:\n`;
        report += `  Table: ${conflict.table}\n`;
        report += `  Entity: ${conflict.entityId}\n`;
        report += `  Type: ${conflict.conflictType}\n`;
        report += `  Detected: ${new Date(
          conflict.detectedAt
        ).toLocaleString()}\n`;
      }
    }

    return report;
  }
}

/**
 * 导出单例实例
 */
export const conflictResolver = ConflictResolver.getInstance();

/**
 * 便捷函数：检测冲突
 */
export function detectConflict<T>(
  table: string,
  entityId: string,
  entityType: string,
  localVersion: T,
  remoteVersion: T
): Conflict<T> | null {
  return conflictResolver.detectConflict(
    table,
    entityId,
    entityType,
    localVersion,
    remoteVersion
  );
}

/**
 * 便捷函数：解决冲突
 */
export async function resolveConflict<T>(
  conflictId: string,
  strategy?: ConflictResolutionStrategy
): Promise<T> {
  return conflictResolver.resolveConflict<T>(conflictId, strategy);
}

/**
 * 便捷函数：合并版本
 */
export async function mergeVersions<T extends Record<string, unknown>>(
  localVersion: T,
  remoteVersion: T
): Promise<MergeResult<T>> {
  return conflictResolver.mergeVersions(localVersion, remoteVersion);
}
