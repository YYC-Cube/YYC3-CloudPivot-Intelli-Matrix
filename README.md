<p align="center">
  <img src="./public/YYC-CloudPivot%20Intelli-Matrix-005.png" alt="YYC³ CloudPivot Intelli-Matrix" width="720">
</p>

<h1 align="center">YYC³ CloudPivot Intelli-Matrix</h1>

<p align="center">
  <strong>言启象限 · 语枢未来</strong> — 万象归元于云枢 | 深栈智启新纪元
</p>

<p align="center">
  <a href="#快速开始"><strong>快速开始</strong></a> •
  <a href="#功能特性"><strong>功能特性</strong></a> •
  <a href="#技术架构"><strong>技术架构</strong></a> •
  <a href="#项目结构"><strong>项目结构</strong></a> •
  <a href="#开发指南"><strong>开发指南</strong></a> •
  <a href="#文档"><strong>文档</strong></a> •
  <a href="#贡献"><strong>贡献</strong></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8.0.3-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind_CSS-4.2.1-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Electron-41-47848F?style=flat-square&logo=electron&logoColor=white" alt="Electron">
  <br>
  <img src="https://img.shields.io/github/actions/workflow/status/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/ci.yml?branch=main&style=flat-square&logo=github-actions&label=CI%2FCD" alt="CI/CD">
  <img src="https://img.shields.io/github/license/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/v/release/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=flat-square&color=orange" alt="Version">
  <img src="https://img.shields.io/github/last-commit/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=flat-square" alt="Last Commit">
  <img src="https://img.shields.io/github/issues/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=flat-square" alt="Issues">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

---

## 📖 项目简介

**YYC³ CloudPivot Intelli-Matrix (CP-IM)** 是一个基于 **React 19 + TypeScript 5.9** 的现代化智能监控与运维平台，专为 AI 研发与运维团队设计。采用赛博朋克视觉体系，集成实时数据监控、AI 智能辅助、多端适配（Web / Electron Desktop / PWA）等核心能力。

### 核心优势

| 维度 | 能力 |
|:-----|:-----|
| 🎯 **开箱即用** | 完整的监控、巡查、操作中心一体化方案 |
| 🤖 **AI 驱动** | 智能决策建议、自动化运维、模式分析 |
| 💻 **跨平台** | Web + Electron Desktop + PWA 离线三端覆盖 |
| 🔒 **类型安全** | TypeScript Strict Mode，100% 类型覆盖 |
| ⚡ **高性能** | Vite 8 极速构建、代码分割、Tree Shaking |
| 🌍 **国际化** | 中文 / English 双语支持 |

---

## ✨ 功能特性

<details>
<summary><b>📊 数据监控中心</b></summary>

- 实时节点状态监控 (GPU / 内存 / 温度 / 网络)
- QPS 与延迟趋势图表 (Recharts 3.x)
- 告警实时推送与智能处理
- Supabase 数据库原生集成与实时同步
- 智能查询缓存 (TTL 可配置)

</details>

<details>
<summary><b>🔍 巡查管理系统</b></summary>

- 自动化巡查计划调度
- 巡查报告自动生成与归档
- 巡查历史记录追踪
- 异常检测与预警机制

</details>

<details>
<summary><b>⚙️ 操作中心</b></summary>

- 快速操作网格界面
- 操作模板管理与复用
- 实时操作日志流
- 操作审计与合规追溯

</details>

<details>
<summary><b>🤖 AI 智能辅助</b></summary>

- AI 决策建议面板
- SDK 流式对话交互
- 操作推荐引擎
- 模式分析与异常识别

</details>

<details>
<summary><b>🎛️ 系统设置</b></summary>

- 赛博朋克主题定制 (6 套预设)
- 多模型供应商管理 (OpenAI / Ollama / 本地模型)
- WebSocket 与 API 网络配置
- PWA 安装与离线状态管理

</details>

<details>
<summary><b>🛠 工程能力</b></summary>

- **响应式布局**: Desktop / Tablet / Mobile 完美适配
- **PWA 支持**: Service Worker + 离线缓存 + 可安装
- **国际化**: i18n 双语切换 (zh-CN / en-US)
- **Ghost Mode**: 开发环境跳过认证便捷入口
- **错误恢复**: 智能错误分类 + 指数退避重试
- **批量操作**: 高效数据处理 + 进度回调

</details>

---

## 🏗 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                    YYC³ CP-IM System Architecture            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌──────────────────┐    ┌──────────────────────────────┐ │
│   │  Presentation    │    │       Interaction Layer      │ │
│   │     Layer        │    │                              │ │
│   │ ┌────┐┌────┐┌───┐│    │  React 19.2  TS Strict     │ │
│   │ │Web ││Elec││PWA││    │  Router v7   Context API    │ │
│   │ └────┘└────┘└───┘│    └──────────────────────────────┘ │
│   └──────────────────┘              ▲                      │
│                    │               │                       │
│   ┌────────────────────────────────┼──────────────────────┐ │
│   │           Styling Layer        │                      │ │
│   │  Tailwind 4.2  Motion 12  Radix UI 1.x               │ │
│   └────────────────────────────────┼──────────────────────┘ │
│                                     │                       │
│   ┌────────────────────────────────┼──────────────────────┐ │
│   │         Data Layer             │                      │ │
│   │  Recharts 3.8  Lucide 0.576  WebSocket  Supabase     │ │
│   └────────────────────────────────┼──────────────────────┘ │
│                                     │                       │
│   ┌────────────────────────────────┼──────────────────────┐ │
│   │        Intelligence Layer       │                      │ │
│   │   AI SDK  Decision Engine  Pattern Analyzer          │ │
│   └────────────────────────────────┼──────────────────────┘ │
│                                     │                       │
│   ┌────────────────────────────────▼──────────────────────┐ │
│   │         Utility Layer                               │ │
│   │  Vite 8.0  Vitest 4.1  ESLint 10  Prettier          │ │
│   └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心依赖

| 类别 | 技术 | 版本 | 说明 |
|:-----|:-----|:-----|:-----|
| **框架** | ![React](https://img.shields.io/badge/-19.2.4-61DAFB?style=flat-square&logo=react) | 19.2.4 | UI 框架，并发特性 |
| | ![TypeScript](https://img.shields.io/badge/-5.9.3-3178C6?style=flat-square&logo=typescript) | 5.9.3 | 类型安全 (Strict) |
| | ![Router](https://img.shields.io/badge/-7.13.0-CA4245?style=flat-square&logo=reactrouter) | 7.13.1 | Hash 路由管理 |
| **样式** | ![Tailwind](https://img.shields.io/badge/-4.2.1-38B2AC?style=flat-square&logo=tailwindcss) | 4.2.1 | 原子化 CSS JIT |
| | ![Motion](https://img.shields.io/badge/-12.34.5-FF6B6B?style=flat-square) | 12.34.5 | 高性能动画 |
| | ![Radix](https://img.shields.io/badge/-1.x-18181B?style=flat-square) | 1.x | 无头组件库 |
| **构建** | ![Vite](https://img.shields.io/badge/-8.0.3-646CFF?style=flat-square&logo=vite) | 8.0.3 | 极速构建工具 |
| | ![Electron](https://img.shields.io/badge/-41-47848F?style=flat-square&logo=electron) | 41.1.1 | 桌面端支持 |
| **测试** | ![Vitest](https://img.shields.io/badge/-4.1.2-FECD3E?style=flat-square&logo=vitest) | 4.1.2 | 单元测试框架 |
| | ![Testing Lib](https://img.shields.io/badge/-16.x-E535AB?style=flat-square) | 16.x | React 测试工具 |
| **图表** | ![Recharts](https://img.shields.io/badge/-3.8.1-FF5722?style=flat-square) | 3.8.1 | 响应式图表 |
| **图标** | ![Lucide](https://img.shields.io/badge/-0.576.0-FFA500?style=flat-square) | 0.576.0 | 现代化图标 |
| **数据库** | ![Supabase](https://img.shields.io/badge/-2.98.0-3FCF8D?style=flat-square) | 2.98.0 | BaaS 后端服务 |

---

## 🚀 快速开始

### 前置条件

```bash
# Node.js ≥ 20.x LTS
node --version  # v20.x.x

# pnpm ≥ 9.x
pnpm --version  # 9.x.x
```

### 安装运行

```bash
# 1. 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git
cd YYC3-CloudPivot-Intelli-Matrix

# 2. 安装依赖
pnpm install

# 3. 配置环境变量 (可选)
cp .env.example .env

# 4. 启动开发服务器
pnpm dev
# → http://localhost:3218
```

### 常用命令

| 命令 | 说明 |
|:-----|:-----|
| `pnpm dev` | 启动开发服务器 (:3218) |
| `pnpm electron:dev` | 启动 Electron 桌面应用 |
| `pnpm build` | 生产构建 (Vite + Electron TS) |
| `pnpm build:mac` | macOS 构建 (arm64 + x64) |
| `pnpm build:win` | Windows 构建 (x64 NSIS) |
| `pnpm build:linux` | Linux 构建 (AppImage + deb) |
| `pnpm test` | 运行单元测试 |
| `pnpm test:watch` | 测试监听模式 |
| `pnpm test:coverage` | 生成覆盖率报告 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm lint:fix` | ESLint 自动修复 |
| `pnpm docker:build` | Docker 镜像构建 |
| `pnpm clean` | 清理构建产物 |

### Docker 部署

```bash
# 构建镜像
docker build -t yyc3-cloudpivot .

# 运行容器
docker run -d -p 3118:8080 yyc3-cloudpivot
```

---

## 📁 项目结构

```
YYC3-CloudPivot-Intelli-Matrix/
├── .github/
│   └── workflows/                # CI/CD 工作流
│       ├── ci.yml                # 代码质量 + 测试 + 构建
│       └── deploy.yml            # GitHub Pages 自动部署
├── docs/                         # 项目级文档
├── public/                       # 静态资源 (PWA manifest, icons)
├── src/
│   ├── app/
│   │   ├── components/           # 业务组件 (55+)
│   │   │   ├── ui/              # Radix UI 设计系统
│   │   │   └── ...
│   │   ├── hooks/                # 自定义 Hooks (19+)
│   │   ├── i18n/                 # 国际化 (zh-CN / en-US)
│   │   ├── lib/                  # 工具库 (supabase, error-handler)
│   │   ├── types/                # 全局类型定义 (21 大类)
│   │   ├── docs/                 # 应用级文档
│   │   ├── __tests__/            # 测试文件
│   │   ├── App.tsx               # 根组件
│   │   └── routes.tsx            # 路由配置 (Hash Router)
│   ├── styles/                   # 全局样式 (Tailwind + Theme)
│   └── main.tsx                  # 应用入口
├── electron/                     # Electron 主进程
├── resources/                    # 平台资源 (entitlements, icons)
├── scripts/                      # 构建脚本 & 工具
├── index.html                    # HTML 入口
├── package.json                  # 依赖 & 脚本
├── tsconfig.json                 # TypeScript 配置 (Strict)
├── vite.config.ts                # Vite 构建配置
└── vitest.config.ts              # 测试框架配置
```

---

## 🧪 测试

### 测试策略

| 层级 | 框架 | 覆盖范围 |
|:-----|:-----|:---------|
| 单元测试 | Vitest + Testing Library | Hooks, Utils, Stores |
| 组件测试 | Vitest + @testing-library/react | UI Components |
| 集成测试 | Vitest (jsdom) | 业务流程 |

### 运行测试

```bash
# 单次执行
pnpm test

# 监听模式 (开发推荐)
pnpm test:watch

# 覆盖率报告
pnpm test:coverage

# CI 并行分片 (4 shards)
pnpm test:ci
```

### 质量指标

| 指标 | 当前状态 | 目标 |
|:-----|:--------|:-----|
| TypeScript 错误 | 0 ✅ | 0 |
| ESLint 错误 | 0 ✅ | 0 |
| 测试通过率 | 100% ✅ | 100% |
| 测试覆盖率 | 持续提升 ⚠️ | 80%+ |

---

## 🔌 端口与服务

| 服务 | 端口 | 用途 |
|:-----|:-----|:-----|
| Dev Server | **3218** | 开发服务器 (Vite) |
| Production | **3118** | 生产部署 (GitHub Pages) |
| WebSocket | 3113 | 实时数据推送 |
| API (可选) | 3000 | 后端 API 服务 |
| Nginx | 80 / 443 | 反向代理 |
| Supabase | Cloud | BaaS 数据库 |

> **注意**: 开发端口使用 **3218** (非 Vite 默认 5173)，符合 YYC³ 端口规范 (3200-3500)

---

## 📚 文档索引

### 项目级文档 (`docs/`)

| 文档 | 内容 |
|:-----|:-----|
| [项目总览手册](./docs/) | 项目完整介绍与技术选型 |
| [系统架构设计](./docs/02-YYC³-CP-IM-项目设计阶段/) | 架构详细设计与决策 |
| [开发环境搭建](./docs/03-YYC³-CP-IM-开发实施阶段/) | 环境配置与初始化 |
| [API 文档](./src/app/docs/API-REFERENCE.ts) | 接口参考与调用示例 |
| [组件文档](./src/app/docs/COMPONENT-REFERENCE.ts) | 组件 API 与使用指南 |
| [测试指南](./src/app/docs/TESTING-GUIDE.ts) | 测试规范与最佳实践 |

### 在线访问

- **生产环境**: https://cpim.yyccube.xin/
- **GitHub Pages**: https://yyccube.github.io/YYC3-CloudPivot-Intelli-Matrix/

---

## 🤝 贡献指南

我们欢迎任何形式的贡献！无论是 Bug 修复、新功能、文档改进还是问题反馈。

### 贡献流程

```mermaid
graph LR
    A[Fork 仓库] --> B[创建分支]
    B --> C[编写代码]
    C --> D[运行测试]
    D --> E[提交 PR]
    E --> F[Code Review]
    F --> G[合并主分支]
```

### 开发规范

| 规范 | 要求 |
|:-----|:-----|
| **TypeScript** | Strict Mode，禁止 `any` |
| **代码风格** | Prettier 格式化 + ESLint 检查 |
| **提交信息** | [Conventional Commits](https://www.conventionalcommits.org/) 规范 |
| **分支命名** | `feature/*`, `fix/*`, `docs/*`, `refactor/*` |
| **测试要求** | 新功能必须包含对应测试用例 |

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `ci`

**示例**:
```
feat(dashboard): add real-time node status monitoring widget

- Implement GPU/memory/temperature display cards
- Add auto-refresh interval configuration
- Support threshold-based alert triggers

Closes #123
```

### Issue 反馈

- 使用 [Issue Template](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues/new/choose) 提交问题
- 包含复现步骤、预期行为、实际行为、环境信息
- Bug Report / Feature Request / Question 请分类提交

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

```
MIT License

Copyright (c) 2026 YanYuCloudCube Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 👥 团队与联系

| 方式 | 信息 |
|:-----|:-----|
| **邮箱** | admin@0379.email |
| **组织** | [YanYuCloudCube](https://github.com/YYC-Cube) |
| **仓库** | [YYC³ CP-IM](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix) |
| **Issues** | [问题反馈](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) |
| **Discussions** | [技术讨论](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/discussions) |

---

## 🙏 致谢

感谢以下开源社区和项目的贡献：

- [React](https://react.dev/) - 用户界面框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [Radix UI](https://www.radix-ui.com/) - 无障碍 UI 组件
- [Supabase](https://supabase.com/) - 开源 Firebase 替代方案
- [Recharts](https://recharts.org/) - React 图表库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架

---

<div align="center">

### ⭐ 如果这个项目对你有帮助，请给一个 Star 支持！

[![Star History Chart](https://api.star-history.com/svg?repos=YYC-Cube/YYC3-CloudPivot-Intelli-Matrix&type=Date)](https://star-history.com/#YYC-Cube/YYC3-CloudPivot-Intelli-Matrix&Date)

**[⬆ 回到顶部](#yyc³-cloudpivot-intelli-matrix)**

<br>

<p>
  <sub>Built with ❤️ by <a href="https://github.com/YYC-Cube">YanYuCloudCube Team</a></sub>
  <br>
  <sub><em>Words Initiate Quadrants, Language Serves as Core for Future</em></sub>
</p>

</div>
