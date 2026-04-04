/**
 * @file storage-enhancement-guide.md
 * @description YYC³ 存储架构增强功能使用指南
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags storage,encryption,migration,monitoring,conflict-resolution
 */

# YYC³ 存储架构增强功能使用指南

## 📋 目录

- [数据加密服务](#数据加密服务)
- [版本化数据库迁移](#版本化数据库迁移)
- [查询性能监控](#查询性能监控)
- [冲突解决策略](#冲突解决策略)

---

## 🔐 数据加密服务

### 功能概述

基于 Web Crypto API 的数据加密/解密服务，支持：
- AES-GCM 加密算法
- 密钥派生（PBKDF2）
- 主密钥管理
- 数据完整性验证
- 批量加密/解密

### 文件位置

`src/app/lib/encryption-service.ts`

### 基本使用

```typescript
import { encryptionService, encryptData, decryptData } from './lib/encryption-service';

// 1. 初始化加密服务（生成主密钥）
await encryptionService.generateMasterKey();

// 2. 加密数据
const encrypted = await encryptData('敏感数据');
console.log(encrypted);
// {
//   encrypted: "base64加密字符串",
//   salt: "base64盐值",
//   iv: "base64初始化向量",
//   algorithm: "AES-GCM",
//   keyLength: 256
// }

// 3. 解密数据
const decrypted = await decryptData(encrypted);
console.log(decrypted); // "敏感数据"
```

### 使用密码加密

```typescript
import { encryptData, decryptData } from './lib/encryption-service';

// 使用密码加密
const encrypted = await encryptData('敏感数据', 'my-password');

// 使用密码解密
const decrypted = await decryptData(encrypted, 'my-password');
```

### 加密对象

```typescript
import { encryptObject, decryptObject } from './lib/encryption-service';

const data = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
};

// 加密对象
const encrypted = await encryptObject(data);

// 解密对象
const decrypted = await decryptObject<typeof data>(encrypted);
console.log(decrypted);
// { name: 'John Doe', email: 'john@example.com', age: 30 }
```

### 批量加密

```typescript
import { encryptionService } from './lib/encryption-service';

const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
];

// 批量加密
const encryptedItems = await encryptionService.encryptBatch(items);

// 批量解密
const decryptedItems = await encryptionService.decryptBatch(encryptedItems);
```

### 数据哈希

```typescript
import { encryptionService } from './lib/encryption-service';

// 计算数据哈希
const hash = await encryptionService.hash('重要数据');
console.log(hash); // "a1b2c3d4e5f6..."

// 验证数据完整性
const isValid = await encryptionService.verifyIntegrity('重要数据', hash);
console.log(isValid); // true
```

### 密钥管理

```typescript
import { encryptionService } from './lib/encryption-service';

// 检查是否已初始化
if (!encryptionService.isInitialized()) {
  await encryptionService.generateMasterKey();
}

// 清除主密钥
encryptionService.clearMasterKey();

// 生成随机密码
const password = encryptionService.generateRandomPassword(32);
console.log(password); // "aB3$x9Km2@Lp#7QrT8vNw5"
```

---

## 🔄 版本化数据库迁移

### 功能概述

完整的数据库迁移管理系统，支持：
- 版本化迁移
- 向前/向后迁移
- 迁移历史记录
- 自动迁移执行
- 迁移回滚

### 文件位置

- `src/app/lib/migration-manager.ts` - 迁移管理器
- `src/app/lib/migrations.ts` - 迁移定义

### 基本使用

```typescript
import { createMigrationManager } from './lib/migration-manager';
import { migrations } from './lib/migrations';

// 1. 创建迁移管理器
const migrationManager = createMigrationManager({
  dbName: 'YYC3DB',
  storeName: 'migrations',
  keyPath: 'version',
});

// 2. 注册迁移
migrationManager.registerBatch(migrations);

// 3. 打开数据库
const request = indexedDB.open('YYC3DB', 5); // 最高版本号

request.onupgradeneeded = async (event) => {
  const db = request.result;
  
  // 创建迁移存储
  await createMigrationStore(db, 'migrations', 'version');
  
  // 加载已应用的迁移
  await migrationManager.loadAppliedMigrations(db);
  
  // 执行待执行的迁移
  const results = await migrationManager.migrate(db);
  
  console.log('Migration results:', results);
};

request.onsuccess = () => {
  console.log('Database opened successfully');
};
```

### 定义迁移

```typescript
import { Migration } from './lib/migration-manager';

export const migrationV1: Migration = {
  version: 1,
  name: 'Initial Schema',
  description: 'Initialize base table structure',
  up: async (db) => {
    // 创建表
    if (!db.objectStoreNames.contains('models')) {
      const store = db.createObjectStore('models', {
        keyPath: 'id',
        autoIncrement: false,
      });
      store.createIndex('name', 'name', { unique: false });
      store.createIndex('createdAt', 'createdAt', { unique: false });
    }
  },
  down: async (db) => {
    // 回滚迁移
    if (db.objectStoreNames.contains('models')) {
      db.deleteObjectStore('models');
    }
  },
};
```

### 迁移操作

```typescript
import { migrationManager } from './lib/migration-manager';

// 获取所有迁移
const allMigrations = migrationManager.getAllMigrations();

// 获取待执行的迁移
const pendingMigrations = migrationManager.getPendingMigrations();

// 获取已应用的迁移
const appliedMigrations = migrationManager.getAppliedMigrations();

// 检查是否需要迁移
if (migrationManager.needsMigration()) {
  console.log('Migration needed!');
}

// 获取当前版本
const currentVersion = migrationManager.getCurrentVersion();

// 获取目标版本
const targetVersion = migrationManager.getTargetVersion();
```

### 回滚迁移

```typescript
import { migrationManager } from './lib/migration-manager';

// 回滚到指定版本
const results = await migrationManager.rollback(db, 2);

console.log('Rollback results:', results);
```

### 清空迁移记录

```typescript
import { migrationManager } from './lib/migration-manager';

// 清空所有迁移记录
migrationManager.clear();
```

---

## 📊 查询性能监控

### 功能概述

全面的查询性能监控系统，支持：
- 查询指标记录
- 性能统计分析
- 慢查询检测
- 缓存命中率统计
- 按表/操作分组统计
- 性能报告生成

### 文件位置

`src/app/lib/query-monitor.ts`

### 基本使用

```typescript
import { queryMonitor, monitorQuery } from './lib/query-monitor';

// 1. 包装查询函数
const data = await monitorQuery(
  'SELECT * FROM models',
  'models',
  'get',
  async () => {
    const result = await db.getAll('models');
    return { data: result, cacheHit: false };
  }
);

console.log(data);
```

### 手动监控

```typescript
import { queryMonitor } from './lib/query-monitor';

// 1. 开始监控
const queryId = queryMonitor.startQuery(
  'SELECT * FROM models',
  'models',
  'get'
);

// 2. 执行查询
const startTime = Date.now();
const result = await db.getAll('models');

// 3. 结束监控
queryMonitor.endQuery(
  queryId,
  'SELECT * FROM models',
  'models',
  'get',
  startTime,
  false, // cacheHit
  result.length, // resultCount
  true, // success
);
```

### 获取性能统计

```typescript
import { queryMonitor, getQueryStats } from './lib/query-monitor';

// 获取总体统计
const stats = getQueryStats();
console.log(stats);
// {
//   totalQueries: 1000,
//   successfulQueries: 990,
//   failedQueries: 10,
//   averageDuration: 45.5,
//   minDuration: 10,
//   maxDuration: 2000,
//   cacheHitRate: 0.85,
//   slowQueries: 5,
//   slowQueryThreshold: 1000
// }

// 按表分组统计
const statsByTable = queryMonitor.getStatsByTable();
console.log(statsByTable);
// Map {
//   'models' => PerformanceStats,
//   'agents' => PerformanceStats,
//   ...
// }

// 按操作分组统计
const statsByOperation = queryMonitor.getStatsByOperation();
console.log(statsByOperation);
// Map {
//   'get' => PerformanceStats,
//   'add' => PerformanceStats,
//   ...
// }
```

### 慢查询检测

```typescript
import { queryMonitor } from './lib/query-monitor';

// 获取所有慢查询
const slowQueries = queryMonitor.getSlowQueries();

for (const query of slowQueries) {
  console.log(`Slow query detected:`);
  console.log(`  Table: ${query.table}`);
  console.log(`  Operation: ${query.operation}`);
  console.log(`  Duration: ${query.duration}ms`);
  console.log(`  Query: ${query.query}`);
}
```

### 失败查询分析

```typescript
import { queryMonitor } from './lib/query-monitor';

// 获取失败的查询
const failedQueries = queryMonitor.getFailedQueries();

for (const query of failedQueries) {
  console.log(`Failed query:`);
  console.log(`  Table: ${query.table}`);
  console.log(`  Error: ${query.errorMessage}`);
  console.log(`  Query: ${query.query}`);
}
```

### 生成性能报告

```typescript
import { generatePerformanceReport } from './lib/query-monitor';

// 生成性能报告
const report = generatePerformanceReport();
console.log(report);

// === Query Performance Report ===
// 
// Total Queries: 1000
// Successful: 990
// Failed: 10
// Average Duration: 45.50ms
// Min Duration: 10ms
// Max Duration: 2000ms
// Cache Hit Rate: 85.00%
// Slow Queries: 5
// 
// === By Table ===
// 
// models:
//   Total: 500
//   Avg: 40.25ms
//   Cache Hit: 90.00%
// 
// agents:
//   Total: 300
//   Avg: 50.00ms
//   Cache Hit: 80.00%
// 
// === By Operation ===
// 
// get:
//   Total: 700
//   Avg: 35.00ms
//   Cache Hit: 85.00%
// 
// add:
//   Total: 200
//   Avg: 60.00ms
//   Cache Hit: 80.00%
```

### 订阅性能指标

```typescript
import { queryMonitor } from './lib/query-monitor';

// 订阅每个查询的性能指标
const unsubscribe = queryMonitor.subscribe((metric) => {
  console.log('Query completed:', metric);
  
  if (metric.duration > 1000) {
    console.warn('Slow query detected!', metric);
  }
});

// 取消订阅
unsubscribe();
```

### 导出/导入指标

```typescript
import { queryMonitor } from './lib/query-monitor';

// 导出指标
const json = queryMonitor.exportMetrics();
console.log(json);

// 导入指标
queryMonitor.importMetrics(json);
```

---

## ⚔️ 冲突解决策略

### 功能概述

高级冲突解决系统，支持：
- 多种解决策略（本地/远程/时间戳/版本/优先级/合并/手动）
- 智能合并算法
- 冲突检测
- 冲突历史记录
- 冲突统计分析

### 文件位置

`src/app/lib/conflict-resolver.ts`

### 基本使用

```typescript
import { conflictResolver, detectConflict, resolveConflict } from './lib/conflict-resolver';

// 1. 检测冲突
const conflict = detectConflict(
  'models',
  'm-1',
  'Model',
  localVersion,
  remoteVersion
);

if (conflict) {
  console.log('Conflict detected:', conflict);
  // {
  //   id: "models-m-1-1712000000000",
  //   table: "models",
  //   entityId: "m-1",
  //   entityType: "Model",
  //   localVersion: {...},
  //   remoteVersion: {...},
  //   localTimestamp: 1712000000000,
  //   remoteTimestamp: 1712000001000,
  //   localVersionNumber: 1,
  //   remoteVersionNumber: 2,
  //   conflictType: "version",
  //   detectedAt: 1712000002000,
  //   resolvedAt: null
  // }
}
```

### 解决冲突

```typescript
import { resolveConflict } from './lib/conflict-resolver';

// 使用默认策略解决
const resolvedVersion = await resolveConflict(conflict.id);

// 使用指定策略解决
const resolvedVersion = await resolveConflict(
  conflict.id,
  'timestamp' // 策略：local | remote | timestamp | version | priority | merge | manual
);

console.log('Resolved version:', resolvedVersion);
```

### 冲突解决策略

#### 1. 本地优先（local）

```typescript
const resolvedVersion = await resolveConflict(conflict.id, 'local');
// 始终使用本地版本
```

#### 2. 远程优先（remote）

```typescript
const resolvedVersion = await resolveConflict(conflict.id, 'remote');
// 始终使用远程版本
```

#### 3. 基于时间戳（timestamp）

```typescript
const resolvedVersion = await resolveConflict(conflict.id, 'timestamp');
// 使用更新时间戳的版本
```

#### 4. 基于版本号（version）

```typescript
const resolvedVersion = await resolveConflict(conflict.id, 'version');
// 使用更高版本号的版本
```

#### 5. 基于优先级（priority）

```typescript
const resolvedVersion = await resolveConflict(conflict.id, 'priority');
// 基于优先级字段解决
```

#### 6. 智能合并（merge）

```typescript
import { mergeVersions } from './lib/conflict-resolver';

const result = await mergeVersions(localVersion, remoteVersion);
console.log(result);
// {
//   success: true,
//   mergedVersion: {...},
//   conflicts: [
//     {
//       field: 'name',
//       localValue: 'Local Name',
//       remoteValue: 'Remote Name'
//     }
//   ]
// }

if (result.success) {
  console.log('Merge successful:', result.mergedVersion);
} else {
  console.log('Merge conflicts:', result.conflicts);
}
```

### 批量解决冲突

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 获取未解决的冲突
const unresolvedConflicts = conflictResolver.getUnresolvedConflicts();

// 批量解决
const conflictIds = unresolvedConflicts.map(c => c.id);
const resolvedVersions = await conflictResolver.resolveConflicts(conflictIds, 'timestamp');

console.log('Resolved versions:', resolvedVersions);
```

### 自动解决所有冲突

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 自动解决所有未解决的冲突
await conflictResolver.autoResolveAllConflicts();
```

### 冲突统计分析

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 获取冲突统计
const stats = conflictResolver.getConflictStats();
console.log(stats);
// {
//   total: 10,
//   unresolved: 3,
//   resolved: 7,
//   byType: {
//     version: 5,
//     content: 3,
//     timestamp: 2,
//     custom: 0
//   },
//   byTable: {
//     models: 6,
//     agents: 4
//   }
// }

// 按表获取冲突
const conflictsByTable = conflictResolver.getConflictsByTable('models');

// 按类型获取冲突
const conflictsByType = conflictResolver.getConflictsByType('version');
```

### 生成冲突报告

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 生成冲突报告
const report = conflictResolver.generateReport();
console.log(report);

// === Conflict Resolution Report ===
// 
// Total Conflicts: 10
// Unresolved: 3
// Resolved: 7
// 
// === By Type ===
// version: 5
// content: 3
// timestamp: 2
// custom: 0
// 
// === By Table ===
// models: 6
// agents: 4
// 
// === Unresolved Conflicts ===
// 
// models-m-1-1712000000000:
//   Table: models
//   Entity: m-1
//   Type: version
//   Detected: 2026-04-01 12:00:00
```

### 订阅冲突更新

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 订阅冲突更新
const unsubscribe = conflictResolver.subscribe((conflict) => {
  console.log('New conflict detected:', conflict);
  
  // 自动解决
  if (conflictResolver.config.autoResolve) {
    conflictResolver.resolveConflict(conflict.id);
  }
});

// 取消订阅
unsubscribe();
```

### 导出/导入冲突

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 导出冲突
const json = conflictResolver.exportConflicts();
console.log(json);

// 导入冲突
conflictResolver.importConflicts(json);
```

### 清理冲突

```typescript
import { conflictResolver } from './lib/conflict-resolver';

// 清除所有冲突
conflictResolver.clearConflicts();

// 只清除已解决的冲突
conflictResolver.clearResolvedConflicts();
```

---

## 🔗 集成到 HybridStorageManager

### 集成加密服务

```typescript
import { HybridStorageManager } from './lib/hybrid-storage-manager';
import { encryptionService } from './lib/encryption-service';

class SecureHybridStorageManager extends HybridStorageManager {
  async add<T>(table: string, data: T): Promise<T> {
    // 加密敏感数据
    const encrypted = await encryptionService.encryptObject(data);
    
    // 存储加密数据
    return super.add(table, encrypted);
  }

  async get<T>(table: string): Promise<T[]> {
    // 获取加密数据
    const encryptedData = await super.get(table);
    
    // 解密数据
    const decryptedData = await Promise.all(
      encryptedData.map(item => encryptionService.decryptObject<T>(item))
    );
    
    return decryptedData;
  }
}
```

### 集成查询监控

```typescript
import { HybridStorageManager } from './lib/hybrid-storage-manager';
import { queryMonitor } from './lib/query-monitor';

class MonitoredHybridStorageManager extends HybridStorageManager {
  async get<T>(table: string): Promise<T[]> {
    return queryMonitor.wrapQuery(
      `SELECT * FROM ${table}`,
      table,
      'get',
      async () => {
        const data = await super.get(table);
        return { data, cacheHit: false };
      }
    );
  }

  async add<T>(table: string, data: T): Promise<T> {
    return queryMonitor.wrapQuery(
      `INSERT INTO ${table}`,
      table,
      'add',
      async () => {
        const result = await super.add(table, data);
        return { data: result, cacheHit: false };
      }
    );
  }
}
```

### 集成冲突解决

```typescript
import { HybridStorageManager } from './lib/hybrid-storage-manager';
import { conflictResolver } from './lib/conflict-resolver';

class ConflictAwareHybridStorageManager extends HybridStorageManager {
  async syncTable(table: string): Promise<void> {
    // 获取本地数据
    const localData = await this.localStore.get(table);
    
    // 获取远程数据
    const remoteData = await this.remoteStore?.get(table) || [];
    
    // 检测冲突
    for (const localItem of localData) {
      const remoteItem = remoteData.find(item => item.id === localItem.id);
      
      if (remoteItem) {
        const conflict = conflictResolver.detectConflict(
          table,
          localItem.id,
          table,
          localItem,
          remoteItem
        );
        
        if (conflict) {
          // 自动解决冲突
          const resolvedVersion = await conflictResolver.resolveConflict(
            conflict.id,
            'timestamp'
          );
          
          // 更新本地数据
          await this.localStore.update(table, resolvedVersion);
        }
      }
    }
  }
}
```

---

## 📝 最佳实践

### 1. 数据加密

- ✅ 为敏感数据（密码、密钥、个人信息）启用加密
- ✅ 使用强密码（至少 32 个字符）
- ✅ 定期更换主密钥
- ✅ 备份加密密钥
- ❌ 不要在代码中硬编码密码
- ❌ 不要将加密密钥提交到版本控制

### 2. 数据库迁移

- ✅ 为每个迁移编写详细的描述
- ✅ 实现 `down` 函数以支持回滚
- ✅ 在生产环境执行迁移前先测试
- ✅ 保持迁移顺序（版本号递增）
- ❌ 不要在迁移中删除重要数据
- ❌ 不要跳过版本号

### 3. 查询监控

- ✅ 定期检查性能报告
- ✅ 优化慢查询（添加索引、重构查询）
- ✅ 监控缓存命中率
- ✅ 设置合理的慢查询阈值
- ❌ 不要在生产环境启用详细日志
- ❌ 不要忽略失败的查询

### 4. 冲突解决

- ✅ 选择合适的冲突解决策略
- ✅ 定期检查未解决的冲突
- ✅ 实现手动解决界面
- ✅ 记录冲突解决历史
- ❌ 不要自动解决所有冲突
- ❌ 不要忽略冲突

---

## 🎯 总结

YYC³ 存储架构现在包含以下增强功能：

1. **数据加密服务** - 基于 Web Crypto API 的安全加密
2. **版本化数据库迁移** - 完整的迁移管理系统
3. **查询性能监控** - 全面的性能监控和分析
4. **冲突解决策略** - 高级的冲突检测和解决

这些功能可以单独使用，也可以集成到现有的 `HybridStorageManager` 中，提供更强大、更安全、更可靠的存储解决方案。

---

**文档版本**: v1.0.0  
**最后更新**: 2026-04-01  
**维护团队**: YanYuCloudCube Team  
**联系邮箱**: admin@0379.email
