/**
 * DatabaseManager.test.tsx
 * ========================
 * 数据库管理器 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DatabaseManager } from "../components/DatabaseManager";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../components/CodeEditor", () => ({
  SQLEditor: () => <div data-testid="sql-editor">SQL Editor</div>,
}));

vi.mock("../components/InlineEditableTable", () => ({
  InlineEditableTable: () => <div data-testid="inline-table">Table</div>,
}));

vi.mock("../hooks/useLocalDatabase", () => ({
  useLocalDatabase: () => ({
    connections: [],
    tables: [],
    queryResults: [],
    queryHistory: [],
    backups: [],
    activeConnection: null,
    activeConnectionId: null,
    setActiveConnectionId: vi.fn(),
    addConnection: vi.fn(),
    removeConnection: vi.fn(),
    updateConnection: vi.fn(),
    connectDB: vi.fn(),
    disconnectDB: vi.fn(),
    testConnection: vi.fn(),
    testing: null,
    detectDatabases: vi.fn(),
    detecting: false,
    selectedTable: null,
    setSelectedTable: vi.fn(),
    tableData: [],
    tableDataLoading: false,
    loadTableData: vi.fn(),
    sqlInput: "",
    setSqlInput: vi.fn(),
    executeQuery: vi.fn(),
    executeTemplate: vi.fn(),
    replayQuery: vi.fn(),
    clearQueryHistory: vi.fn(),
    querying: false,
    createBackup: vi.fn(),
    restoreBackup: vi.fn(),
    deleteBackup: vi.fn(),
    stats: {
      totalConnections: 0,
      connectedCount: 0,
      totalTables: 0,
      totalBackups: 0,
      queryCount: 0,
      totalTableRows: 0,
      totalTableSize: 0,
    },
    sqlTemplates: [],
    DEFAULT_PORTS: {
      postgresql: 5432,
      mysql: 3306,
      redis: 6379,
    },
  }),
}));

vi.mock("../lib/view-context", () => ({
  ViewContext: React.createContext({
    currentView: "database",
    setCurrentView: vi.fn(),
    isMobile: false,
  }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

describe("DatabaseManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("应该正确渲染组件", () => {
      render(<DatabaseManager />);
      const heading = screen.getByText("本地数据库管理");
      expect(heading).toBeInTheDocument();
    });

    it("应该显示标签页", () => {
      render(<DatabaseManager />);
      const backupTabs = screen.getAllByText(/备份/);
      expect(backupTabs.length).toBeGreaterThan(0);
    });
  });

  describe("交互测试", () => {
    it("应该能够点击标签页", () => {
      render(<DatabaseManager />);
      const tabs = screen.getAllByRole("button");
      expect(tabs.length).toBeGreaterThan(1);
    });

    it("应该显示自动检测按钮", () => {
      render(<DatabaseManager />);
      const autoDetectBtns = screen.getAllByText("自动检测");
      expect(autoDetectBtns.length).toBeGreaterThan(0);
    });
  });
});
