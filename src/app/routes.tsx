/**
 * routes.ts
 * ==========
 * YYC³ 路由配置
 *
 * 注意: 已从 React.lazy 动态导入改为静态导入。
 * 原因: Figma Make iframe 沙箱环境对动态 import() 有模块数量/并发限制，
 *       25 个 React.lazy 路由会触发 "Failed to fetch dynamically imported module" 错误。
 *       静态导入将所有路由组件打入主 bundle，牺牲代码分割换取可靠启动。
 *
 * 恢复代码分割: 部署到独立 Vite/Node 环境后，可还原为 React.lazy 版本。
 */

import { createHashRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DataMonitoring } from "./components/DataMonitoring";
import { FollowUpPanel } from "./components/FollowUpPanel";
import { PatrolDashboard } from "./components/PatrolDashboard";
import { OperationCenter } from "./components/OperationCenter";
import { LocalFileManager } from "./components/LocalFileManager";
import { AISuggestionPanel } from "./components/AISuggestionPanel";
import { ServiceLoopPanel } from "./components/ServiceLoopPanel";
import { PWAStatusPanel } from "./components/PWAStatusPanel";
import { DesignSystemPage } from "./components/design-system/DesignSystemPage";
import { DevGuidePage } from "./components/DevGuidePage";
import { ModelProviderPanel } from "./components/ModelProviderPanel";
import { ThemeCustomizer } from "./components/ThemeCustomizer";
import { CLITerminal } from "./components/CLITerminal";
import { IDEPanel } from "./components/IDEPanel";
import { OperationAudit } from "./components/OperationAudit";
import { UserManagement } from "./components/UserManagement";
import { SystemSettings } from "./components/SystemSettings";
import { SecurityMonitor } from "./components/SecurityMonitor";
import { AlertRulesPanel } from "./components/AlertRulesPanel";
import { ReportExporter } from "./components/ReportExporter";
import { AIDiagnostics } from "./components/AIDiagnostics";
import { HostFileManager } from "./components/HostFileManager";
import { DatabaseManager } from "./components/DatabaseManager";
import { RefactoringReport } from "./components/RefactoringReport";
import { DataEditorPanel } from "./components/DataEditorPanel";
import { PerformanceMonitor } from "./components/PerformanceMonitor";
import { EnvConfigEditor } from "./components/EnvConfigEditor";
import { DatabaseConnectionPanel } from "./components/DatabaseConnectionPanel";
import { ArchitectureAudit } from "./components/ArchitectureAudit";
import { AIFamilyPage } from "./components/AIFamilyPage";
import { AIFamilyRouter } from "./components/ai-family/AIFamilyRouter";
import { ServiceConnectionTest } from "./components/ServiceConnectionTest";
import { NotFound } from "./components/NotFound";

// ────────────────────────────────────────────
//  路由表
// ────────────────────────────────────────────

export const router = createHashRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <DataMonitoring /> },
      { path: "follow-up", element: <FollowUpPanel /> },
      { path: "patrol", element: <PatrolDashboard /> },
      { path: "operations", element: <OperationCenter /> },
      { path: "files", element: <LocalFileManager /> },
      { path: "ai", element: <AISuggestionPanel /> },
      { path: "loop", element: <ServiceLoopPanel /> },
      { path: "pwa", element: <PWAStatusPanel /> },
      { path: "design-system", element: <DesignSystemPage /> },
      { path: "dev-guide", element: <DevGuidePage /> },
      { path: "models", element: <ModelProviderPanel /> },
      { path: "theme", element: <ThemeCustomizer /> },
      { path: "terminal", element: <CLITerminal /> },
      { path: "ide", element: <IDEPanel /> },
      { path: "audit", element: <OperationAudit /> },
      { path: "users", element: <UserManagement /> },
      { path: "settings", element: <SystemSettings /> },
      { path: "security", element: <SecurityMonitor /> },
      { path: "alerts", element: <AlertRulesPanel /> },
      { path: "reports", element: <ReportExporter /> },
      { path: "ai-diagnosis", element: <AIDiagnostics /> },
      { path: "host-files", element: <HostFileManager /> },
      { path: "database", element: <DatabaseManager /> },
      { path: "refactoring", element: <RefactoringReport /> },
      { path: "data-editor", element: <DataEditorPanel /> },
      { path: "performance", element: <PerformanceMonitor /> },
      { path: "env-config", element: <EnvConfigEditor /> },
      { path: "db-connections", element: <DatabaseConnectionPanel /> },
      { path: "architecture", element: <ArchitectureAudit /> },
      { path: "ai-family", element: <AIFamilyPage /> },
      { path: "ai-family/:subpage", element: <AIFamilyRouter /> },
      { path: "ai-family/chat", element: <AIFamilyRouter /> },
      { path: "ai-family/phone", element: <AIFamilyRouter /> },
      { path: "ai-family/music", element: <AIFamilyRouter /> },
      { path: "ai-family/growth", element: <AIFamilyRouter /> },
      { path: "ai-family/learn", element: <AIFamilyRouter /> },
      { path: "ai-family/share", element: <AIFamilyRouter /> },
      { path: "ai-family/fun", element: <AIFamilyRouter /> },
      { path: "ai-family/activities", element: <AIFamilyRouter /> },
      { path: "ai-family/models", element: <AIFamilyRouter /> },
      { path: "ai-family/voice", element: <AIFamilyRouter /> },
      { path: "ai-family/data", element: <AIFamilyRouter /> },
      { path: "ai-family/comm", element: <AIFamilyRouter /> },
      { path: "ai-family/settings", element: <AIFamilyRouter /> },
      { path: "connection-test", element: <ServiceConnectionTest /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);