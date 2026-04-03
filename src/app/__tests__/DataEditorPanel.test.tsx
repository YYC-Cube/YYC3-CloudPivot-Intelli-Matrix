/**
 * DataEditorPanel.test.tsx
 * ========================
 * 数据编辑面板 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../components/ConfigExportCenter", () => ({
  ConfigExportCenter: () => <div data-testid="config-export-center">Config Export Center</div>,
}));

vi.mock("../hooks/useWebSocketData", () => ({
  useWebSocketData: () => ({
    connectionState: "connected",
    activeNodes: [],
    liveLatency: 50,
  }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

vi.mock("../lib/db-queries", () => ({
  getActiveModels: vi.fn().mockResolvedValue({ data: [], error: null }),
  getNodesStatus: vi.fn().mockResolvedValue({ data: [], error: null }),
  getAllAgents: vi.fn().mockResolvedValue({ data: [], error: null }),
  addDbModel: vi.fn(),
  updateDbModel: vi.fn(),
  deleteDbModel: vi.fn(),
  addDbNode: vi.fn(),
  updateDbNode: vi.fn(),
  deleteDbNode: vi.fn(),
  addDbAgent: vi.fn(),
  updateDbAgent: vi.fn(),
  deleteDbAgent: vi.fn(),
  resetDbModels: vi.fn(),
  resetDbAgents: vi.fn(),
  resetDbNodes: vi.fn(),
}));

describe("DataEditorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("应该正确渲染组件", async () => {
      const { DataEditorPanel } = await import("../components/DataEditorPanel");
      render(<DataEditorPanel />);
      const tabs = screen.getAllByRole("button");
      expect(tabs.length).toBeGreaterThan(0);
    });

    it("应该显示标签页", async () => {
      const { DataEditorPanel } = await import("../components/DataEditorPanel");
      render(<DataEditorPanel />);
      const nodesTabs = screen.getAllByText(/节点/);
      expect(nodesTabs.length).toBeGreaterThan(0);
    });
  });
});
