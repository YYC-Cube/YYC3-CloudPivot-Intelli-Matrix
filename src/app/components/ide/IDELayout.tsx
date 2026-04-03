/**
 * IDELayout.tsx
 * ==============
 * IDE 主布局 — 多联式可调面板系统
 *
 * 三栏布局 + 底部终端 (智能终端切换):
 *   左栏 (25%): AI 对话面板
 *   中栏 (45%): 文件资源管理器
 *   右栏 (30%): 代码编辑器
 *   底部: 集成终端 (根据布局模式智能切换位置)
 *
 * 布局模式:
 *   编辑模式 (edit):   使用 PanelManager 自定义面板系统
 *   预览模式 (preview): 使用 PanelManager 自定义面板系统
 *   自由模式 (free):   自由拖拽布局 (Workspace)
 *
 * 使用自定义 PanelManager (from Knowledge/ide) 替代 react-resizable-panels
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useI18n } from "../../hooks/useI18n";
import { AIChatPanel } from "./AIChatPanel";
import { CodePreviewPanel } from "./CodePreviewPanel";
import { FileExplorer } from "./FileExplorer";
import { IDEStatusBar } from "./IDEStatusBar";
import { IDETerminal } from "./IDETerminal";
import { IDETopBar } from "./IDETopBar";
import { IDEViewSwitcher } from "./IDEViewSwitcher";
import { AI_MODELS, MOCK_FILE_CONTENTS } from "./ide-mock-data";
import type { IDELayoutMode, IDEViewMode, OpenTab } from "./ide-types";
import { LayoutProvider } from "./LayoutContext";
import { Workspace } from "./Workspace";
import {
  PanelManagerProvider,
  PanelLayoutArea,
  type PanelId,
  LAYOUT_PRESETS,
} from "./panel-manager/PanelManager";

const LAYOUT_MODE_STORAGE_KEY = "yyc3-ide-layout-mode";

export function IDELayout() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<IDEViewMode>("default");
  const [layoutMode, setLayoutMode] = useState<IDELayoutMode>(() => {
    try {
      const stored = localStorage.getItem(LAYOUT_MODE_STORAGE_KEY);
      if (stored === "edit" || stored === "preview" || stored === "free") {
        return stored;
      }
    } catch {
      // Ignore storage errors
    }
    return "preview";
  });
  const [selectedModel, setSelectedModel] = useState(AI_MODELS[0].id);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Persist layoutMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, layoutMode);
    } catch {
      // Ignore storage errors
    }
  }, [layoutMode]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  const handleFileSelect = useCallback((fileId: string, filename: string) => {
    const existing = openTabs.find((tab) => tab.id === fileId);
    if (existing) {
      setActiveTabId(fileId);
      return;
    }

    const content = MOCK_FILE_CONTENTS[fileId] || `// ${filename}\n// File content placeholder\n`;
    const newTab: OpenTab = {
      id: fileId,
      filename,
      filepath: `src/${filename}`,
      content,
      isModified: false,
    };
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabId(fileId);
  }, [openTabs]);

  const handleTabSelect = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  const handleTabClose = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((tab) => tab.id !== tabId);
      if (activeTabId === tabId && next.length > 0) {
        setActiveTabId(next[next.length - 1].id);
      } else if (next.length === 0) {
        setActiveTabId("");
      }
      return next;
    });
  }, [activeTabId]);

  const handleContentChange = useCallback((tabId: string, content: string) => {
    setOpenTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, content, isModified: true } : tab))
    );
  }, []);

  // TopBar action callbacks
  const handleToggleExplorer = useCallback(() => {
    // Toggle between current layout and files-focused layout
    setLayoutMode((m) => m === "edit" ? "preview" : "edit");
  }, []);
  const handleToggleNotifications = useCallback(() => {
    // Placeholder: show browser notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(t("ide.title"), { body: t("ide.noNewNotifications") });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        if (p === "granted") {
          new Notification(t("ide.title"), { body: t("ide.noNewNotifications") });
        }
      });
    }
  }, [t]);
  const handleOpenSettings = useCallback(() => {
    navigate("/settings");
  }, [navigate]);
  const handleOpenRepo = useCallback(() => {
    window.open("https://github.com", "_blank", "noopener,noreferrer");
  }, []);
  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
  }, []);
  const handleDeploy = useCallback(() => {
    // Placeholder: could integrate with CI/CD
  }, []);

  // Status bar action callback
  const handleFormat = useCallback(() => {
    // TODO: format active file via Prettier
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "1") {
        e.preventDefault();
        setViewMode((m) => (m === "preview" ? "default" : "preview"));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "2") {
        e.preventDefault();
        setViewMode((m) => (m === "code" ? "default" : "code"));
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        setShowSearch((s) => !s);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        setTerminalCollapsed((c) => !c);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "3") {
        e.preventDefault();
        setLayoutMode((m) => {
          if (m === "edit") {return "preview";}
          if (m === "preview") {return "free";}
          return "edit";
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Panel render function for PanelManager
  const renderPanel = useCallback(
    (panelId: PanelId, _nodeId: string) => {
      switch (panelId) {
        case "ai":
          return <AIChatPanel />;
        case "files":
          return (
            <FileExplorer
              onFileSelect={handleFileSelect}
              activeFileId={activeTabId}
            />
          );
        case "code":
          return (
            <CodePreviewPanel
              openTabs={openTabs}
              activeTabId={activeTabId}
              onTabSelect={handleTabSelect}
              onTabClose={handleTabClose}
              onContentChange={handleContentChange}
            />
          );
        case "terminal":
          return (
            <IDETerminal
              isCollapsed={terminalCollapsed}
              onToggleCollapse={() => setTerminalCollapsed((c) => !c)}
            />
          );
        default:
          return (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              {t("ide.pm.panelPlaceholder")}: {panelId}
            </div>
          );
      }
    },
    [
      t,
      handleFileSelect,
      activeTabId,
      openTabs,
      handleTabSelect,
      handleTabClose,
      handleContentChange,
      terminalCollapsed,
    ],
  );

  // Layout selection based on layoutMode AND viewMode
  const editModeLayout = LAYOUT_PRESETS.designer;
  const previewModeLayout = LAYOUT_PRESETS["ai-workspace"] || LAYOUT_PRESETS.default;

  return (
    <div
      className="flex flex-col w-full h-full"
      style={{
        background: "linear-gradient(180deg, rgba(4,10,22,0.98) 0%, rgba(6,14,31,0.95) 100%)",
        minHeight: 0,
      }}
    >
      {/* Top Bar */}
      <IDETopBar
        projectName={t("ide.title")}
        onBack={handleBack}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onToggleExplorer={handleToggleExplorer}
        onToggleNotifications={handleToggleNotifications}
        onOpenSettings={handleOpenSettings}
        onOpenRepo={handleOpenRepo}
        onShare={handleShare}
        onDeploy={handleDeploy}
      />

      {/* View Switcher with layout mode */}
      <IDEViewSwitcher
        viewMode={viewMode}
        onViewChange={setViewMode}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        onSearch={() => setShowSearch((s) => !s)}
        onFullscreen={handleFullscreen}
      />

      {/* Search overlay */}
      {showSearch && (
        <div
          className="flex items-center px-3 py-1.5 shrink-0"
          style={{ background: "rgba(6,14,31,0.9)", borderBottom: "1px solid rgba(0,180,255,0.1)" }}
        >
          <input
            type="text"
            placeholder={`${t("ide.search")}... (Esc)`}
            className="flex-1 bg-[rgba(0,40,80,0.3)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.25)] px-3 py-1.5 rounded-md border border-[rgba(0,180,255,0.15)] outline-none focus:border-[#00d4ff] transition-all"
            style={{ fontSize: "0.72rem" }}
            autoFocus
            onKeyDown={(e) => e.key === "Escape" && setShowSearch(false)}
          />
        </div>
      )}

      {/* Layout mode indicator */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          height: "18px",
          background: layoutMode === "edit"
            ? "linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.05) 50%, transparent 100%)"
            : layoutMode === "preview"
            ? "linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.05) 50%, transparent 100%)"
            : "linear-gradient(90deg, transparent 0%, rgba(255,136,0,0.05) 50%, transparent 100%)",
          borderBottom: "1px solid rgba(0,180,255,0.05)",
        }}
      >
        <span
          className="text-[rgba(0,212,255,0.3)]"
          style={{ fontSize: "0.5rem", letterSpacing: "1px" }}
        >
          {layoutMode === "edit" ? t("ide.editModeDesc") : layoutMode === "preview" ? t("ide.previewModeDesc") : t("ide.freeModeDesc")}
        </span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0">
          {layoutMode === "free" ? (
            <LayoutProvider>
              <Workspace />
            </LayoutProvider>
          ) : (
            <DndProvider backend={HTML5Backend}>
              <PanelManagerProvider
                renderPanel={renderPanel}
                initialLayout={layoutMode === "edit" ? editModeLayout : previewModeLayout}
                key={`${layoutMode}-${viewMode}`}
              >
                <PanelLayoutArea />
              </PanelManagerProvider>
            </DndProvider>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <IDEStatusBar
        activeTab={openTabs.find((tab) => tab.id === activeTabId)}
        totalErrors={0}
        totalWarnings={1}
        isOnline={true}
        onFormat={handleFormat}
      />
    </div>
  );
}
