# YYC³ CloudPivot Intelli-Matrix - 统一配置管理系统

## 📋 目录

- [系统概述](#系统概述)
- [配置架构](#配置架构)
- [配置文件结构](#配置文件结构)
- [使用指南](#使用指南)
- [配置验证](#配置验证)
- [环境变量](#环境变量)
- [最佳实践](#最佳实践)
- [迁移指南](#迁移指南)

---

## 系统概述

YYC³ CloudPivot Intelli-Matrix 采用统一的配置管理系统，将所有配置集中到 `src/config/` 目录，提供类型安全、自动验证和统一管理的配置解决方案。

### 核心特性

- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **自动验证**: 配置加载时自动验证格式和有效性
- ✅ **环境隔离**: 支持开发、测试、生产环境
- ✅ **单例模式**: 配置全局共享，避免重复加载
- ✅ **错误处理**: 配置错误时提供清晰的错误信息
- ✅ **向后兼容**: 支持旧的配置方式

---

## 配置架构

### 配置层次结构

```
src/config/
├── env/
│   └── env.config.ts           # 环境变量类型定义
├── config-loader.ts            # 配置加载器和验证器
├── typescript/                # TypeScript 配置（预留）
├── eslint/                   # ESLint 配置（预留）
├── prettier/                 # Prettier 配置（预留）
├── validation/                # 配置验证器（预留）
└── index.ts                  # 配置入口文件
```

### 配置加载优先级

```
环境变量 (.env) > localStorage > 默认值
```

1. **环境变量** (.env 文件)
   - 最高优先级
   - 用于部署时覆盖默认配置

2. **localStorage**
   - 中等优先级
   - 用于运行时动态配置

3. **默认值**
   - 最低优先级
   - 配置文件中定义的默认值

---

## 配置文件结构

### 1. 环境变量类型定义

**文件**: `src/config/env/env.config.ts`

```typescript
export interface Config {
  app: AppConfig;
  features: FeatureFlags;
  api: ApiConfig;
  websocket: WebSocketConfig;
  logging: LoggingConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIModelConfig;
  network: NetworkConfig;
  monitoring: MonitoringConfig;
  mcp: MCPConfig;
  domain: DomainConfig;
  ports: PortMappingConfig;
  cloudpivot: CloudPivotMatrixConfig;
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
  ssl: SSLConfig;
  security: SecurityConfig;
  backup: BackupConfig;
  nfs: NFSConfig;
  healthCheck: HealthCheckConfig;
  devTools: DevToolsConfig;
}
```

### 2. 配置加载器

**文件**: `src/config/config-loader.ts`

```typescript
export class ConfigLoader {
  static load(): Config
  static getInstance(): Config
}

export const config = ConfigLoader.getInstance();
```

### 3. 配置入口

**文件**: `src/config/index.ts`

```typescript
export { config, ConfigLoader, ConfigError } from './config-loader';
export type { Config } from './env/env.config';
export { ENV_KEYS } from './env/env.config';
```

---

## 使用指南

### 基本使用

```typescript
import { config } from '@/config';

// 访问配置
const apiUrl = config.api.API_BASE_URL;
const wsUrl = config.websocket.WS_URL;
const enableGhostMode = config.features.ENABLE_GHOST_MODE;
```

### 功能开关

```typescript
import { config } from '@/config';

// 检查功能开关
if (config.features.ENABLE_AI_ASSISTANT) {
  // 启用 AI 助手功能
}

if (config.features.ENABLE_PWA) {
  // 启用 PWA 功能
}

if (config.features.ENABLE_GHOST_MODE) {
  // 启用幽灵模式
}
```

### API 配置

```typescript
import { config } from '@/config';

// 获取 API 配置
const apiConfig = {
  baseUrl: config.api.API_BASE_URL,
  timeout: config.api.API_PROXY_TIMEOUT,
  version: config.api.API_PROXY_VERSION,
};

// 发起 API 请求
fetch(`${apiConfig.baseUrl}/endpoint`, {
  timeout: apiConfig.timeout,
});
```

### WebSocket 配置

```typescript
import { config } from '@/config';

// 连接 WebSocket
const ws = new WebSocket(config.websocket.WS_URL);

// 配置重连
ws.onclose = () => {
  setTimeout(() => {
    ws.reconnect();
  }, config.websocket.WS_RECONNECT_INTERVAL);
};
```

### 数据库配置

```typescript
import { config } from '@/config';

// 连接数据库
const dbConfig = {
  host: config.database.DB_HOST,
  port: config.database.DB_PORT,
  user: config.database.DB_USER,
  password: config.database.DB_PASSWORD,
  database: config.database.DB_NAME,
};
```

---

## 配置验证

### 自动验证

配置加载器会自动验证以下内容：

- ✅ **URL 格式**: 验证 API URL、WebSocket URL 格式
- ✅ **端口号**: 验证端口号范围 (1-65535)
- ✅ **IP 地址**: 验证 IP 地址格式
- ✅ **文件路径**: 验证文件路径有效性
- ✅ **Cron 表达式**: 验证 Cron 表达式格式
- ✅ **枚举值**: 验证枚举值的有效性

### 配置错误处理

```typescript
import { ConfigError } from '@/config';

try {
  const config = ConfigLoader.load();
} catch (error) {
  if (error instanceof ConfigError) {
    console.error(`配置错误: ${error.message}`);
    console.error(`配置键: ${error.key}`);
  }
}
```

---

## 环境变量

### 环境变量分类

#### 应用配置

```bash
VITE_APP_NAME=YYC³ CloudPivot Intelli-Matrix
VITE_APP_VERSION=0.0.1
VITE_APP_URL=http://localhost:3118
VITE_DEFAULT_THEME=cyberpunk
VITE_DEFAULT_LANGUAGE=zh-CN
```

#### 功能开关

```bash
VITE_ENABLE_GHOST_MODE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_AI_ASSISTANT=true
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false
```

#### API 配置

```bash
VITE_API_BASE_URL=http://localhost:3118/api
API_PROXY_BASE_URL=https://api.0379.world
API_PROXY_TIMEOUT=30000
API_PROXY_VERSION=1.0.0
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
API_DEBUG=false
API_LOG_LEVEL=info
```

#### WebSocket 配置

```bash
VITE_WS_URL=ws://localhost:3113/ws
VITE_WS_RECONNECT_INTERVAL=5000
VITE_WS_MAX_RECONNECT_ATTEMPTS=10
VITE_WS_HEARTBEAT_INTERVAL=30000
```

### 环境变量文件

#### 开发环境 (.env.development)

```bash
VITE_DEV_MODE=true
VITE_DEBUG_MODE=true
VITE_API_BASE_URL=http://localhost:3118/api
VITE_WS_URL=ws://localhost:3113/ws
```

#### 生产环境 (.env.production)

```bash
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_API_BASE_URL=https://api.0379.world/api
VITE_WS_URL=wss://api.0379.world/ws
```

#### 测试环境 (.env.test)

```bash
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
VITE_API_BASE_URL=http://localhost:3118/api/test
VITE_WS_URL=ws://localhost:3113/ws/test
```

---

## 最佳实践

### 1. 使用配置而不是硬编码

❌ **不推荐**:
```typescript
const apiUrl = 'http://localhost:3118/api';
```

✅ **推荐**:
```typescript
import { config } from '@/config';
const apiUrl = config.api.API_BASE_URL;
```

### 2. 使用类型安全的配置

❌ **不推荐**:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

✅ **推荐**:
```typescript
import { config } from '@/config';
const apiUrl = config.api.API_BASE_URL;
```

### 3. 检查功能开关

❌ **不推荐**:
```typescript
if (import.meta.env.VITE_ENABLE_AI_ASSISTANT === 'true') {
  // 启用 AI 助手
}
```

✅ **推荐**:
```typescript
import { config } from '@/config';
if (config.features.ENABLE_AI_ASSISTANT) {
  // 启用 AI 助手
}
```

### 4. 处理配置错误

❌ **不推荐**:
```typescript
const apiUrl = config.api.API_BASE_URL;
// 没有错误处理
```

✅ **推荐**:
```typescript
try {
  const config = ConfigLoader.load();
  const apiUrl = config.api.API_BASE_URL;
} catch (error) {
  console.error('配置加载失败:', error);
}
```

---

## 迁移指南

### 从旧配置系统迁移

#### 1. 更新导入

**旧方式**:
```typescript
import { env } from '@/app/lib/env-config';
const apiUrl = env('API_BASE_URL');
```

**新方式**:
```typescript
import { config } from '@/config';
const apiUrl = config.api.API_BASE_URL;
```

#### 2. 更新环境变量访问

**旧方式**:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

**新方式**:
```typescript
import { config } from '@/config';
const apiUrl = config.api.API_BASE_URL;
```

#### 3. 更新功能开关检查

**旧方式**:
```typescript
if (import.meta.env.VITE_ENABLE_GHOST_MODE === 'true') {
  // 启用幽灵模式
}
```

**新方式**:
```typescript
import { config } from '@/config';
if (config.features.ENABLE_GHOST_MODE) {
  // 启用幽灵模式
}
```

### 向后兼容

旧的配置方式仍然可用，但建议逐步迁移到新的配置系统：

```typescript
// 旧方式仍然可用
import { env } from '@/app/lib/env-config';
const apiUrl = env('API_BASE_URL');

// 新方式推荐
import { config } from '@/config';
const apiUrl = config.api.API_BASE_URL;
```

---

## 配置文件统一

### TypeScript 配置统一

所有 TypeScript 配置文件已统一为 `ESNext` 目标：

- `tsconfig.json` - 主应用配置
- `tsconfig.electron.json` - Electron 配置
- `tsconfig.node.json` - Node.js 配置

**统一配置**:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "skipLibCheck": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": "."
  }
}
```

### ESLint 配置统一

ESLint 规则已优化，启用类型安全规则：

```json
{
  "rules": {
    "react/prop-types": "warn",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "warn"
  }
}
```

### Prettier 配置统一

Prettier 配置已统一为单引号：

```json
{
  "singleQuote": true,
  "jsxSingleQuote": true
}
```

---

## 根目录配置文件

### 配置文件清单

| 文件 | 类型 | 状态 | 说明 |
|------|------|------|------|
| `package.json` | 依赖管理 | ✅ 已统一 | 项目依赖和脚本 |
| `tsconfig.json` | TypeScript 配置 | ✅ 已统一 | TypeScript 编译配置 |
| `.eslintrc.json` | 代码规范 | ✅ 已统一 | ESLint 规则配置 |
| `.prettierrc.json` | 代码格式化 | ✅ 已统一 | Prettier 格式化配置 |
| `pnpm-workspace.yaml` | 工作区配置 | ✅ 已统一 | pnpm monorepo 配置 |
| `.env` | 环境变量 | ✅ 已统一 | 当前环境变量 |
| `.env.example` | 环境变量模板 | ✅ 已统一 | 完整的环境变量配置文档 |
| `vite.config.ts` | Vite 配置 | ✅ 已统一 | Vite 构建配置 |

---

## 总结

YYC³ CloudPivot Intelli-Matrix 统一配置管理系统提供了：

- ✅ **集中管理**: 所有配置集中到 `src/config/` 目录
- ✅ **类型安全**: 完整的 TypeScript 类型定义
- ✅ **自动验证**: 配置加载时自动验证
- ✅ **环境隔离**: 支持多环境配置
- ✅ **向后兼容**: 支持旧的配置方式
- ✅ **统一标准**: 所有配置文件统一标准

---

**最后更新**: 2026-03-26
**维护者**: YYC³ 团队
