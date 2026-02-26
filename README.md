---
@file: README.md
@description: YYC³ CloudPivot Intelli-Matrix · 开源智能监控与运维平台
@author: YanYuCloudCube Team
@version: v0.0.1
@created: 2026-02-26
@updated: 2026-02-27
@status: published
@tags: [project-overview, quick-start, usage-guide, open-source]
---

<div align="center">

![YYC³ CloudPivot Intelli-Matrix](./public/YYC-CloudPivot%20Intelli-Matrix-005.png)

# YYC³ CloudPivot Intelli-Matrix

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/blob/main/docs/YYC³-CP-IM-最终测试报告-100%通过.md)
[![Version](https://img.shields.io/badge/version-0.0.1-orange)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/releases)
[![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB)](https://reactjs.org/)

**万象归元于云枢；深栈智启新纪元**

[English](#english-version) | [简体中文](#简介)

---

[![GitHub stars](https://img.shields.io/github/stars/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=social)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix?style=social)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/network/members)
[![GitHub issues](https://img.shields.io/github/issues/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/pulls)

---

## 🌟 简介

[YYC³ CloudPivot Intelli-Matrix (CP-IM)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix) 是一个现代化的智能监控与运维平台，基于 React 18 + TypeScript 构建，专为 AI 研发与运维团队设计。

### 核心理念

> **人机共生，智慧同行；以AI为魂，以流程为骨，以规范为脉。**

### 项目亮点

- ✅ **100% 测试覆盖率** - 903 个测试全部通过
- ✅ **生产级质量** - TypeScript 严格模式，完整 CI/CD 流水线
- ✅ **现代化架构** - React 18, Vite 6, PWA 支持
- ✅ **实时监控** - WebSocket 实时数据推送
- ✅ **AI 集成** - 智能决策建议与操作推荐

---

## ✨ 核心特性

| 特性 | 说明 |
|------|------|
| 🎨 **赛博朋克设计风格** | 深蓝 #060e1f + 青色 #00d4ff 视觉体系 |
| 🚀 **实时数据监控** | WebSocket 实时推送，节点状态、QPS、延迟监控 |
| 🤖 **AI 智能辅助** | 集成 AI SDK，提供智能决策建议 |
| 📱 **响应式设计** | 完美支持桌面端、平板、移动端 |
| 🌐 **PWA 离线支持** | 可离线使用，本地缓存数据 |
| 🌍 **国际化支持** | 中文简体 / English (US) 双语言 |
| 🎯 **Ghost Mode** | 开发便捷入口，跳过 Supabase 认证 |
| 🔒 **类型安全** | TypeScript 严格模式，完整的类型定义 |
| ✅ **100% 测试覆盖** | 903 个测试全部通过 |
| 🚀 **快速构建** | 2.49秒生产构建时间 |

---

## 🛠 技术栈

### 前端框架

| 技术 | 版本 | 说明 |
|------|------|------|
| ![React](https://img.shields.io/badge/React-18.3.1-61DAFB) | 18.3.1 | UI 框架 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) | 5.8 | 类型安全 |
| ![React Router](https://img.shields.io/badge/React%20Router-7.13.0-CA4245) | 7.13.0 | 路由管理 (Data Mode) |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.12-38B2FF) | 4.1.12 | 样式框架 |
| ![Framer Motion](https://img.shields.io/badge/Motion-12.23.24-FF6B6B) | 12.23.24 | 动画库 |
| ![Recharts](https://img.shields.io/badge/Recharts-2.15.2-FF5722) | 2.15.2 | 图表库 |

### 开发工具

| 技术 | 版本 | 说明 |
|------|------|------|
| ![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF) | 6.3.5 | 构建工具 |
| ![Vitest](https://img.shields.io/badge/Vitest-4.0.18-FECD3E) | ^4.0.18 | 测试框架 |
| ![ESLint](https://img.shields.io/badge/ESLint-9.17.0-4B32C3) | 9.17.0 | 代码检查 |
| ![Prettier](https://img.shields.io/badge/Prettier-3.8.1-1A2B34) | 3.8.1 | 代码格式化 |

### 测试与质量

| 工具 | 用途 |
|------|------|
| Vitest | 单元测试和集成测试 |
| @testing-library/react | React 组件测试 |
| jsdom | 测试环境模拟 |
| TypeScript | 类型检查 |

### DevOps

| 工具 | 用途 |
|------|------|
| GitHub Actions | CI/CD 自动化流水线 |
| Docker | 容器化部署 |
| Nginx | 反向代理和静态服务 |
| Prometheus | 监控指标收集 |
| Grafana | 监控数据可视化 |

---

## 🚀 快速开始

### 前置条件

| 要求 | 版本 |
|------|------|
| Node.js | ≥ 18.x (推荐 20.x LTS) |
| pnpm | ≥ 8.x |
| 操作系统 | macOS / Linux / Windows |

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git
cd YYC3-CloudPivot-Intelli-Matrix

# 安装依赖
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:coverage
```

### 构建生产包

```bash
pnpm build
```

产物在 `dist/` 目录

---

## 📖 文档

| 文档 | 说明 |
|------|------|
| [项目总览手册](docs/00-YYC³-CP-IM-项目总览索引/001-CP-IM-项目总览索引-项目总览手册.md) | 项目完整介绍 |
| [快速开始指南](docs/00-YYC³-CP-IM-项目总览索引/003-CP-IM-项目总览索引-快速开始指南.md) | 快速上手教程 |
| [开发者衔接文档](docs/DEVELOPER-HANDOFF.ts) | 开发协作规范 |
| [系统架构设计](docs/02-YYC³-CP-IM-项目设计阶段/0201-CP-IM-架构设计/) | 架构详细设计 |
| [开发环境搭建](docs/03-YYC³-CP-IM-开发实施阶段/0301-CP-IM-开发环境/) | 环境配置指南 |
| [最终测试报告](docs/YYC³-CP-IM-最终测试报告-100%通过.md) | 100% 测试通过报告 |
| [CI/CD 部署指南](docs/YYC³-CP-IM-CICD-智能自动化部署指南.md) | 自动化部署文档 |

---

## 📊 项目统计

### 代码统计

| 指标 | 数值 |
|------|-----|
| 组件数量 | 55+ |
| 自定义 Hooks | 19+ |
| 路由数量 | 17 |
| 测试用例 | 903 |
| 测试通过率 | 100% |
| 构建时间 | 2.49s |
| 包大小 (gzip) | ~411 KB |

### 测试覆盖

| 模块 | 测试数 | 通过率 |
|------|--------|--------|
| Hooks | 85 | 100% |
| Components | 680 | 100% |
| Utils | 138 | 100% |
| **总计** | **903** | **100%** |

---

## 🎯 核心功能

### 1. 📊 数据监控

- ✅ 实时节点状态监控 (GPU/内存/温度)
- ✅ QPS 与延迟趋势图表
- ✅ 告警实时推送与处理
- ✅ 多节点集群视图

### 2. 🔍 巡查管理

- ✅ 巡查计划调度
- ✅ 巡查报告生成
- ✅ 巡查历史记录
- ✅ 自动巡查配置

### 3. ⚙️ 操作中心

- ✅ 快速操作网格
- ✅ 操作模板管理
- ✅ 实时操作日志流
- ✅ 操作历史追踪

### 4. 🤖 AI 辅助

- ✅ AI 决策建议面板
- ✅ SDK 流式聊天
- ✅ 操作推荐引擎
- ✅ 模式分析器
- ✅ 系统命令预设

### 5. 🎛️ 系统设置

- ✅ 主题定制 (6 套预设主题)
- ✅ 模型供应商管理
- ✅ 网络配置
- ✅ PWA 状态管理

---

## 🔐 登录方式

### 正常登录

需要 Supabase 认证，配置环境变量后使用。

### Ghost Mode（开发模式）

点击登录页 **GHOST MODE** 按钮跳过认证

| 配置项 | 值 |
|---------|-----|
| 用户 | ghost@yyc3.local |
| 角色 | developer |
| 说明 | 所有功能可用，数据仅 localStorage |

---

## 📁 项目结构

```
/
├── package.json                    # 依赖清单, 脚本定义
├── vite.config.ts                  # Vite 配置
├── vitest.config.ts                # Vitest 配置
├── tsconfig.json                   # TypeScript 配置
├── .eslintrc.json                 # ESLint 配置
├── .prettierrc.json               # Prettier 配置
├── README.md                      # 项目主文档
├── LICENSE                        # MIT 开源协议
├── CONTRIBUTING.md                 # 贡献指南
├── SECURITY.md                    # 安全策略
├── .env.example                   # 环境变量示例
├── .gitignore                    # Git 忽略文件
│
├── /src
│   ├── /styles                   # 样式文件
│   │   ├── index.css              # 主 CSS 入口
│   │   ├── tailwind.css           # Tailwind 导入
│   │   ├── theme.css              # CSS 自定义属性
│   │   └── fonts.css             # 字体声明
│   │
│   ├── /app
│   │   ├── App.tsx               # 根组件
│   │   ├── routes.ts             # 路由定义 (17 路由)
│   │   ├── /types               # 全局类型 (21 大类)
│   │   ├── /hooks              # 自定义 Hooks (19 个)
│   │   ├── /i18n               # 国际化语言包
│   │   ├── /lib                # 工具库
│   │   └── /components         # 组件库 (55+ 组件)
│   │
│   └── /main.tsx                # 应用入口
│
├── /docs                        # 详细文档
│   ├── 00-YYC³-CP-IM-项目总览索引/
│   ├── 01-YYC³-CP-IM-启动规划阶段/
│   ├── 02-YYC³-CP-IM-项目设计阶段/
│   ├── 03-YYC³-CP-IM-开发实施阶段/
│   ├── YYC³-CP-IM-最终测试报告-100%通过.md
│   └── YYC³-CP-IM-CICD-智能自动化部署指南.md
│
├── /public                      # 静态资源
├── /coverage                    # 测试覆盖率报告
├── Dockerfile                   # Docker 构建文件
├── docker-compose.yml           # Docker Compose 配置
└── nginx.conf                  # Nginx 配置
```

---

## 🔧 环境变量

创建 `.env` 文件（参考 `.env.example`）：

```bash
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WebSocket 配置
VITE_WS_URL=ws://localhost:3113/ws

# 可选：Ghost Mode (开发环境)
VITE_GHOST_MODE=true
```

---

## 🔌 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 开发服务器 | 5173 | Vite 默认端口 |
| 生产部署 | 3118 | 符合 YYC³ 标准 (3200-3500) |
| WebSocket | 3113 | 实时数据推送 |

---

## 🛣 路线图

### v0.1.0 (当前版本) - MVP 发布

- ✅ 核心监控功能
- ✅ AI 辅助集成
- ✅ PWA 支持
- ✅ Ghost Mode
- ✅ 100% 测试覆盖

### v0.2.0 (计划中)

- 🔄 实时协作功能
- 🔄 多语言扩展 (日语/韩语)
- 🔄 高级分析仪表盘
- 🔄 自定义报告模板

### v0.3.0 (未来规划)

- 🔮 插件系统
- 🔮 第三方集成 API
- 🔮 移动原生应用
- 🔮 云端数据同步

---

## 🤝 贡献

欢迎贡献！请遵循以下步骤：

### 贡献流程

1. **Fork** 本仓库
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **开启 Pull Request**

### 代码规范

| 规范 | 要求 |
|------|------|
| TypeScript | 使用严格模式 |
| 代码风格 | 遵循 ESLint 配置 |
| 测试 | 所有新功能必须包含测试 |
| 覆盖率 | 测试覆盖率不得低于 80% |
| 提交信息 | 使用清晰的提交信息格式 |

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构代码
- `test`: 测试相关
- `chore`: 构建/工具相关

详细贡献指南请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

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
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 联系方式

| 方式 | 信息 |
|------|------|
| **邮箱** | <admin@0379.email> |
| **项目** | YYC³ CloudPivot Intelli-Matrix |
| **GitHub** | [YYC-Cube/YYC3-CloudPivot-Intelli-Matrix](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix) |
| **问题反馈** | [Issues](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues) |

---

## 🙏 致谢

感谢以下开源项目：

- [React](https://reactjs.org/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架
- [Lucide Icons](https://lucide.dev/) - 图标库
- [Recharts](https://recharts.org/) - 图表库
- [Framer Motion](https://www.framer.com/motion/) - 动画库

---

## 🔒 安全

本项目非常重视安全性。如发现安全漏洞，请通过 [SECURITY.md](SECURITY.md) 中说明的方式报告。

---

## 🌐 English Version

[Back to Top](#yyc³-cloudpivot-intelli-matrix)

### Introduction

[YYC³ CloudPivot Intelli-Matrix (CP-IM)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix) is a modern intelligent monitoring and operations platform based on React 18 + TypeScript, designed for AI R&D and operations teams.

### Core Philosophy

> **Human-AI Symbiosis, Wisdom Together; AI as the Soul, Process as the Bone, Standards as the Pulse.**

### Key Features

| Feature | Description |
|----------|-------------|
| 🎨 **Cyberpunk Design** | Deep Blue #060e1f + Cyan #00d4ff Visual System |
| 🚀 **Real-time Monitoring** | WebSocket real-time push, node status, QPS, latency monitoring |
| 🤖 **AI Assistance** | Integrated AI SDK, provides intelligent decision suggestions |
| 📱 **Responsive Design** | Fully supports desktop, tablet, mobile |
| 🌐 **PWA Offline Support** | Can be used offline, local data caching |
| 🌍 **i18n Support** | Simplified Chinese / English (US) bilingual |
| 🎯 **Ghost Mode** | Development entry, skip Supabase authentication |
| 🔒 **Type Safety** | TypeScript strict mode, complete type definitions |
| ✅ **100% Test Coverage** | 903 tests all passing |
| 🚀 **Fast Build** | 2.49s production build time |

### Quick Start

```bash
# Clone repository
git clone https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git
cd YYC3-CloudPivot-Intelli-Matrix

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Contributing

We welcome contributions! Please follow the steps outlined in [CONTRIBUTING.md](CONTRIBUTING.md).

### License

This project is licensed under the [MIT License](LICENSE).

### Contact

| Method | Information |
|---------|-------------|
| **Email** | <admin@0379.email> |
| **Project** | YYC³ CloudPivot Intelli-Matrix |
| **GitHub** | [YYC-Cube/YYC3-CloudPivot-Intelli-Matrix](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix) |

---

<div align="center">

### ***YanYuCloudCube***

> ***<admin@0379.email>***
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

---

**[⬆ Back to Top](#yyc³-cloudpivot-intelli-matrix)**

</div>
