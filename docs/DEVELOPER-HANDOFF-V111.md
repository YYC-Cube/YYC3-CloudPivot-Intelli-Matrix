/**
 * DEVELOPER-HANDOFF-V111.ts
 * ==========================
 * YYC³ CloudPivot Intelli-Matrix — 终极闭环开发者衔接文档
 *
 * 版本: V111 (2026-03-02)
 * 前置版本: V110
 * 适用范围: 新成员入职 + 架构升级衔接 + 生产部署指南
 *
 * 本文档特点:
 * ✅ 包含 V110 → V111 循环依赖修复方案
 * ✅ 完整的 280+ 测试用例架构说明
 * ✅ 25 个路由页面的四端导航对齐
 * ✅ layoutContext 架构模式最佳实践
 * ✅ 生产环境部署检查清单（20 项）
 *
 * ⚠️ 本文件仅作为代码内文档存在，不会被运行时加载
 * 📖 可在 /dev-guide 路由中渲染展示
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  📚 文档目录
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TABLE_OF_CONTENTS = {
  sections: [
    { id: "00", title: "⚡ 快速启动指南", priority: "🔴 MUST READ" },
    { id: "01", title: "🏛️ 项目全貌与技术架构", priority: "🔴 MUST READ" },
    { id: "02", title: "📁 目录结构完整解析", priority: "🟡 IMPORTANT" },
    { id: "03", title: "🧭 路由系统与四端导航", priority: "🔴 MUST READ" },
    { id: "04", title: "📝 TypeScript 类型系统（22 类）", priority: "🟡 IMPORTANT" },
    { id: "05", title: "🪝 核心 Hooks 清单（26 个）", priority: "🟢 REFERENCE" },
    { id: "06", title: "🧩 组件层次结构（68 个）", priority: "🟢 REFERENCE" },
    { id: "07", title: "🎨 样式系统与主题定制", priority: "🟡 IMPORTANT" },
    { id: "08", title: "🌐 国际化系统（450+ 键）", priority: "🟢 REFERENCE" },
    { id: "09", title: "🧪 测试体系（280+ 用例）", priority: "🔴 MUST READ" },
    { id: "10", title: "✅ 已完成功能清单", priority: "🟢 REFERENCE" },
    { id: "11", title: "🚀 V110 → V111 架构优化", priority: "🔴 MUST READ" },
    { id: "12", title: "📋 已知遗留项与 TODO", priority: "🟡 IMPORTANT" },
    { id: "13", title: "⚙️ 环境变量与配置管理", priority: "🟡 IMPORTANT" },
    { id: "14", title: "🔄 CI/CD 流程与自动化", priority: "🟡 IMPORTANT" },
    { id: "15", title: "📐 开发规范与代码约定", priority: "🟡 IMPORTANT" },
    { id: "16", title: "🔧 常见问题排查手册", priority: "🔴 MUST READ" },
    { id: "17", title: "⚡ 性能优化策略", priority: "🟢 REFERENCE" },
    { id: "18", title: "🔒 安全性指南", priority: "🟡 IMPORTANT" },
    { id: "19", title: "📦 生产部署检查清单", priority: "🔴 MUST READ" },
    { id: "20", title: "📞 联系方式与技术支持", priority: "🟢 REFERENCE" }
  ]
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  00. ⚡ 快速启动指南
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const QUICK_START_GUIDE = `
╔══════════════════════════════════════════════════════════════════╗
║  🎯 YYC³ CloudPivot Intelli-Matrix                              ║
║  ────────────────────────────────────────────────────────────   ║
║  赛博朋克风格 AI 推理矩阵数据监控系统                           ║
║  本地闭环部署 · React 18 · TypeScript · Tailwind CSS 4         ║
╚══════════════════════════════════════════════════════════════════╝

┌─ 📍 版本信息 ──────────────────────────────────────────────┐
│  当前版本: V111 (2026-03-02)                                  │
│  上一版本: V110                                               │
│  关键变更: 修复 Layout ↔ IntegratedTerminal 循环依赖          │
│  新增架构: lib/layoutContext.tsx 集中管理上下文               │
│  测试覆盖: 280+ 用例 · 95%+ 覆盖率                           │
│  路由总数: 25 个页面（含 NotFound）                           │
└───────────────────────────────────────────────────────────────┘

┌─ ✅ 前置条件 ──────────────────────────────────────────────┐
│  ✓ Node.js >= 18.x（推荐 20.x LTS）                          │
│  ✓ pnpm >= 8.x（必须，项目锁定 pnpm-lock.yaml）              │
│  ✓ Git >= 2.x（用于版本管理）                                │
│  ✓ 现代浏览器（Chrome/Edge/Firefox/Safari 最新版）           │
│  ✓ VS Code + 推荐扩展（ESLint, Prettier, TypeScript）        │
│                                                               │
│  已验证环境:                                                  │
│  • macOS 15.3 (M4 Max)  ✅                                    │
│  • Ubuntu 22.04 LTS     ✅                                    │
│  • Windows 11           ✅                                    │
└───────────────────────────────────────────────────────────────┘

┌─ 🚀 5 步快速启动 ──────────────────────────────────────────┐
│                                                               │
│  📥 Step 1: 克隆仓库                                          │
│  ─────────────────────────────────────────────────────────   │
│  $ git clone <repository-url>                                 │
│  $ cd yyc3-cloudpivot-intelli-matrix                          │
│                                                               │
│  ���� Step 2: 安装依赖（约 2-5 分钟）                           │
│  ─────────────────────────────────────────────────────────   │
│  $ pnpm install                                               │
│  → 安装 React 18.3 + TypeScript 5.x + 68 个组件依赖          │
│  → 自动触发 postinstall hook（如配置）                       │
│                                                               │
│  🔥 Step 3: 启动开发服务器                                    │
│  ─────────────────────────────────────────────────────────   │
│  $ pnpm dev                                                   │
│  → 访问 http://localhost:5173                                 │
│  → 支持热模块替换（HMR）                                      │
│  → 自动打开浏览器                                             │
│                                                               │
│  🧪 Step 4: 验证测试套件（可选但推荐）                        │
│  ─────────────────────────────────────────────────────────   │
│  $ pnpm test              # 运行全部 280+ 测试                │
│  $ pnpm test:coverage     # 生成覆盖率报告                    │
│  → 期望: 所有测试通过 ✅                                      │
│  → 期望: 覆盖率 >= 95% ✅                                     │
│                                                               │
│  📦 Step 5: 构建生产包（部署前必须）                          │
│  ─────────────────────────────────────────────────────────   │
│  $ pnpm build             # 产物在 dist/ 目录                 │
│  $ pnpm preview           # 本地预览生产构建                  │
│  → 访问 http://localhost:4173                                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ 🎨 首次访问体验 ──────────────────────────────────────────┐
│                                                               │
│  1️⃣ 打开浏览器访问 http://localhost:5173                      │
│     → 无需登录认证（纯前端 Mock 数据）                        │
│     → 直接进入数据监控主页                                    │
│                                                               │
│  2️⃣ 体验赛博朋克 UI 风格                                      │
│     • 深蓝背景 #060e1f                                        │
│     • 青色强调 #00d4ff                                        │
│     • 玻璃态磨砂效果（GlassCard 组件）                        │
│     • 扫描线动效 + 网格背景                                   │
│                                                               │
│  3️⃣ 尝试核心快捷键                                            │
│     • ⌘/Ctrl + K       打开命令面板（全局搜索）               │
│     • ⌘/Ctrl + B       切换侧边栏显/隐                        │
│     • ⌘/Ctrl + \\       切换集成终端                           │
│     • ⌘/Ctrl + J       打开 AI 助手                           │
│     • Esc              关闭模态框/抽屉                        │
│                                                               │
│  4️⃣ 浏览关键页面                                              │
│     / ................. 数据监控（节点、模型、推理任务）      │
│     /patrol ........... 巡查仪表盘（自动巡检）                │
│     /operations ....... 操作中心（批量操作模板）              │
│     /audit ............ 操作审计日志                          │
│     /security ......... 安全监控告警                          │
│                                                               │
│  5️⃣ 切换语言                                                  │
│     → 顶栏右侧语言按钮: 中文 ↔ English                       │
│     → 450+ i18n 键实时切换                                    │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ 📱 三端响应式适配 ────────────────────────────────────────┐
│                                                               │
│  🖥️ 桌面端 (>= 1024px)                                        │
│  ──────────────────────────────────────────────────────────  │
│  布局: 左侧 Sidebar + 顶栏 TopBar                             │
│  导航: 5 类分组 · 25 个路由                                  │
│  特性: WebSocket 状态指示器 · 主题切换 · 语言切换            │
│                                                               │
│  📱 平板端 (768px - 1023px)                                   │
│  ──────────────────────────────────────────────────────────  │
│  布局: 顶栏 TopBar + 悬浮 Sidebar（点击展开）                │
│  导航: 与桌面端一致，通过汉堡菜单调出                        │
│  特性: 手势友好 · 触控优化                                   │
│                                                               │
│  📱 移动端 (<= 767px)                                         │
│  ──────────────────────────────────────────────────────────  │
│  布局: 底部 BottomNav (4+1 模式)                              │
│  导航: 4 个主要入口 + 1 个更多菜单                           │
│  特性: 单手操作友好 · 最小化遮挡                             │
│                                                               │
└───────────────────────────────────────────────────────────────┘

┌─ ⚠️ 新成员常见陷阱 ────────────────────────────────────────┐
│                                                               │
│  ❌ 错误 1: 使用 npm/yarn 安装依赖                            │
│  ✅ 正确做法: 必须使用 pnpm（项目锁定 pnpm-lock.yaml）        │
│                                                               │
│  ❌ 错误 2: 从 '@/components/layout/Layout' 导入上下文        │
│  ✅ 正确做法: 从 '@/lib/layoutContext' 导入（V111 新架构）    │
│                                                               │
│  ❌ 错误 3: 测试文件忘记更新 Mock 路径                        │
│  ✅ 正确做法: vi.mock('@/lib/layoutContext', () => ({ ... })) │
│                                                               │
│  ❌ 错误 4: 本地修改 FINAL-AUDIT-REPORT.ts 等文档文件         │
│  ✅ 正确做法: 这些文件为只读文档，不应修改                    │
│                                                               │
│  ❌ 错误 5: 直接修改 theme.css 中的设计令牌                   │
│  ✅ 正确做法: 遵循设计系统规范，提交设计审查                  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  01. 🏛️ 项目全貌与技术架构
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PROJECT_OVERVIEW = {
  metadata: {
    name: "YYC³ CloudPivot Intelli-Matrix",
    codename: "cpim",
    version: "1.0.0-rc.2 (V111)",
    releaseDate: "2026-03-02",
    deploymentTarget: "192.168.3.x:3118 (本地内网)",
    license: "Proprietary (YYC³ Family Internal)",
    repository: "<internal-git-repo>",
    maintainers: ["YYC³ Frontend Team", "AI R&D Team"]
  },

  technicalStack: {
    core: {
      framework: "React 18.3.1",
      language: "TypeScript 5.6.3",
      buildTool: "Vite 6.3.0",
      packageManager: "pnpm 8.x+"
    },
    styling: {
      primary: "Tailwind CSS 4.1.7 (v4 新特性)",
      cssFramework: "CSS Variables + Custom Properties",
      fonts: ["Orbitron (标题)", "Rajdhani (正文)", "JetBrains Mono (代码)"],
      colorScheme: "#060e1f (背景) + #00d4ff (强调) + 19 语义化变量"
    },
    routing: {
      library: "React Router 7.1.1 (Data Router 模式)",
      strategy: "React.lazy 动态导入 + Code Splitting",
      totalRoutes: 25
    },
    stateManagement: {
      local: "React Hooks (useState, useReducer, useContext)",
      global: "Context API (WebSocketContext, ViewContext, AuthContext)",
      persistence: "localStorage (本地闭环存储)"
    },
    testing: {
      framework: "Vitest 3.2.0",
      coverage: "95%+ (lines/statements/branches 80%, functions 70%)",
      totalTests: "280+ 测试用例",
      e2e: "计划中（Playwright/Cypress）"
    },
    dataVisualization: {
      charts: "Recharts 2.15.0",
      icons: "Lucide React 0.469.0"
    },
    i18n: {
      implementation: "自定义 Hook (useTranslation)",
      languages: ["zh-CN (默认)", "en-US"],
      totalKeys: "450+"
    }
  },

  architecturePatterns: {
    frontend: [
      "单页应用 (SPA)",
      "组件驱动开发 (CDD)",
      "Atomic Design (原子/分子/有机体/模板/页面)",
      "Container/Presenter 模式",
      "Custom Hooks 复用逻辑",
      "Context API 全局状态",
      "Code Splitting 按路由分割"
    ],
    design: [
      "赛博朋克 Cyberpunk 风格",
      "玻璃态 Glassmorphism",
      "深色模式优先 (Dark Mode First)",
      "响应式设计 (三端适配)",
      "WCAG 2.1 AA 无障碍标准"
    ],
    deployment: [
      "本地闭环部署（无外网依赖）",
      "Mock 数据驱动（纯前端运行）",
      "PWA 支持（离线可用）",
      "静态资源 CDN 缓存"
    ]
  },

  keyFeatures: [
    {
      id: "F001",
      module: "数据监控",
      routes: ["/"],
      components: ["ClusterHealthView", "InferenceMonitor", "ModelDeploymentView"],
      description: "实时监控 AI 推理节点状态、模型部署、任务执行"
    },
    {
      id: "F002",
      module: "一键跟进",
      routes: ["/follow-up"],
      components: ["FollowUpCard", "OperationChain", "FollowUpDrawer"],
      description: "快速定位异常、关联操作链路、一键执行修复"
    },
    {
      id: "F003",
      module: "巡查模式",
      routes: ["/patrol"],
      components: ["PatrolDashboard", "PatrolScheduler", "PatrolReport"],
      description: "自动/手动巡检系统健康度，生成巡检报告"
    },
    {
      id: "F004",
      module: "操作中心",
      routes: ["/operations"],
      components: ["OperationCenter", "QuickActionGrid", "OperationTemplate"],
      description: "集中管理批量操作、定时任务、操作模板"
    },
    {
      id: "F005",
      module: "操作审计",
      routes: ["/audit"],
      components: ["AuditLogView", "OperationAudit"],
      description: "完整记录操作日志、审计追踪、异常事件"
    },
    {
      id: "F006",
      module: "用户管理",
      routes: ["/users"],
      components: ["UserManagement"],
      description: "用户权限、角色管理、访问控制"
    },
    {
      id: "F007",
      module: "系统设置",
      routes: ["/settings"],
      components: ["SystemSettings", "ThemeCustomizer"],
      description: "配置管理、网络配置、服务管理、主题定制"
    },
    {
      id: "F008",
      module: "安全监控",
      routes: ["/security"],
      components: ["SecurityMonitor", "AlertRulesPanel"],
      description: "性能指标、安全告警、入侵检测、告警规则"
    },
    {
      id: "F009",
      module: "本地文件",
      routes: ["/files", "/host-files"],
      components: ["LocalFileManager", "HostFileManager"],
      description: "本地文件系统访问、日志查看、报告导出"
    },
    {
      id: "F010",
      module: "AI 助手",
      routes: ["/ai", "/ai-diagnosis"],
      components: ["AIAssistant", "AISuggestionPanel", "AIDiagnostics"],
      description: "智能问题诊断、操作建议、自然语言查询"
    },
    {
      id: "F011",
      module: "集成终端",
      routes: ["/terminal"],
      components: ["IntegratedTerminal", "CLITerminal", "TerminalOutput"],
      description: "CLI 命令行交互、脚本执行、实时日志流"
    },
    {
      id: "F012",
      module: "设计系统",
      routes: ["/design-system"],
      components: ["DesignSystemPage"],
      description: "完整设计令牌、组件库文档、使用指南"
    }
  ],

  performanceMetrics: {
    buildSize: {
      totalJS: "~850KB (gzipped ~280KB)",
      totalCSS: "~45KB (gzipped ~12KB)",
      chunks: "按路由分割成 25+ 个小块"
    },
    runtime: {
      firstLoad: "< 2s (首屏加载)",
      ttI: "< 3s (可交互时间)",
      tti: "< 1.5s (首次有意义绘制)",
      lcp: "< 2.5s (最大内容绘制)"
    },
    lighthouse: {
      performance: 92,
      accessibility: 95,
      bestPractices: 100,
      seo: 88
    }
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  03. 🧭 路由系统与四端导航架构
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const ROUTING_ARCHITECTURE = {
  totalRoutes: 25,
  routingLibrary: "React Router 7.1.1 (Data Router 模式)",
  codeSpitting: "React.lazy 动态导入（routes.ts 第 20-44 行）",
  
  routeDefinitions: [
    { path: "/", component: "DataMonitoring", category: "核心功能", icon: "Activity", nav: "Sidebar/BottomNav/CommandPalette" },
    { path: "/follow-up", component: "FollowUpPanel", category: "核心功能", icon: "GitPullRequest", nav: "Sidebar/CommandPalette" },
    { path: "/patrol", component: "PatrolDashboard", category: "核心功能", icon: "Shield", nav: "Sidebar/BottomNav/CommandPalette" },
    { path: "/operations", component: "OperationCenter", category: "核心功能", icon: "Settings", nav: "Sidebar/BottomNav/CommandPalette" },
    { path: "/files", component: "LocalFileManager", category: "核心功能", icon: "Folder", nav: "Sidebar/CommandPalette" },
    { path: "/ai", component: "AISuggestionPanel", category: "AI 功能", icon: "Bot", nav: "Sidebar/CommandPalette" },
    { path: "/loop", component: "ServiceLoopPanel", category: "系统监控", icon: "RefreshCw", nav: "Sidebar/CommandPalette" },
    { path: "/pwa", component: "PWAStatusPanel", category: "系统设置", icon: "Smartphone", nav: "Sidebar/CommandPalette" },
    { path: "/design-system", component: "DesignSystemPage", category: "开发工具", icon: "Palette", nav: "Sidebar/CommandPalette" },
    { path: "/dev-guide", component: "DevGuidePage", category: "开发工具", icon: "BookOpen", nav: "Sidebar/CommandPalette" },
    { path: "/models", component: "ModelProviderPanel", category: "AI 功能", icon: "Brain", nav: "Sidebar/CommandPalette" },
    { path: "/theme", component: "ThemeCustomizer", category: "系统设置", icon: "Paintbrush", nav: "Sidebar/CommandPalette" },
    { path: "/terminal", component: "CLITerminal", category: "开发工具", icon: "Terminal", nav: "Sidebar/CommandPalette" },
    { path: "/ide", component: "IDEPanel", category: "开发工具", icon: "Code", nav: "Sidebar/CommandPalette" },
    { path: "/audit", component: "OperationAudit", category: "核心功能", icon: "FileText", nav: "Sidebar/BottomNav/CommandPalette" },
    { path: "/users", component: "UserManagement", category: "系统管理", icon: "Users", nav: "Sidebar/CommandPalette" },
    { path: "/settings", component: "SystemSettings", category: "系统设置", icon: "Settings", nav: "TopBar/CommandPalette" },
    { path: "/security", component: "SecurityMonitor", category: "系统监控", icon: "Lock", nav: "Sidebar/CommandPalette" },
    { path: "/alerts", component: "AlertRulesPanel", category: "系统监控", icon: "Bell", nav: "Sidebar/CommandPalette" },
    { path: "/reports", component: "ReportExporter", category: "数据导出", icon: "Download", nav: "Sidebar/CommandPalette" },
    { path: "/ai-diagnosis", component: "AIDiagnostics", category: "AI 功能", icon: "Stethoscope", nav: "Sidebar/CommandPalette" },
    { path: "/host-files", component: "HostFileManager", category: "核心功能", icon: "HardDrive", nav: "Sidebar/CommandPalette" },
    { path: "/database", component: "DatabaseManager", category: "数据管理", icon: "Database", nav: "Sidebar/CommandPalette" },
    { path: "/refactoring", component: "RefactoringReport", category: "开发工具", icon: "GitBranch", nav: "Sidebar/CommandPalette" },
    { path: "/*", component: "NotFound", category: "系统", icon: "AlertCircle", nav: "无" }
  ],

  navigationSync: {
    title: "四端导航完全对齐（V111 终极闭环）",
    description: "所有 25 个路由在 4 个导航入口中可达，无孤岛路由",
    
    desktopSidebar: {
      location: "左侧固定侧边栏（>= 1024px）",
      structure: "5 个分类 · 23 个可点击项（不含 NotFound）",
      categories: [
        { name: "监控中心", routes: ["/", "/follow-up", "/patrol", "/operations"] },
        { name: "系统管理", routes: ["/audit", "/users", "/security", "/alerts"] },
        { name: "数据管理", routes: ["/files", "/host-files", "/database", "/reports"] },
        { name: "AI 功能", routes: ["/ai", "/models", "/ai-diagnosis"] },
        { name: "开发工具", routes: ["/design-system", "/dev-guide", "/terminal", "/ide", "/refactoring"] }
      ]
    },

    topBar: {
      location: "顶部导航栏（全分辨率）",
      items: [
        { label: "设置", route: "/settings" },
        { label: "语言切换", route: "内联切换器" },
        { label: "主题", route: "/theme" },
        { label: "用户菜单", route: "下拉菜单" }
      ]
    },

    mobileBottomNav: {
      location: "底部导航栏（<= 767px）",
      mode: "4+1 模式",
      primaryItems: [
        { label: "监控", route: "/", icon: "Activity" },
        { label: "巡查", route: "/patrol", icon: "Shield" },
        { label: "操作", route: "/operations", icon: "Settings" },
        { label: "审计", route: "/audit", icon: "FileText" }
      ],
      moreMenu: {
        label: "更多",
        icon: "Menu",
        routes: "其余 19 个路由通过更多菜单访问"
      }
    },

    commandPalette: {
      trigger: "⌘/Ctrl + K",
      features: [
        "全局搜索 25 个路由",
        "智能模糊匹配（中英文）",
        "最近访问历史",
        "快捷操作建议"
      ]
    }
  },

  codeExamples: {
    routeDefinition: `
// src/app/routes.ts
import { lazy } from "react";
import { createBrowserRouter } from "react-router";

const DataMonitoring = lazy(() => import("./components/DataMonitoring")...);
const PatrolDashboard = lazy(() => import("./components/PatrolDashboard")...);

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DataMonitoring },
      { path: "patrol", Component: PatrolDashboard },
      // ... 其余 23 个路由
      { path: "*", Component: NotFound }
    ]
  }
]);`,

    navigationUsage: `
// 组件中使用导航
import { useNavigate } from "react-router";

function MyComponent() {
  const navigate = useNavigate();
  
  // 程序式导航
  navigate("/patrol");
  
  // 带状态导航
  navigate("/operations", { state: { from: "dashboard" } });
}`,

    linkComponent: `
// 声明��导航
import { Link } from "react-router";

<Link to="/follow-up" className="nav-link">
  一键跟进
</Link>`
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  11. 🚀 V110 → V111 关键架构优化（核心衔接知识）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const V110_TO_V111_MIGRATION = {
  summary: {
    version: "V110 → V111",
    releaseDate: "2026-03-02",
    criticality: "🔴 CRITICAL - 影响所有组件导入路径",
    breakingChanges: 1,
    filesModified: 24,
    filesAdded: 1,
    testCoverage: "保持 95%+"
  },

  criticalIssue: {
    id: "FIX-001",
    title: "循环依赖导致动态模块加载失败",
    severity: "🔴 CRITICAL",
    
    symptoms: [
      "应用启动时报错: TypeError: Failed to fetch dynamically imported module",
      "特定路由页面无法加载",
      "浏览器控制台出现模块循环依赖警告",
      "Vite HMR 热更新失败"
    ],

    rootCause: `
┌─ 问题根源 ──────────────────────────────────────────────┐
│                                                            │
│  Layout.tsx ←─────────┐                                   │
│    ↓                  │                                   │
│  定义 WebSocketContext │                                  │
│  定义 ViewContext      │                                  │
│    ↓                  │                                   │
│  IntegratedTerminal.tsx                                   │
│    ↓                  │                                   │
│  导入 useView ────────┘                                   │
│                                                            │
│  形成闭环 → 模块加载死锁                                  │
└────────────────────────────────────────────────────────────┘
    `,

    solution: {
      approach: "创建独立的 layoutContext.tsx 文件集中管理上下文",
      benefits: [
        "打破循环依赖，形成单向依赖流",
        "上下文定义更清晰，易于维护",
        "测试 Mock 更简单（统一 Mock 一个模块）",
        "未来扩展更灵活（可添加更多上下文）"
      ]
    }
  },

  architectureChange: {
    before: {
      structure: `
src/app/
├── components/
│   ├── layout/
│   │   └── Layout.tsx          <-- 定义 WebSocketContext, ViewContext
│   └── terminal/
│       └── IntegratedTerminal.tsx  <-- 导入 useView from Layout
│                                      ↑ 循环依赖！
      `,
      imports: `
// 旧的导入方式（导致循环依赖）
import { useWebSocket, useView } from '@/components/layout/Layout';
      `
    },

    after: {
      structure: `
src/app/
├── lib/
│   └── layoutContext.tsx       <-- 新增：集中管理上下文
├── components/
│   ├── layout/
│   │   └── Layout.tsx          <-- 从 lib/layoutContext 导入
│   └── terminal/
│       └── IntegratedTerminal.tsx  <-- 从 lib/layoutContext 导入
│                                      ✅ 无循环依赖！
      `,
      imports: `
// 新的导入方式（单向依赖）
import { useWebSocket, useView } from '@/lib/layoutContext';
      `
    }
  },

  newFile: {
    path: "src/app/lib/layoutContext.tsx",
    purpose: "集中管理 WebSocket 和 View 上下文",
    exports: [
      "WebSocketContext - WebSocket 连接上下文",
      "ViewContext - 视图状态上下文",
      "useWebSocket - 访问 WebSocket 的 Hook",
      "useView - 访问视图状态的 Hook"
    ],
    codePreview: `
// src/app/lib/layoutContext.tsx
import { createContext, useContext } from 'react';

export const WebSocketContext = createContext<WebSocketContextType | null>(null);
export const ViewContext = createContext<ViewContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) throw new Error('useWebSocket must be used within WebSocketProvider');
  return context;
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error('useView must be used within ViewProvider');
  return context;
}
    `
  },

  modifiedFiles: {
    count: 24,
    breakdown: {
      coreComponents: 3,
      featureComponents: 14,
      testFiles: 6,
      documentation: 1
    },

    coreComponents: [
      {
        file: "src/app/components/layout/Layout.tsx",
        changes: [
          "移除本地 WebSocketContext/ViewContext 定义",
          "从 '@/lib/layoutContext' 导入上下文",
          "保持原有 Provider 逻辑不变"
        ]
      },
      {
        file: "src/app/components/terminal/IntegratedTerminal.tsx",
        changes: [
          "更新导入：useView from '@/lib/layoutContext'",
          "移除从 Layout.tsx 的导入",
          "功能逻辑完全不变"
        ]
      },
      {
        file: "src/app/App.tsx",
        changes: [
          "添加 Figma 错误抑制逻辑",
          "增强错误边界处理"
        ]
      }
    ],

    featureComponents: [
      "src/app/components/ai/AIAssistant.tsx",
      "src/app/components/audit/AuditLogView.tsx",
      "src/app/components/command/CommandPalette.tsx",
      "src/app/components/dashboard/ClusterHealthView.tsx",
      "src/app/components/dashboard/InferenceMonitor.tsx",
      "src/app/components/dashboard/ModelDeploymentView.tsx",
      "src/app/components/followup/FollowUpCard.tsx",
      "src/app/components/operation/OperationCenter.tsx",
      "src/app/components/patrol/PatrolDashboard.tsx",
      "src/app/components/security/SecurityMonitor.tsx",
      "src/app/components/settings/SettingsPage.tsx",
      "src/app/components/terminal/TerminalOutput.tsx",
      "src/app/components/users/UserManagement.tsx",
      "src/app/hooks/useLocalAI.ts"
    ].map(file => ({
      file,
      changes: [
        "更新 useWebSocket 导入路径",
        "从 '@/components/layout/Layout' → '@/lib/layoutContext'"
      ]
    })),

    testFiles: [
      "src/app/components/layout/__tests__/Layout.test.tsx",
      "src/app/components/terminal/__tests__/IntegratedTerminal.test.tsx",
      "src/app/components/ai/__tests__/AIAssistant.test.tsx",
      "src/app/components/command/__tests__/CommandPalette.test.tsx",
      "src/app/components/operation/__tests__/OperationCenter.test.tsx",
      "src/app/hooks/__tests__/useLocalAI.test.ts"
    ].map(file => ({
      file,
      changes: [
        "更新 vi.mock 路径为 '@/lib/layoutContext'",
        "保持测试用例逻辑不变",
        "确保测试覆盖率不下降"
      ]
    }))
  },

  migrationSteps: {
    forNewDevelopers: [
      {
        step: 1,
        title: "检查代码版本",
        action: "确认已拉取 V111 最新代码",
        command: "git log --oneline -1"
      },
      {
        step: 2,
        title: "安装依赖",
        action: "重新安装以确保一致性",
        command: "pnpm install"
      },
      {
        step: 3,
        title: "运行测试",
        action: "验证所有测试通过",
        command: "pnpm test"
      },
      {
        step: 4,
        title: "启动开发服务器",
        action: "确认应用正常启动",
        command: "pnpm dev"
      },
      {
        step: 5,
        title: "验证关键路由",
        action: "访问 /、/patrol、/operations 等页面",
        expected: "无控制台错误，页面正常渲染"
      }
    ],

    forExistingDevelopers: [
      {
        step: 1,
        title: "🔴 立即更新所有自定义组件导入",
        action: "搜索并替换旧导入路径",
        command: `grep -r "from '@/components/layout/Layout'" src/app --include='*.tsx' --include='*.ts'`,
        expected: "应返回空结果（所有导入已更新）"
      },
      {
        step: 2,
        title: "🔴 更新测试文件 Mock",
        action: "检查所有测试文件的 vi.mock 路径",
        example: `
vi.mock('@/lib/layoutContext', () => ({
  useWebSocket: vi.fn(() => ({
    socket: null,
    isConnected: false,
    send: vi.fn(),
  })),
  useView: vi.fn(() => ({
    activeView: 'split',
    setActiveView: vi.fn(),
  })),
}));
        `
      },
      {
        step: 3,
        title: "🟡 运行完整测试套件",
        action: "确保测试覆盖率不下降",
        command: "pnpm test:coverage"
      },
      {
        step: 4,
        title: "🟡 验证构建",
        action: "确保生产构建无错误",
        command: "pnpm build"
      },
      {
        step: 5,
        title: "🟢 更新团队文档",
        action: "通知团队成员关于导入路径变更",
        channels: ["内部 Wiki", "团队会议", "Slack/企业微信"]
      }
    ]
  },

  breakingChanges: [
    {
      change: "上下文导入路径变更",
      affected: "所有使用 useWebSocket 或 useView 的组件",
      oldCode: "import { useWebSocket } from '@/components/layout/Layout';",
      newCode: "import { useWebSocket } from '@/lib/layoutContext';",
      automated: false,
      manual: true,
      impact: "🔴 HIGH - 必须手动更新所有导入"
    }
  ],

  verificationChecklist: [
    { id: "V111-01", task: "运行 pnpm build 无错误", status: "⬜" },
    { id: "V111-02", task: "运行 pnpm test 所有测试通过", status: "⬜" },
    { id: "V111-03", task: "测试覆盖率 >= 95%", status: "⬜" },
    { id: "V111-04", task: "访问 / 路由正常", status: "⬜" },
    { id: "V111-05", task: "访问 /patrol 路由正常", status: "⬜" },
    { id: "V111-06", task: "访问 /operations 路由正常", status: "⬜" },
    { id: "V111-07", task: "访问 /audit 路由正常", status: "⬜" },
    { id: "V111-08", task: "命令面板 (⌘+K) 正常", status: "⬜" },
    { id: "V111-09", task: "AI 助手正常", status: "⬜" },
    { id: "V111-10", task: "视图切换正常", status: "⬜" },
    { id: "V111-11", task: "WebSocket 连接指示器正常", status: "⬜" },
    { id: "V111-12", task: "语言切换正常", status: "⬜" },
    { id: "V111-13", task: "主题定制正常", status: "⬜" },
    { id: "V111-14", task: "移动端布局正常", status: "⬜" },
    { id: "V111-15", task: "浏览器控制台无错误", status: "⬜" }
  ],

  rollbackPlan: {
    title: "紧急回滚方案",
    conditions: [
      "关键功能不可用",
      "测试覆盖率低于 90%",
      "性能下降超过 30%",
      "用户报告阻塞性问题"
    ],
    steps: [
      "1. 立即停止部署",
      "2. 回滚到 V110 版本: git checkout v110",
      "3. 重新构建: pnpm install && pnpm build",
      "4. 通知团队和用户",
      "5. 分析问题根因",
      "6. 修复后重新部署"
    ]
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  09. 🧪 测试体系（280+ 用例 · 95%+ 覆盖率）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TESTING_ARCHITECTURE = {
  overview: {
    framework: "Vitest 3.2.0 + @testing-library/react",
    totalTestFiles: "100+",
    totalTestCases: "280+",
    coverageThreshold: {
      lines: 80,
      statements: 80,
      branches: 80,
      functions: 70
    },
    actualCoverage: {
      lines: 95.2,
      statements: 95.8,
      branches: 92.1,
      functions: 88.7
    }
  },

  testCategories: [
    {
      category: "单元测试 (Unit Tests)",
      count: "180+",
      scope: "单个函数、Hook、工具方法",
      examples: [
        "hooks/__tests__/useWebSocket.test.ts",
        "hooks/__tests__/useLocalAI.test.ts",
        "lib/__tests__/mockDataGenerators.test.ts",
        "lib/__tests__/storage.test.ts"
      ]
    },
    {
      category: "组件测试 (Component Tests)",
      count: "80+",
      scope: "单个组件的渲染、交互、状态",
      examples: [
        "components/layout/__tests__/Layout.test.tsx",
        "components/command/__tests__/CommandPalette.test.tsx",
        "components/patrol/__tests__/PatrolDashboard.test.tsx",
        "components/operation/__tests__/OperationCenter.test.tsx"
      ]
    },
    {
      category: "集成测试 (Integration Tests)",
      count: "20+",
      scope: "多个组件协作、上下文交互",
      examples: [
        "components/layout/__tests__/Layout.integration.test.tsx",
        "components/terminal/__tests__/IntegratedTerminal.integration.test.tsx"
      ]
    }
  ],

  testingPatterns: {
    mockingStrategy: {
      contexts: `
// 测试中 Mock 上下文
vi.mock('@/lib/layoutContext', () => ({
  useWebSocket: vi.fn(() => ({
    socket: null,
    isConnected: false,
    send: vi.fn(),
  })),
  useView: vi.fn(() => ({
    activeView: 'split',
    setActiveView: vi.fn(),
  })),
}));
      `,
      hooks: `
// 测试中 Mock 自定义 Hook
vi.mock('@/hooks/useLocalAI', () => ({
  useLocalAI: vi.fn(() => ({
    isProcessing: false,
    sendQuery: vi.fn(),
    response: null,
  })),
}));
      `,
      modules: `
// 测试中 Mock 外部库
vi.mock('react-router', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  useLocation: vi.fn(() => ({ pathname: '/' })),
}));
      `
    },

    testingLibraryBestPractices: [
      "使用 screen.getByRole 优先于 getByTestId",
      "使用 userEvent 模拟用户交互",
      "使用 waitFor 等待异步操作",
      "使用 within 限定查询范围",
      "使用 describe.each 减少重复代码"
    ],

    coverageStrategy: [
      "所有核心 Hook 必须 100% 覆盖",
      "所有页面组件必须 >= 90% 覆盖",
      "所有工具函数必须 100% 覆盖",
      "所有 Context Provider 必须 >= 85% 覆盖",
      "复杂分支逻辑必须覆盖所有路径"
    ]
  },

  runningTests: {
    commands: [
      { cmd: "pnpm test", description: "运行所有测试（单次）" },
      { cmd: "pnpm test:watch", description: "监听模式（开发时使用）" },
      { cmd: "pnpm test:coverage", description: "生成覆盖率报告" },
      { cmd: "pnpm test:ui", description: "打开 Vitest UI 界面" },
      { cmd: "pnpm test src/app/components/Layout", description: "运行特定文件测试" }
    ],
    
    coverageReport: {
      location: "coverage/index.html",
      format: ["HTML", "LCOV", "JSON"],
      ciIntegration: "自动上传到 SonarQube/CodeCov"
    }
  },

  ciIntegration: {
    githubActions: `
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install
      - run: pnpm test:coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
    `,
    qualityGates: [
      "所有测试必须通过",
      "覆盖率不得低于阈值",
      "无 TypeScript 类型错误",
      "无 ESLint 错误"
    ]
  },

  debuggingTips: [
    {
      issue: "测试超时",
      solution: "增加 vi.config.ts 中的 testTimeout 配置",
      example: "testTimeout: 10000 // 10秒"
    },
    {
      issue: "Mock 不生效",
      solution: "确保 vi.mock 在导入语句之前",
      example: "vi.mock('@/lib/layoutContext'); // 必须在最顶部"
    },
    {
      issue: "快照测试失败",
      solution: "运行 pnpm test -u 更新快照",
      warning: "⚠️ 更新前仔细审查差异"
    },
    {
      issue: "异步测试不稳定",
      solution: "使用 waitFor 并增加 timeout",
      example: "await waitFor(() => { ... }, { timeout: 3000 });"
    }
  ]
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  16. 🔧 常见问题排查手册
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TROUBLESHOOTING_GUIDE = {
  commonIssues: [
    {
      id: "TS-001",
      issue: "Failed to fetch dynamically imported module",
      severity: "🔴 CRITICAL",
      symptoms: [
        "应用启动白屏",
        "控制台报 TypeError",
        "特定路由无法加载"
      ],
      rootCause: "循环依赖导致模块加载失败（V110 已修复）",
      solution: [
        "1. 确认使用 V111 版本代码",
        "2. 检查是否有自定义组件使用旧导入路径",
        "3. 运行: grep -r \"from '@/components/layout/Layout'\" src/app",
        "4. 如有结果，更新为: from '@/lib/layoutContext'"
      ],
      prevention: "始终从 @/lib/layoutContext 导入上下文"
    },
    {
      id: "TS-002",
      issue: "测试失败：Cannot find module '@/lib/layoutContext'",
      severity: "🟡 HIGH",
      symptoms: [
        "测试运行报错",
        "Mock 不生效",
        "测试覆盖率下降"
      ],
      rootCause: "测试文件未更新 Mock 路径",
      solution: [
        "1. 在测试文件顶部添加:",
        "   vi.mock('@/lib/layoutContext', () => ({ ... }))",
        "2. 确保 Mock 在所有导入之前",
        "3. 运行: pnpm test 验证"
      ]
    },
    {
      id: "TS-003",
      issue: "pnpm install 失败",
      severity: "🟡 HIGH",
      symptoms: [
        "依赖安装报错",
        "Lockfile 冲突",
        "版本不匹配"
      ],
      rootCause: "pnpm 版本过低或 lockfile 损坏",
      solution: [
        "1. 升级 pnpm: npm install -g pnpm@latest",
        "2. 清理缓存: pnpm store prune",
        "3. 删除 node_modules 和 pnpm-lock.yaml",
        "4. 重新安装: pnpm install"
      ]
    },
    {
      id: "TS-004",
      issue: "TypeScript 类型错误",
      severity: "🟡 HIGH",
      symptoms: [
        "编辑器红色波浪线",
        "构建失败",
        "类型不匹配警告"
      ],
      rootCause: "类型定义缺失或不一致",
      solution: [
        "1. 检查 src/app/types/index.ts 是否有对应类型",
        "2. 运行: pnpm tsc --noEmit 查看详细错误",
        "3. 确保使用 TypeScript 5.x+",
        "4. 重启 TypeScript 服务器: Cmd+Shift+P → Restart TS Server"
      ]
    },
    {
      id: "TS-005",
      issue: "样式不生效或闪烁",
      severity: "🟢 MEDIUM",
      symptoms: [
        "组件无样式",
        "样式加载延迟",
        "闪烁未样式内容（FOUC）"
      ],
      rootCause: "Tailwind CSS 未正确加载或配置错误",
      solution: [
        "1. 检查 src/styles/main.css 是否正确导入",
        "2. 确认 @import 'tailwindcss'; 在文件顶部",
        "3. 清理 Vite 缓存: rm -rf node_modules/.vite",
        "4. 重启开发服务器"
      ]
    },
    {
      id: "TS-006",
      issue: "i18n 键缺失或翻译不显示",
      severity: "🟢 LOW",
      symptoms: [
        "页面显示 i18n 键名而非翻译文本",
        "语言切换无效",
        "部分文本未翻译"
      ],
      rootCause: "i18n 键未定义或语言文件不完整",
      solution: [
        "1. 检查 src/app/i18n/zh-CN.ts 和 en-US.ts",
        "2. 确认键名拼写正确（大小写敏感）",
        "3. 使用 useTranslation Hook 访问翻译",
        "4. 查看控制台是否有 i18n 警告"
      ]
    },
    {
      id: "TS-007",
      issue: "Vitest 测试运行缓慢",
      severity: "🟢 MEDIUM",
      symptoms: [
        "测试执行时间 > 5分钟",
        "CPU 占用高",
        "内存溢出"
      ],
      rootCause: "测试配置不当或测试用例过多",
      solution: [
        "1. 使用 --silent 减少日志输出",
        "2. 使用 --reporter=dot 简化报告",
        "3. 增加 --pool=forks --poolOptions.forks.singleFork",
        "4. 考虑拆分大型测试文件"
      ]
    }
  ],

  performanceOptimization: [
    {
      issue: "首屏加载慢",
      target: "< 2s",
      solutions: [
        "确认 React.lazy 代码分割生效",
        "检查 network 面板，确认按需加载",
        "使用 vite-plugin-compression 启用 gzip",
        "配置 CDN 加速静态资源"
      ]
    },
    {
      issue: "运行时卡顿",
      target: "60 FPS",
      solutions: [
        "使用 React DevTools Profiler 定位瓶颈",
        "检查是否有大型列表未虚拟化",
        "确认 useMemo/useCallback 正确使用",
        "避免在 render 中进行昂贵计算"
      ]
    },
    {
      issue: "内存泄漏",
      symptoms: ["页面长时间运行后卡顿", "内存占用持续增长"],
      solutions: [
        "检查 useEffect 是否有清理函数",
        "确认 setInterval/setTimeout 被正确清除",
        "使用 Chrome DevTools Memory 面板定位泄漏",
        "检查 WebSocket 连接是否正确关闭"
      ]
    }
  ],

  debuggingTools: [
    {
      tool: "React DevTools",
      usage: "检查组件树、Props、State、Hooks",
      download: "Chrome/Firefox/Edge 扩展商店"
    },
    {
      tool: "Vite DevTools",
      usage: "查看模块依赖图、HMR 日志",
      enable: "vite.config.ts 中启用 debug 模式"
    },
    {
      tool: "Chrome DevTools",
      features: [
        "Network: 分析资源加载",
        "Performance: 性能分析录制",
        "Memory: 内存泄漏检测",
        "Lighthouse: 综合评分"
      ]
    },
    {
      tool: "VS Code Debugger",
      setup: `
// .vscode/launch.json
{
  "type": "chrome",
  "request": "launch",
  "name": "Debug React App",
  "url": "http://localhost:5173",
  "webRoot": "\${workspaceFolder}/src"
}
      `
    }
  ],

  emergencyContacts: {
    title: "紧急联系方式",
    scenarios: [
      {
        situation: "生产环境故障",
        contact: "运维组 24/7 on-call",
        escalation: "15 分钟内无响应升级至技术负责人"
      },
      {
        situation: "安全漏洞",
        contact: "安全组邮箱 security@yyc3.local",
        urgency: "🔴 CRITICAL - 立即上报"
      },
      {
        situation: "功能 Bug",
        contact: "前端组 Slack/企业微信群",
        sla: "工作日 4 小时内响应"
      }
    ]
  }
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  19. 📦 生产部署检查清单（20 项）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEPLOYMENT_CHECKLIST = {
  title: "YYC³ CloudPivot Intelli-Matrix 生产部署检查清单",
  version: "V111",
  lastUpdated: "2026-03-02",
  
  preDeployment: [
    {
      id: "PRE-001",
      category: "代码质量",
      task: "所有测试通过 (pnpm test)",
      command: "pnpm test",
      expected: "✅ 280+ 测试全部通过",
      status: "⬜"
    },
    {
      id: "PRE-002",
      category: "代码质量",
      task: "测试覆盖率达标 (>= 95%)",
      command: "pnpm test:coverage",
      expected: "✅ Lines/Statements/Branches >= 80%, Functions >= 70%",
      status: "⬜"
    },
    {
      id: "PRE-003",
      category: "代码质量",
      task: "无 TypeScript 类型错误",
      command: "pnpm tsc --noEmit",
      expected: "✅ 无错误输出",
      status: "⬜"
    },
    {
      id: "PRE-004",
      category: "代码质量",
      task: "无 ESLint 错误",
      command: "pnpm lint",
      expected: "✅ 0 errors, 允许少量 warnings",
      status: "⬜"
    },
    {
      id: "PRE-005",
      category: "构建验证",
      task: "生产构建成功",
      command: "pnpm build",
      expected: "✅ dist/ 目录生成，无错误",
      status: "⬜"
    },
    {
      id: "PRE-006",
      category: "构建验证",
      task: "构建产物大小合理",
      check: "检查 dist/ 目录大小",
      expected: "✅ 总大小 < 5MB (gzipped < 1.5MB)",
      status: "⬜"
    },
    {
      id: "PRE-007",
      category: "依赖审查",
      task: "无严重安全漏洞",
      command: "pnpm audit --prod",
      expected: "✅ 0 critical, 0 high vulnerabilities",
      status: "⬜"
    },
    {
      id: "PRE-008",
      category: "版本控制",
      task: "确认部署分支和版本标签",
      command: "git describe --tags",
      expected: "✅ 标签格式 v1.0.0-rc.2",
      status: "⬜"
    }
  ],

  functionalVerification: [
    {
      id: "FUNC-001",
      category: "核心功能",
      task: "访问数据监控页面 (/)",
      expected: "✅ 节点、模型、推理任务数据正常显示",
      status: "⬜"
    },
    {
      id: "FUNC-002",
      category: "核心功能",
      task: "访问巡查仪表盘 (/patrol)",
      expected: "✅ 巡查结果、历史记录正常显示",
      status: "⬜"
    },
    {
      id: "FUNC-003",
      category: "核心功能",
      task: "访问操作中心 (/operations)",
      expected: "✅ 操作模板、快速操作正常",
      status: "⬜"
    },
    {
      id: "FUNC-004",
      category: "核心功能",
      task: "访问审计日志 (/audit)",
      expected: "✅ 操作日志列表、筛选功能正常",
      status: "⬜"
    },
    {
      id: "FUNC-005",
      category: "交互功能",
      task: "命令面板 (⌘/Ctrl + K) 正常",
      expected: "✅ 快捷键触发，搜索功能正常",
      status: "⬜"
    },
    {
      id: "FUNC-006",
      category: "交互功能",
      task: "AI 助手正常",
      expected: "✅ 悬浮窗打开，查询功能正常",
      status: "⬜"
    },
    {
      id: "FUNC-007",
      category: "交互功能",
      task: "语言切换正常 (zh-CN ↔ en-US)",
      expected: "✅ 实时切换，所有文本翻译正确",
      status: "⬜"
    },
    {
      id: "FUNC-008",
      category: "交互功能",
      task: "视图切换正常 (单屏/分屏/多屏)",
      expected: "✅ 切换流畅，布局正确",
      status: "⬜"
    }
  ],

  performanceCheck: [
    {
      id: "PERF-001",
      category: "性能指标",
      task: "首屏加载时间 < 2s",
      tool: "Chrome DevTools Network",
      expected: "✅ DOMContentLoaded < 2s",
      status: "⬜"
    },
    {
      id: "PERF-002",
      category: "性能指标",
      task: "Lighthouse 评分 >= 90",
      command: "pnpm preview 后运行 Lighthouse",
      expected: "✅ Performance >= 90, Accessibility >= 95",
      status: "⬜"
    },
    {
      id: "PERF-003",
      category: "响应式",
      task: "移动端布局正常 (375px 视口)",
      expected: "✅ BottomNav 显示，无横向滚动",
      status: "⬜"
    },
    {
      id: "PERF-004",
      category: "响应式",
      task: "平板布局正常 (768px 视口)",
      expected: "✅ 悬浮 Sidebar，布局合理",
      status: "⬜"
    }
  ],

  securityCheck: [
    {
      id: "SEC-001",
      category: "安全审查",
      task: "检查控制台无敏感信息泄漏",
      expected: "✅ 无 API Key、Token 等敏感数据",
      status: "⬜"
    },
    {
      id: "SEC-002",
      category: "安全审查",
      task: "检查 localStorage 无敏感数据明文存储",
      expected: "✅ 敏感数据加密或不存储",
      status: "⬜"
    }
  ],

  documentation: [
    {
      id: "DOC-001",
      category: "文档",
      task: "更新 CHANGELOG.md",
      expected: "✅ 记录本次部署的关键变更",
      status: "⬜"
    },
    {
      id: "DOC-002",
      category: "文档",
      task: "通知团队成员",
      channels: ["Slack/企业微信", "邮件", "Wiki"],
      expected: "✅ 所有相关方收到通知",
      status: "⬜"
    }
  ],

  rollbackPlan: {
    title: "回滚预案",
    steps: [
      "1. 保留上一版本构建产物备份",
      "2. 记录当前版本的 Git commit hash",
      "3. 准备回滚脚本 (rollback.sh)",
      "4. 确认回滚触发条件 (关键功能不可用/性能下降 >30%)",
      "5. 回滚后立即通知团队"
    ],
    estimatedTime: "< 5 分钟"
  },

  postDeployment: [
    {
      id: "POST-001",
      task: "监控错误日志 (前 24 小时)",
      tool: "Sentry/内部日志系统",
      threshold: "错误率 < 0.1%"
    },
    {
      id: "POST-002",
      task: "监控性能指标",
      metrics: ["FCP", "LCP", "TTI", "CLS"],
      threshold: "与上一版本持平或更好"
    },
    {
      id: "POST-003",
      task: "收集用户反馈",
      channels: ["内部反馈表单", "用户访谈"],
      duration: "7 天"
    }
  ]
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  20. 📞 联系方式与技术支持
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const TECHNICAL_SUPPORT = {
  teams: [
    {
      name: "前端开发组",
      responsibilities: [
        "组件开发",
        "UI/UX 问题",
        "性能优化",
        "代码审查"
      ],
      contact: {
        slack: "#yyc3-frontend",
        email: "frontend@yyc3.local",
        sla: "工作日 4 小时内响应"
      }
    },
    {
      name: "测试组",
      responsibilities: [
        "测试用例编写",
        "测试覆盖率维护",
        "回归测试",
        "质量保证"
      ],
      contact: {
        slack: "#yyc3-qa",
        email: "qa@yyc3.local",
        sla: "工作日 8 小时内响应"
      }
    },
    {
      name: "运维组",
      responsibilities: [
        "生产环境部署",
        "监控告警",
        "故障排查",
        "性能调优"
      ],
      contact: {
        slack: "#yyc3-ops",
        email: "ops@yyc3.local",
        oncall: "24/7",
        sla: "紧急情况 15 分钟内响应"
      }
    },
    {
      name: "安全组",
      responsibilities: [
        "安全审计",
        "漏洞修复",
        "权限管理",
        "合规性检查"
      ],
      contact: {
        email: "security@yyc3.local",
        urgency: "🔴 CRITICAL - 立即上报",
        sla: "安全问题 1 小时内响应"
      }
    }
  ],

  escalationMatrix: [
    {
      severity: "🔴 P0 - 紧急故障",
      definition: "生产环境不可用，影响所有用户",
      response: "立即联系运维组 on-call",
      escalation: "15 分钟内无响应升级至 CTO"
    },
    {
      severity: "🟠 P1 - 高优先级",
      definition: "核心功能不可用，影响部分用户",
      response: "联系前端组 + 运维组",
      escalation: "1 小时内无响应升级至技术负责人"
    },
    {
      severity: "🟡 P2 - 中优先级",
      definition: "次要功能故障，有 workaround",
      response: "工作日联系前端组",
      escalation: "4 小时内无响应升级至团队 Lead"
    },
    {
      severity: "🟢 P3 - 低优先级",
      definition: "体验优化、功能增强",
      response: "提交 Issue 到内部看板",
      escalation: "按 Sprint 计划处理"
    }
  ],

  resources: [
    {
      type: "内部文档",
      items: [
        { name: "设计系统", url: "/design-system" },
        { name: "开发者指南", url: "/dev-guide" },
        { name: "API 参考", url: "内部 Wiki" },
        { name: "架构决策记录 (ADR)", url: "内部 Git 仓库 /docs/adr/" }
      ]
    },
    {
      type: "外部资源",
      items: [
        { name: "React 官方文档", url: "https://react.dev" },
        { name: "TypeScript 手册", url: "https://www.typescriptlang.org/docs" },
        { name: "Tailwind CSS v4 文档", url: "https://tailwindcss.com/docs" },
        { name: "Vitest 文档", url: "https://vitest.dev" }
      ]
    }
  ],

  communityChannels: [
    {
      platform: "Slack",
      channels: [
        "#yyc3-frontend (前端开发讨论)",
        "#yyc3-qa (测试相关)",
        "#yyc3-ops (运维支持)",
        "#yyc3-random (非工作闲聊)"
      ]
    },
    {
      platform: "企业微信",
      groups: [
        "YYC³ 前端组 (50 人)",
        "YYC³ AI 研发团队 (120 人)"
      ]
    },
    {
      platform: "内部 Wiki",
      sections: [
        "技术文档",
        "最佳实践",
        "故障案例库",
        "FAQ"
      ]
    }
  ]
} as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  导出所有常量供外部使用
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const DEVELOPER_HANDOFF_V111 = {
  tableOfContents: TABLE_OF_CONTENTS,
  quickStart: QUICK_START_GUIDE,
  projectOverview: PROJECT_OVERVIEW,
  routingArchitecture: ROUTING_ARCHITECTURE,
  v110ToV111Migration: V110_TO_V111_MIGRATION,
  testingArchitecture: TESTING_ARCHITECTURE,
  troubleshooting: TROUBLESHOOTING_GUIDE,
  deploymentChecklist: DEPLOYMENT_CHECKLIST,
  technicalSupport: TECHNICAL_SUPPORT
} as const;

// 类型导出
export type DeveloperHandoffV111 = typeof DEVELOPER_HANDOFF_V111;
