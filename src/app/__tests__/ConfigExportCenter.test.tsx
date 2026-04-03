/**
 * ConfigExportCenter.test.tsx
 * ============================
 * 配置导出中心 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../hooks/useModelProvider", () => ({
  useModelProvider: () => ({
    providers: [
      { id: "provider-1", name: "OpenAI", enabled: true },
      { id: "provider-2", name: "Anthropic", enabled: true },
    ],
    addProvider: vi.fn(),
    updateProvider: vi.fn(),
    removeProvider: vi.fn(),
  }),
}));

vi.mock("../hooks/useSettingsStore", () => ({
  useSettingsStore: () => ({
    settings: {
      theme: "dark",
      language: "zh-CN",
      notifications: true,
    },
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
  }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

describe("ConfigExportCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("应该正确渲染组件", async () => {
      const { ConfigExportCenter } = await import("../components/ConfigExportCenter");
      render(<ConfigExportCenter />);
      expect(screen.getByText(/配置中心/i)).toBeInTheDocument();
    });

    it("应该显示模块列表", async () => {
      const { ConfigExportCenter } = await import("../components/ConfigExportCenter");
      render(<ConfigExportCenter />);
      const modules = screen.getAllByText(/服务商/);
      expect(modules.length).toBeGreaterThan(0);
    });
  });

  describe("交互测试", () => {
    it("应该能够导出配置", async () => {
      const { ConfigExportCenter } = await import("../components/ConfigExportCenter");
      render(<ConfigExportCenter />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("应该能够导入配置", async () => {
      const { ConfigExportCenter } = await import("../components/ConfigExportCenter");
      render(<ConfigExportCenter />);
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(1);
    });
  });
});
