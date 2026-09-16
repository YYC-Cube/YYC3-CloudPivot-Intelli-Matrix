# 更新日志 (CHANGELOG)

本文件记录 YYC³ CloudPivot Intelli-Matrix 项目的所有重要更改。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.1] - 2026-09-17

### Fixed

- **calendar.tsx 迁移至 react-day-picker v10 API**（dependabot 升级 10.0.1 后遗留的编译阻断）
  - classNames 键名全面更名：`nav_button_previous/next`→`button_previous/next`、`table`→`month_grid`、`head_row`→`weekdays`、`head_cell`→`weekday`、`row`→`week`、`cell`→`day`、`day`→`day_button`、`day_*`→去前缀（`range_start/range_end/selected/today/outside/disabled/range_middle/hidden`）
  - components: `IconLeft/IconRight` → `Chevron`（按 orientation 映射 lucide 图标）
- **CI test 分片覆盖率阈值误判**：`--shard + --coverage` 时 vitest 按分片局部覆盖率（≈7%）对照全局阈值（26%）判定，4 分片全误报失败
  - `vitest.config.ts`: `VITEST_SHARD` 存在时省略 thresholds（shard 仅产 lcov 供合并）
  - `ci.yml`: test job 注入 `VITEST_SHARD=1`，阈值判定职责收归 coverage-gate job（全量单跑）
- **Docker 镜像构建失败（ERR_PNPM_IGNORED_BUILDS）**：deps 阶段缺失 `pnpm-workspace.yaml`（allowBuilds 审批）与 `.npmrc`；`NODE_VERSION` 默认 20→22（pnpm 11 要求 Node ≥22.13）

### Verified

- **CI 全链绿灯**（run 35133374332）: Code Quality ✅ / Test 4 分片 ✅ / Coverage Gate phase1 ✅ / Build ✅ / Docker Build & Push ✅ / GitHub Pages 部署 ✅
- 覆盖率基线: Lines 27.33% / Functions 23.71% / Branches 25.69% / Statements 25.94%（均达 phase1 门禁）
- Docker builder 阶段本地全链验证（pnpm install + pnpm build）通过

---

## [1.0.0] - 2026-09-16

### Security

- **生产链安全审计归零**: `pnpm update --latest --prod` 修复 27 项漏洞（18 high），二轮合并后复审保持 **0 vulnerabilities**
- 全局 secret 扫描通过：无硬编码密钥（env.config.ts 均为变量名映射，supabaseClient mock 密码已环境变量化）

### Fixed

- **CI 全线失败修复（根因: pnpm-workspace.yaml 为 config-only 缺 packages 字段，pnpm 9.x 不支持）**
  - `pnpm-workspace.yaml` 补充 `packages: ["."]`，与 pnpm 11 config-only 语义兼容
  - CI/deploy/release 三工作流 `PNPM_VERSION` 统一升级 `9.x/8.x → 11.x`（与本地及 lockfile v9 对齐）
  - `release.yml` 清理 `action-setup@v5` 漂移（→v4）与冗余 store-cache 步骤
  - lucide-react 1.8.0 移除品牌图标导致的 tsc 编译错误: `Figma`→`Frame`、`Github`→`GitBranch`
- **TypeScript 7.0 兼容**: 移除三个 tsconfig 中已弃用的 `baseUrl`（`paths` 自 TS 4.1 起可独立使用）
- Slack 通知 action 输入校验错误：`8398a7/action-slack@v3` → `slackapi/slack-github-action@v2`（官方维护）
- Lighthouse job `pnpm dlx` 缺 pnpm 依赖：改为 `npx --yes` 直跑 + env 间接引用消除 Context access 警告
- Tailwind v4 命名迁移：`bg-gradient-to-br` → `bg-linear-to-br`

### Added

- **44 项 dependabot 依赖 PR 全部合并清零**（批量合并 + 锁文件对齐 + 单次推送策略）
- **部署后域名自动验活（deploy.yml `verify-domain`）**
  - Pivot.yyc3.top 探活: HTTPS 200 + 品牌内容断言，10 次指数退避重试
  - 失败自动创建 P0 Issue（含 DNS/Pages 绑定排查流程）+ 诊断产物留存
- **Lighthouse 性能预算门禁（lighthouserc.json + ci.yml `lighthouse` job）**
  - 性能 ≥60 / 无障碍 ≥80 强制阻断，脚本 ≤700KB 样式 ≤150KB 预算
  - PR/手动触发，HTML 报告上传 artifact 保留 14 天
- **覆盖率渐进门禁（vitest.config.ts + ci.yml `coverage-gate` job）**
  - `COVERAGE_GATE` 环境变量驱动: phase1(26%) → phase2(45%) → phase3(60%) → final(80%)
  - CI 强制 phase1 门禁，只升不降（ratchet），本地开发不受影响
- **v1.0.0 正式版标签发布**（annotated tag，含里程碑说明）
- 完整的 CI/CD 自动化流程

### Removed

- **冗余 `package-lock.json`**：git rm + .gitignore 拦截，统一 pnpm-lock 单一依赖事实源
- **冗余文档目录 `docs/13-智能演进-优化阶段`**（与 docs/11 同名重复）：3 篇有效文档归并至 11 体系对应子域（文档同步机制→0905、音乐音色系统→0902）

### Verified

- 全量测试基线: **135 文件 / 2023 用例全绿**（安全升级 + 44 项合并后复测通过）
- YAML×3 + JSON 配置语法校验通过
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
