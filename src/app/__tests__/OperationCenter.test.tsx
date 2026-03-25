// @vitest-environment jsdom
/**
 * OperationCenter.test.tsx
 * =====================
 * OperationCenter 组件测试
 *
 * 覆盖范围:
 * - 组件基本渲染
 * - 子组件渲染
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { OperationCenter } from "../components/OperationCenter";

vi.mock("lucide-react", () => ({
  Settings: () => React.createElement("span", { "data-testid": "icon-settings" }),
  Zap: () => React.createElement("span", { "data-testid": "icon-zap" }),
}));

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("../components/OperationCategory", () => ({
  __esModule: true,
  OperationCategory: () => React.createElement("div", { "data-testid": "operation-category" }, "Operation Category Mock"),
  default: () => React.createElement("div", { "data-testid": "operation-category" }, "Operation Category Mock"),
}));

vi.mock("../components/QuickActionGrid", () => ({
  __esModule: true,
  QuickActionGrid: () => React.createElement("div", { "data-testid": "quick-action-grid" }, "Quick Action Grid Mock"),
  default: () => React.createElement("div", { "data-testid": "quick-action-grid" }, "Quick Action Grid Mock"),
}));

vi.mock("../components/OperationTemplate", () => ({
  __esModule: true,
  OperationTemplate: () => React.createElement("div", { "data-testid": "operation-template" }, "Operation Template Mock"),
  default: () => React.createElement("div", { "data-testid": "operation-template" }, "Operation Template Mock"),
}));

vi.mock("../components/OperationLogStream", () => ({
  __esModule: true,
  OperationLogStream: () => React.createElement("div", { "data-testid": "operation-log-stream" }, "Operation Log Stream Mock"),
  default: () => React.createElement("div", { "data-testid": "operation-log-stream" }, "Operation Log Stream Mock"),
}));

vi.mock("../hooks/useOperationCenter", () => ({
  useOperationCenter: () => ({
    categories: [],
    activeCategory: null,
    setActiveCategory: vi.fn(),
    actions: [],
    isExecuting: false,
    executeAction: vi.fn(),
    templates: [],
    runTemplate: vi.fn(),
    addTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    logs: [],
    logFilter: "all",
    setLogFilter: vi.fn(),
    searchQuery: "",
    setSearchQuery: vi.fn(),
  }),
}));

vi.mock("@/lib/layoutContext", () => ({
  ViewContext: React.createContext({ isMobile: false, theme: "dark" as const }),
}));

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "operations.title": "操作中心",
        "operations.subtitle": "快速执行和管理系统操作",
        "operations.quickActions": "快速操作",
      };
      return translations[key] || key;
    },
  }),
}));

describe("OperationCenter", () => {
  afterEach(() => {
    cleanup();
  });

  describe("组件渲染", () => {
    it("应该渲染标题和副标题", () => {
      render(React.createElement(OperationCenter));
      expect(screen.getByText("操作中心")).toBeInTheDocument();
      expect(screen.getByText("快速执行和管理系统操作")).toBeInTheDocument();
    });

    it("应该渲染快速操作标题", () => {
      render(React.createElement(OperationCenter));
      expect(screen.getByText("快速操作")).toBeInTheDocument();
    });

    it("应该渲染所有子组件", () => {
      render(React.createElement(OperationCenter));
      expect(screen.getByTestId("operation-category")).toBeInTheDocument();
      expect(screen.getByTestId("quick-action-grid")).toBeInTheDocument();
      expect(screen.getByTestId("operation-template")).toBeInTheDocument();
      expect(screen.getByTestId("operation-log-stream")).toBeInTheDocument();
    });
  });
});
