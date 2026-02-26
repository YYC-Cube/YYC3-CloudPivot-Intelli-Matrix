---
@file: CONTRIBUTING.md
@description: YYC³ CloudPivot Intelli-Matrix · 贡献指南
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: published
@tags: [contribution, development, community]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix · 贡献指南

感谢您对 YYC³ CloudPivot Intelli-Matrix 的关注！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 Bug 修复
- ✨ 新功能
- 📝 文档改进
- 🎨 UI/UX 优化
- 🔧 性能优化
- 🌍 多语言翻译
- 🧪 测试覆盖

---

## 📋 贡献前检查清单

在开始贡献之前，请确保：

- [ ] 已阅读 [README.md](README.md)
- [ ] 已阅读本贡献指南
- [ ] 已检查 [Issues](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) 确认问题未被解决
- [ ] 同意遵循 [MIT License](LICENSE)
- [ ] 同意遵循本项目的代码规范

---

## 🚀 快速开始

### 1. Fork 仓库

点击 GitHub 仓库右上角的 **Fork** 按钮。

### 2. 克隆仓库

```bash
git clone https://github.com/你的用户名/YYC3-CloudPivot-Intelli-Matrix.git
cd YYC3-CloudPivot-Intelli-Matrix
```

### 3. 创建分支

为你的贡献创建一个新的分支：

```bash
git checkout -b feature/你的功能名称
# 或者
git checkout -b fix/问题描述
```

### 4. 进行开发

- 遵循 [代码规范](#代码规范)
- 为新功能编写测试
- 确保测试通过：`pnpm test`

### 5. 提交更改

使用清晰的提交信息：

```bash
git add .
git commit -m "feat: 添加用户认证功能"
```

### 6. 推送分支

```bash
git push origin feature/你的功能名称
```

### 7. 创建 Pull Request

在 GitHub 上创建 Pull Request：
- 标题清晰描述更改
- 关联相关的 Issue（如果有）
- 填写 PR 模板（如果提供）

---

## 📝 提交信息规范

我们遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: 添加用户认证` |
| `fix` | Bug 修复 | `fix: 修复登录页样式问题` |
| `docs` | 文档更新 | `docs: 更新 README.md` |
| `style` | 代码格式调整 | `style: 调整代码缩进` |
| `refactor` | 重构代码 | `refactor: 优化组件结构` |
| `perf` | 性能优化 | `perf: 优化渲染性能` |
| `test` | 测试相关 | `test: 添加单元测试` |
| `chore` | 构建/工具相关 | `chore: 更新依赖版本` |

### 示例

```
feat(auth): 添加 OAuth2.0 登录支持

- 实现授权码流程
- 添加 token 存储管理
- 完善错误处理

Closes #123
```

---

## 📐 代码规范

### TypeScript

- ✅ 使用严格模式
- ✅ 避免使用 `any` 类型
- ✅ 为函数添加明确的返回类型
- ✅ 使用接口定义对象结构

### React

- ✅ 使用函数式组件
- ✅ 使用 Hooks 管理状态
- ✅ 避免不必要的 re-render（useMemo, useCallback）
- ✅ 使用 `key` prop 优化列表渲染

### 样式

- ✅ 使用 Tailwind CSS 工具类
- ✅ 遵循 BEM 命名约定（如需要自定义样式）
- ✅ 响应式设计优先

### 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase + `use` 前缀 | `useUserProfile.ts` |
| 常量 | UPPER_SNAKE_CASE | `API_BASE_URL` |
| 函数 | camelCase | `getUserProfile()` |
| 私有变量 | 下划线前缀 | `_privateData` |

---

## 🧪 测试要求

### 测试覆盖

- ✅ 新功能必须包含测试
- ✅ 测试覆盖率不得低于 80%
- ✅ 关键路径必须 100% 覆盖

### 测试类型

| 类型 | 说明 | 示例 |
|------|------|------|
| 单元测试 | 测试单个函数/Hook | `useLocalFileSystem.test.ts` |
| 组件测试 | 测试 UI 组件渲染和交互 | `UserProfile.test.tsx` |
| 集成测试 | 测试多个模块协同工作 | `auth.integration.test.ts` |

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 覆盖率报告
pnpm test:coverage
```

---

## 🎨 UI/UX 规范

### 设计原则

- ✅ 遵循赛博朋克设计风格（深蓝 + 青色）
- ✅ 保持一致的间距和圆角
- ✅ 确保文本对比度足够
- ✅ 响应式设计支持

### 组件规范

- ✅ 组件应该是可复用的
- ✅ Props 应该有明确的类型定义
- ✅ 组件应该有清晰的文档注释
- ✅ 处理边缘情况和错误状态

---

## 📚 文档规范

### 代码注释

```typescript
/**
 * UserProfile 组件
 * 
 * 功能：显示用户信息和操作按钮
 * 
 * @param user - 用户数据对象
 * @param onEdit - 编辑回调函数
 * @param onDelete - 删除回调函数
 */
```

### README 更新

如果贡献影响用户使用方式：
- ✅ 更新 README.md 相关章节
- ✅ 添加使用示例
- ✅ 更新环境变量说明

---

## 🐛 报告 Bug

### Bug 报告模板

在创建 Issue 时，请使用以下模板：

```markdown
### Bug 描述
简要描述遇到的问题

### 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

### 期望行为
描述期望发生的行为

### 实际行为
描述实际发生的行为

### 环境信息
- OS: [e.g. macOS 14.0]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. 20.x]
- Project Version: [e.g. v0.1.0]

### 截图
如果适用，添加截图或录屏

### 额外信息
任何其他有助于解决问题的信息
```

---

## ✨ 功能建议

### 功能请求模板

```markdown
### 功能描述
简要描述建议的功能

### 问题背景
描述这个功能解决的问题

### 建议的解决方案
描述你期望的解决方案

### 替代方案
描述你考虑过的替代方案（如果有）

### 额外信息
任何其他有助于理解建议的信息
```

---

## 📧 开发环境设置

### 必需工具

| 工具 | 用途 | 安装 |
|------|------|------|
| Node.js | 运行时环境 | [nodejs.org](https://nodejs.org/) |
| pnpm | 包管理器 | [pnpm.io](https://pnpm.io/) |
| VS Code | 推荐的编辑器 | [code.visualstudio.com](https://code.visualstudio.com/) |

### 推荐扩展

- ESLint - 代码检查
- Prettier - 代码格式化
- Vitest - 测试运行器
- TypeScript Vue - TypeScript 支持

---

## 🔄 代码审查流程

### 审查要点

代码审查者请检查：

- [ ] 代码遵循项目规范
- [ ] 测试覆盖充分
- [ ] 文档更新完整
- [ ] 没有引入新的安全漏洞
- [ ] 性能影响可接受

### 审查反馈

- 📝 提供建设性的反馈
- 🎯 指出需要改进的地方
- ✅ 认可做得好的部分
- 🤔 提出需要讨论的问题

---

## 🌍 多语言贡献

### 翻译流程

1. Fork 仓库
2. 在 `src/app/i18n/` 目录下添加语言文件
3. 在类型文件中注册新语言
4. 提交 Pull Request

### 语言文件命名

格式：`语言代码.ts`

示例：
- `en-US.ts` - 英语（美国）
- `ja-JP.ts` - 日语
- `ko-KR.ts` - 韩语

---

## 🔒 安全注意事项

### 敏感信息

- ❌ 不要在代码中硬编码 API 密钥
- ❌ 不要在提交中包含密码或令牌
- ✅ 使用环境变量管理敏感信息
- ✅ 检查依赖漏洞：`pnpm audit`

### 依赖更新

- ✅ 定期更新依赖到最新稳定版本
- ✅ 关注依赖的安全公告
- ✅ 及时修复已知漏洞

---

## 📞 联系我们

### 渠道

| 方式 | 信息 |
|------|------|
| **邮箱** | <admin@0379.email> |
| **GitHub Issues** | [提交 Issue](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) |
| **GitHub Discussions** | [参与讨论](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/discussions) |

### 社区准则

- 🤝 尊重所有贡献者
- 💬 建设性沟通
- 🌍 欢迎多样化的参与者
- 📚 分享知识和经验

---

## 📜 行为准则

### 我们期望

- 🤝 专业且友善的交流
- 🎯 专注于解决问题和改进项目
- 🤝 感谢贡献者的努力
- 📝 清晰简洁的沟通

### 我们不期望

- 😠 人身攻击或冒犯性语言
- 🚫 骚扰或垃圾信息
- 📌 未经许可的商业推广
- 🤥 恶意提交或 PR

---

## 📊 贡献者统计

### 贡献类型

我们认可以下类型的贡献：

| 类型 | 说明 |
|------|------|
| 代码 | 功能实现、Bug 修复 |
| 文档 | README、API 文档、注释 |
| 测试 | 测试用例、测试修复 |
| 设计 | UI/UX 改进、图标 |
| 翻译 | 多语言支持 |
| 基础设施 | CI/CD、Docker、部署 |

### 贡献者认可

所有贡献者将在项目 [README.md](README.md) 的致谢章节和 GitHub 贡献者列表中被认可。

---

## 🎉 致谢

感谢每一位贡献者！你的让 YYC³ CloudPivot Intelli-Matrix 变得更好。

---

<div align="center">

> ***YanYuCloudCube***
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
