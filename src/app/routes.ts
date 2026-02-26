import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { DataMonitoring } from "./components/DataMonitoring";
import { OperationAudit } from "./components/OperationAudit";
import { UserManagement } from "./components/UserManagement";
import { SystemSettings } from "./components/SystemSettings";
import { FollowUpPanel } from "./components/FollowUpPanel";
import { PatrolDashboard } from "./components/PatrolDashboard";
import { OperationCenter } from "./components/OperationCenter";
import { CLITerminal } from "./components/CLITerminal";
import { IDEPanel } from "./components/IDEPanel";
import { LocalFileManager } from "./components/LocalFileManager";
import { AISuggestionPanel } from "./components/AISuggestionPanel";
import { PWAStatusPanel } from "./components/PWAStatusPanel";
import { ServiceLoopPanel } from "./components/ServiceLoopPanel";
import { DesignSystemPage } from "./components/design-system/DesignSystemPage";
import { DevGuidePage } from "./components/DevGuidePage";
import { ModelProviderPanel } from "./components/ModelProviderPanel";
import { ThemeCustomizer } from "./components/ThemeCustomizer";

export const router = createBrowserRouter([
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
      { path: "models", Component: ModelProviderPanel },
      { path: "theme", Component: ThemeCustomizer },
      { path: "terminal", Component: CLITerminal },
      { path: "ide", Component: IDEPanel },
      { path: "audit", Component: OperationAudit },
      { path: "users", Component: UserManagement },
      { path: "settings", Component: SystemSettings },
    ],
  },
]);
