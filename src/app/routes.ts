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

import { createHashRouter } from "react-router-dom";
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
import { AIFamilyDesignDoc } from "./components/AIFamilyDesignDoc";
import { AIFamilyCenterPage } from "./components/AIFamilyCenterPage";
import { FamilyHome } from "./components/ai-family/FamilyHome";
import { ServiceConnectionTest } from "./components/ServiceConnectionTest";
import { OllamaConfigPanel } from "./components/OllamaConfigPanel";
import { VoiceControlPage } from "./components/VoiceControlPage";
import { MusicSpacePage } from "./components/music/MusicSpacePage";
import { NotFound } from "./components/NotFound";

// ────────────────────────────────────────────
//  路由表
// ────────────────────────────────────────────

export const router = createHashRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: DataMonitoring },
      { path: "follow-up", Component: FollowUpPanel },
      { path: "patrol", Component: PatrolDashboard },
      { path: "operations", Component: OperationCenter },
      { path: "files", Component: LocalFileManager },
      { path: "ai", Component: AISuggestionPanel },
      { path: "loop", Component: ServiceLoopPanel },
      { path: "pwa", Component: PWAStatusPanel },
      { path: "design-system", Component: DesignSystemPage },
      { path: "dev-guide", Component: DevGuidePage },
      { path: "model-provider", Component: ModelProviderPanel },
      { path: "theme", Component: ThemeCustomizer },
      { path: "cli", Component: CLITerminal },
      { path: "ide", Component: IDEPanel },
      { path: "audit", Component: OperationAudit },
      { path: "users", Component: UserManagement },
      { path: "settings", Component: SystemSettings },
      { path: "security", Component: SecurityMonitor },
      { path: "alerts", Component: AlertRulesPanel },
      { path: "reports", Component: ReportExporter },
      { path: "ai-diagnostics", Component: AIDiagnostics },
      { path: "host-files", Component: HostFileManager },
      { path: "database", Component: DatabaseManager },
      { path: "refactoring", Component: RefactoringReport },
      { path: "data-editor", Component: DataEditorPanel },
      { path: "performance", Component: PerformanceMonitor },
      { path: "env-config", Component: EnvConfigEditor },
      { path: "db-connection", Component: DatabaseConnectionPanel },
      { path: "architecture", Component: ArchitectureAudit },
      { path: "ai-family", Component: AIFamilyPage },
      { path: "ai-family-home", Component: FamilyHome },
      { path: "ai-family-center", Component: AIFamilyCenterPage },
      { path: "ai-family-design", Component: AIFamilyDesignDoc },
      { path: "service-test", Component: ServiceConnectionTest },
      { path: "ollama-config", Component: OllamaConfigPanel },
      { path: "voice", Component: VoiceControlPage },
      { path: "music", Component: MusicSpacePage },
      { path: "ai-family/*", Component: AIFamilyRouter },
      { path: "*", Component: NotFound },
    ],
  },
]);
