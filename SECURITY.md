---
@file: SECURITY.md
@description: YYC³ CloudPivot Intelli-Matrix · 安全策略与漏洞报告
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: published
@tags: [security, vulnerability-reporting, best-practices]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix · 安全策略

## 📋 概述

YYC³ CloudPivot Intelli-Matrix 非常重视安全性。本文档说明了项目的安全实践、漏洞报告流程以及安全相关的注意事项。

**如果您发现安全漏洞，请通过下述方式负责任地报告。**

---

## 🚨 漏洞报告

### 报告渠道

| 方式 | 信息 |
|------|------|
| **加密邮箱** | security@0379.email |
| **GitHub Security** | 使用 GitHub 的安全功能（如适用于私有仓库） |
| **项目 Issues** | 在 [GitHub Issues](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) 提交时标注 `[security]` |

### 报告模板

请在报告漏洞时使用以下模板：

```markdown
### 漏洞类型
[例如：XSS / CSRF / SQL 注入 / 认证绕过]

### 漏洞描述
详细描述漏洞的细节和影响

### 受影响版本
[例如：v0.1.0 或更早版本]

### 复现步骤
1. 访问 URL: ...
2. 执行操作: ...
3. 观察结果: ...

### 预期行为
描述期望的安全行为

### 实际行为
描述实际发生的不安全行为

### 潜在影响
描述漏洞可能导致的后果

### 建议的修复方案
如果可能，提供修复建议

### 补充信息
任何其他有助于理解或修复漏洞的信息
```

### 报告注意事项

- ✅ 请提供详细的技术信息
- ✅ 请提供复现步骤
- ✅ 请描述预期行为与实际行为
- ✅ 请在发现后 90 天内报告
- 🚫 请勿公开披露未修复的漏洞

### 响应承诺

我们承诺：

- 📧 在 48 小时内确认收到报告
- 🔧 在 7 个工作日内评估漏洞
- 🔒 对报告者身份和信息保密
- 📝 修复后通知报告者
- 🏅 在发布修复版本前协调披露时间

---

## 🔒 安全最佳实践

### 开发者指南

#### 敏感信息管理

```typescript
// ❌ 错误：硬编码密钥
const API_KEY = "sk-xxxxx";

// ✅ 正确：使用环境变量
const API_KEY = import.meta.env.VITE_API_KEY;
```

#### 输入验证

```typescript
// ✅ 验证用户输入
function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .trim();
}

// ✅ 验证数据类型
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

#### 认证与授权

```typescript
// ✅ 使用 Supabase 的认证机制
const { data: { user } } = await supabase.auth.signInWithPassword({
  email,
  password,
});

// ✅ 验证用户权限
if (!hasPermission(user, 'admin')) {
  throw new Error('Unauthorized');
}
```

### 依赖管理

#### 定期更新

```bash
# 检查依赖漏洞
pnpm audit

# 自动修复漏洞（谨慎使用）
pnpm audit fix

# 更新依赖到最新版本
pnpm update
```

#### 使用可信的依赖

| 依赖 | 用途 | 来源 |
|------|------|------|
| React | UI 框架 | [reactjs.org](https://reactjs.org/) |
| Supabase | 后端服务 | [supabase.com](https://supabase.com/) |
| Vite | 构建工具 | [vitejs.dev](https://vitejs.dev/) |

---

## 🛡️ 安全功能

### Ghost Mode

Ghost Mode 是一个开发便捷功能，仅用于开发环境：

```typescript
// 检查是否在 Ghost Mode
if (import.meta.env.VITE_GHOST_MODE === 'true') {
  // 跳过 Supabase 认证
  // 使用本地数据
}
```

**重要**：
- ⚠️ Ghost Mode 不应在生产环境使用
- ⚠️ Ghost Mode 的所有数据仅存储在 localStorage
- ⚠️ 生产部署时必须禁用 Ghost Mode

### 数据加密

项目使用以下安全措施：

- ✅ HTTPS 通信（生产环境）
- ✅ Supabase 提供的加密认证
- ✅ 敏感信息不记录到日志
- ✅ WebSocket 连接验证

---

## 🔍 已知安全限制

### 浏览器兼容性

| 浏览器 | 支持 | 说明 |
|--------|------|------|
| Chrome 90+ | ✅ 完全支持 | 推荐使用 |
| Firefox 88+ | ✅ 完全支持 | 推荐使用 |
| Safari 14+ | ✅ 完全支持 | 推荐使用 |
| Edge 90+ | ✅ 完全支持 | 推荐使用 |
| IE 11 | ⚠️ 不支持 | 使用现代浏览器 |

### PWA 安全

- ✅ Service Worker 仅在 HTTPS 下工作
- ✅ 本地数据不包含敏感信息
- ✅ 离线缓存有合理的过期时间

---

## 🚫 不安全操作

### 禁止行为

以下行为违反安全最佳实践，不应在代码中出现：

```typescript
// ❌ 不要这样做：直接执行用户输入
const result = eval(userInput);

// ❌ 不要这样做：未过滤的 innerHTML
element.innerHTML = userInput;

// ❌ 不要这样做：硬编码密钥
const password = "admin123";

// ❌ 不要这样做：忽略错误边界
try {
  dangerousOperation();
} catch (e) {
  // 忽略错误
}

// ❌ 不要这样做：暴露调试信息
console.log(userCredentials);
```

### 安全替代方案

```typescript
// ✅ 使用 DOMPurify 过滤 HTML
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// ✅ 使用 CSP 头部
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline'">

// ✅ 使用环境变量
const apiKey = import.meta.env.VITE_API_KEY;
```

---

## 📊 安全检查清单

在提交代码前，请确认：

- [ ] 没有硬编码的密钥或密码
- [ ] 所有用户输入都已验证和清理
- [ ] 使用了参数化查询而非字符串拼接
- [ ] 敏感数据已加密或使用安全存储
- [ ] 错误信息不暴露内部实现细节
- [ ] 依赖已更新到最新稳定版本
- [ ] 运行了 `pnpm audit` 检查漏洞
- [ ] 认证和授权机制已正确实现
- [ ] HTTPS 在生产环境强制使用

---

## 🔐 认证与授权

### Supabase 认证

项目使用 Supabase 进行身份验证：

```typescript
// 登录
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});

// 注册
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});

// 登出
await supabase.auth.signOut();
```

### 会话管理

```typescript
// 会话存储在 localStorage
const SESSION_KEY = 'yyc3-session';

// 会话自动过期
const MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 小时
```

---

## 📡 日志与监控

### 安全日志

- ✅ 不记录密码或令牌
- ✅ 不记录完整的用户数据
- ✅ 记录关键操作用于审计
- ✅ 敏感操作使用结构化日志

### 监控指标

项目收集以下监控指标（不包含用户数据）：

- ✅ 系统性能指标
- ✅ 错误发生频率
- ✅ API 响应时间
- ✅ 浏览器和设备信息（匿名）

---

## 🌐 网络安全

### HTTPS 强制

```nginx.conf
# Nginx 配置示例
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 强制 HTTPS
    if ($scheme = http) {
        return 301 https://$host$request_uri;
    }
}
```

### WebSocket 安全

```typescript
// WebSocket 连接验证
function validateWebSocketConnection(url: string): boolean {
  // 只允许 HTTPS 或 localhost
  return url.startsWith('wss://') || url.startsWith('ws://localhost');
}
```

### CORS 配置

```nginx.conf
# Nginx CORS 配置
add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
add_header 'Access-Control-Max-Age' 3600;
```

---

## 📞 安全事件响应

### 漏洞确认流程

1. **收到报告** → 安全团队评估
2. **验证漏洞** → 确认严重性
3. **制定修复方案** → 开发修复补丁
4. **测试修复** → 内部验证有效性
5. **发布更新** → 部署安全更新
6. **通知报告者** → 确认问题已解决

### 严重性分级

| 级别 | 响应时间 | 修复优先级 |
|------|---------|-----------|
| 🔴 严重 | 24 小时内 | 立即修复 |
| 🟠 高危 | 48 小时内 | 下个版本 |
| 🟡 中危 | 7 天内 | 计划修复 |
| 🟢 低危 | 14 天内 | 择机修复 |

---

## 📚 安全资源

### 学习资源

| 资源 | 链接 |
|------|------|
| [OWASP Top 10](https://owasp.org/www-project-top-ten) | Web 应用十大安全风险 |
| [CWE Top 25](https://cwe.mitre.org/top25/) | 常见弱点枚举 |
| [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security) | MDN 安全文档 |
| [OWASP Cheat Sheet](https://cheatsheetseries.owasp.org/) | 安全快速参考 |

### 工具

| 工具 | 用途 |
|------|------|
| [pnpm audit](https://docs.npmjs.com/cli/audit) | 依赖漏洞扫描 |
| [Snyk](https://snyk.io/) | 开源安全扫描 |
| [npm audit fix](https://docs.npmjs.com/cli/audit) | 自动修复漏洞 |

---

## 📧 开发安全配置

### 环境变量示例

```bash
# .env.example
# 不要将此文件提交到版本控制

# Supabase 配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# WebSocket 配置
VITE_WS_URL=wss://yourdomain.com/ws

# Ghost Mode（仅开发）
VITE_GHOST_MODE=false
```

### TypeScript 安全配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

## 🔒 隐私保护

### 数据收集

项目收集的最小数据：

- ✅ 认证状态（已登录/未登录）
- ✅ 用户偏好设置（本地存储）
- ✅ 系统性能指标（匿名）
- ✅ 错误日志（不包含敏感信息）

### 用户数据

用户数据完全由用户控制：

- ✅ 数据存储在用户设备
- ✅ 用户可以随时清除本地数据
- ✅ 生产环境使用加密连接
- ✅ 不与第三方共享用户数据

---

## 📞 联系我们

### 安全报告

| 方式 | 信息 |
|------|------|
| **加密邮箱** | security@0379.email |
| **GitHub Issues** | [提交安全 Issue](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) |

### 一般咨询

对于非安全问题，请通过常规渠道联系：

- [GitHub Discussions](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/discussions)
- [项目 Issues](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues)

---

## 📜 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v0.1.0 | 2026-02-27 | 初始安全策略 |

---

## 📞 致谢

感谢安全研究社区和所有负责任地报告漏洞的个人！

---

<div align="center">

### ***YanYuCloudCube***

> ***<security@0379.email>***」
> 「***安全是团队的责任，也是社区的信任***」
> 「***Security is the team's responsibility and the community's trust***」

</div>
