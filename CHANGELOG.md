# 更新日志 (CHANGELOG)

本文件记录 YYC³ CloudPivot Intelli-Matrix 项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [未发布]

### Added

- 完整的 CI/CD 自动化流程
- GitHub Actions 工作流（质量门禁、安全审计、性能基准测试）
- Docker 多阶段构建支持
- 自动化部署到 Staging/Production 环境
- 健康检查和自动回滚机制
- 安全扫描（Trivy、pnpm audit）
- 测试覆盖率报告（Codecov）
- 开源文档（CONTRIBUTING.md、CODE_OF_CONDUCT.md）
- **全局统一数据管理架构**
  - GlobalStoreRegistry - 单例数据存储注册中心
  - UnifiedStores - 统一数据存储定义
  - GlobalStoreContext - 全局数据访问上下文
  - 跨标签页数据同步（BroadcastChannel）
  - 自动数据迁移机制
- **统一设置管理面板**
  - 数据概览标签
  - 模型配置管理（CRUD完整支持）
  - Ollama实例管理（CRUD完整支持）
  - 数据库连接管理（CRUD完整支持）
  - 告警规则管理（CRUD完整支持）
  - 巡查配置管理（CRUD完整支持）
  - 数据导入导出功能
- **一体化存储核心文档**
  - 教科书级标准文档
  - 纯开源、本地化、一用户一端架构说明
  - 智能协同极致信任理念阐述

### Changed

- 优化 README.md，添加更多徽章和开源元素
- 改进测试文件结构，修复 51 个失败的测试
- 重构 layoutContext，统一上下文类型
- 优化 CI 工作流，添加并行测试分片
- **导航栏结构优化**
  - 移除独立的Ollama配置入口（已集成到大模型设置页面）
  - 移除独立的音乐空间入口（属于AI Family内容）
- **UI页面功能完善**
  - 所有设置项支持完整的编辑功能
  - 所有设置项支持删除操作
  - 所有设置项支持新增操作
  - 表单验证与错误提示优化
  - 编辑模式UI状态管理

### Fixed

- 修复所有 TypeScript 编译错误（51 个）
- 修复测试中的上下文导入路径问题
- 修复多元素匹配导致的测试失败
- 修复 Dashboard 移动端时间段按钮显示问题
- 修复 Sidebar 路由高亮显示问题
- 修复数据库连接类型定义不一致问题
- 修复表单编辑状态管理问题
- **🔒 安全强化 (v1.0.0 发布前终极审查)**
  - **P0-关键**: 移除 `supabaseClient.ts` 硬编码密码 (admin123, dev123)
  - **P0-关键**: 替换 `vitest.config.ts` 测试密钥为环境变量引用
  - **P0-关键**: 为 `chart.tsx` dangerouslySetInnerHTML 添加 HTML 消毒函数
  - **P1-优化**: 清理 13 处 console.log 残留，规范化日志级别
  - **P1-优化**: 修复核心文件 any 类型定义（security-monitor, realtime-sync）
  - **验证**: 全部 2023 个测试通过，TypeScript 零错误编译

---

## [0.0.1] - 2026-02-26

### Added

#### 核心功能

- **数据监控仪表盘**
  - 实时节点状态监控（GPU/内存/温度）
  - QPS 与延迟趋势图表
  - 吞吐量历史数据
  - 告警实时推送与处理

- **巡查管理系统**
  - 巡查计划调度
  - 巡查报告生成
  - 巡查历史记录
  - 自动化巡查流程

- **操作中心**
  - 快速操作网格
  - 操作模板管理
  - 实时操作日志流
  - 操作审计功能

- **AI 智能辅助**
  - AI 决策建议面板
  - SDK 流式聊天
  - 操作推荐引擎
  - 模式分析器

- **系统设置**
  - 主题定制（6 套预设主题）
  - 模型供应商管理
  - 网络配置
  - PWA 状态管理

#### 技术特性

- **前端框架**
  - React 18.3.1 + TypeScript 严格模式
  - React Router 7.13.0 (Data Mode)
  - 17 个路由配置

- **样式系统**
  - Tailwind CSS 4.1.12
  - Motion 12.23.24 动画库
  - Radix UI 无头组件库
  - 赛博朋克设计系统（#060e1f + #00d4ff）

- **数据可视化**
  - Recharts 2.15.2 图表库
  - Lucide 0.487.0 图标库
  - 实时数据更新

- **构建工具**
  - Vite 6.3.5
  - Vitest 4.0.18 测试框架
  - 1267 个测试用例，100% 通过率

- **PWA 支持**
  - 离线可用
  - 本地缓存
  - 可安装到主屏幕

- **国际化**
  - 中文简体支持
  - English (US) 支持
  - i18n 架构

#### 开发体验

- **开发工具**
  - ESLint + Prettier 代码规范
  - TypeScript 严格模式
  - 热模块替换 (HMR)

- **测试**
  - 单元测试
  - 集成测试
  - 覆盖率报告（门槛 80%）

- **文档**
  - 完整的项目文档
  - 开发者衔接文档
  - 快速开始指南
  - API 文档

#### 部署

- **Docker 支持**
  - 多阶段构建
  - Nginx 配置
  - Docker Compose

- **CI/CD**
  - GitHub Actions 工作流
  - 自动化测试
  - 自动化构建

### Changed

- 优化项目结构，清晰的分层架构
- 统一类型定义到 `src/app/types/index.ts`
- 重构 Hooks，提高代码复用性

### Technical Debt

- 部分组件需要性能优化
- 需要添加更多集成测试
- 需要完善 E2E 测试

---

## 版本说明

### 版本号规则

- **主版本号 (Major)**：不兼容的 API 修改
- **次版本号 (Minor)**：向下兼容的功能性新增
- **修订号 (Patch)**：向下兼容的问题修正

### 发布周期

- **主版本**：每季度发布一次
- **次版本**：每月发布一次
- **修订版**：根据需要发布

### 分支策略

- `main` - 生产环境代码
- `develop` - 开发环境代码
- `feature/*` - 功能分支
- `release/*` - 发布分支
- `hotfix/*` - 热修复分支

---

## 贡献者

感谢所有为 YYC³ CloudPivot Intelli-Matrix 做出贡献的开发者！

[贡献者列表](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/graphs/contributors)

---

## 链接

- [GitHub Releases](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/releases)
- [提交历史](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/commits/main)
- [项目看板](https://github.com/orgs/YYC-Cube/projects/1)

---

<div align="center">

**YanYuCloudCube Team**

[Words Initiate Quadrants, Language Serves as Core for Future](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix)

</div>
