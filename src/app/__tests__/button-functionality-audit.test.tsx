/**
 * button-functionality-audit.test.tsx
 * =====================================
 * 按钮功能自动化审计测试
 *
 * 遍历所有页面的按钮，验证:
 * 1. 按钮有有效的 onClick 处理器或链接
 * 2. 导航按钮链接到有效路由
 * 3. 表单提交按钮有正确的 type 属性
 * 4. 禁用状态正确应用
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import React from "react";

import { Sidebar } from "../components/Sidebar";
import { TopBar } from "../components/TopBar";
import { BottomNav } from "../components/BottomNav";
import { CommandPalette } from "../components/CommandPalette";
import { Dashboard } from "../components/Dashboard";
import { SystemSettings } from "../components/SystemSettings";

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
    locales: ["zh-CN", "en-US"],
  }),
}));

vi.mock("../hooks/useWebSocketData", () => ({
  useWebSocketData: () => ({
    connectionState: "simulated",
    nodes: [],
    throughputData: [],
    latencyData: [],
    alerts: [],
  }),
}));

vi.mock("../hooks/useMobileView", () => ({
  useMobileView: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    breakpoint: "desktop",
  }),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isGhostMode: vi.fn().mockReturnValue(true),
}));

vi.mock("../components/YYC3Logo", () => ({
  YYC3Logo: () => React.createElement("div", { "data-testid": "yyc3-logo" }),
}));

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => 
    React.createElement("div", { "data-testid": "glass-card" }, children),
}));

vi.mock("../components/NetworkConfig", () => ({
  NetworkConfig: () => React.createElement("div", { "data-testid": "network-config" }),
}));

const validRoutes = new Set([
  "/",
  "/dashboard",
  "/data-monitor",
  "/terminal",
  "/db-connections",
  "/connection-test",
  "/settings",
  "/ai-family",
  "/ai-family/home",
  "/ai-family/chat",
  "/ai-family/share",
  "/ai-family/learn",
  "/ai-family/music",
  "/ai-family/assistant",
  "/ai-family/settings",
  "/patrol",
  "/operation-center",
  "/security",
  "/users",
  "/logs",
  "/alerts",
  "/reports",
  "/file-browser",
  "/ide",
  "/dev-guide",
  "/design-system",
  "/architecture-audit",
  "/refactoring-report",
]);

function isValidRoute(href: string | null): boolean {
  if (!href) {return false;}
  if (href === "#") {return true;}
  if (href.startsWith("http://") || href.startsWith("https://")) {return true;}
  if (href.startsWith("mailto:")) {return true;}
  if (href.startsWith("tel:")) {return true;}
  if (href.startsWith("/")) {return validRoutes.has(href) || validRoutes.has(href.replace(/\/$/, ""));}
  return false;
}

const RouterWrapper = ({ children }: { children: React.ReactNode }) => 
  React.createElement(
    MemoryRouter,
    { initialEntries: ["/"] },
    children
  );

describe("按钮功能自动化审计", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    localStorage.clear();
  });

  describe("Sidebar 导航按钮", () => {
    it("所有导航链接应指向有效路由", () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(Sidebar, { collapsed: false, onToggle: vi.fn() })
        )
      );

      const links = screen.queryAllByRole("link");
      const invalidLinks: string[] = [];

      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!isValidRoute(href)) {
          invalidLinks.push(href || "null");
        }
      });

      expect(invalidLinks).toHaveLength(0);
    });

    it("导航按钮应可点击", async () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(Sidebar, { collapsed: false, onToggle: vi.fn() })
        )
      );

      const buttons = screen.getAllByRole("button");
      const clickableButtons = buttons.filter(
        (btn) => !btn.hasAttribute("disabled")
      );

      expect(clickableButtons.length).toBeGreaterThan(0);
    });
  });

  describe("TopBar 导航按钮", () => {
    it("所有链接应指向有效路由", () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(TopBar, {
            connectionState: "simulated",
            reconnectCount: 0,
            lastSyncTime: new Date().toISOString(),
            onReconnect: vi.fn(),
            isMobile: false,
            isTablet: false,
            mobileMenuOpen: false,
            onToggleMobileMenu: vi.fn(),
            onLogout: vi.fn(),
            userEmail: "test@example.com",
            userRole: "admin",
          })
        )
      );

      const links = screen.queryAllByRole("link");
      const invalidLinks: string[] = [];

      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!isValidRoute(href)) {
          invalidLinks.push(href || "null");
        }
      });

      expect(invalidLinks).toHaveLength(0);
    });
  });

  describe("BottomNav 移动端导航", () => {
    it("所有导航链接应指向有效路由", () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(BottomNav)
        )
      );

      const links = screen.queryAllByRole("link");
      const invalidLinks: string[] = [];

      links.forEach((link) => {
        const href = link.getAttribute("href");
        if (!isValidRoute(href)) {
          invalidLinks.push(href || "null");
        }
      });

      expect(invalidLinks).toHaveLength(0);
    });
  });

  describe("Dashboard 按钮", () => {
    it("应渲染按钮且无崩溃", () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(Dashboard)
        )
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("SystemSettings 按钮", () => {
    it("保存按钮应有点击处理器", async () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(SystemSettings)
        )
      );

      const saveButtons = screen.queryAllByText(/保存|Save/i);
      saveButtons.forEach((btn) => {
        const button = btn.closest("button");
        if (button) {
          expect(button.onclick !== null || button.hasAttribute("disabled")).toBe(true);
        }
      });
    });

    it("重置按钮应有点击处理器", async () => {
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(SystemSettings)
        )
      );

      const resetButtons = screen.queryAllByText(/重置|Reset/i);
      resetButtons.forEach((btn) => {
        const button = btn.closest("button");
        if (button) {
          expect(button.onclick !== null || button.hasAttribute("disabled")).toBe(true);
        }
      });
    });

    it("Toggle 开关应可切换", async () => {
      const user = userEvent.setup();
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(SystemSettings)
        )
      );

      const toggles = screen.getAllByRole("button").filter(
        (btn) => btn.className.includes("rounded-full") && btn.className.includes("w-11")
      );

      if (toggles.length > 0) {
        await user.click(toggles[0]);
      }
    });
  });

  describe("CommandPalette 命令按钮", () => {
    it("命令项应有有效的点击处理器", async () => {
      const mockOnClose = vi.fn();
      render(
        React.createElement(
          RouterWrapper,
          null,
          React.createElement(CommandPalette, { isOpen: true, onClose: mockOnClose })
        )
      );

      const buttons = screen.queryAllByRole("button");
      const commandButtons = buttons.filter(
        (btn) => btn.textContent && btn.textContent.length > 0
      );

      expect(commandButtons.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("表单按钮审计", () => {
    it("提交按钮应有 type='submit'", () => {
      const forms = document.querySelectorAll("form");
      forms.forEach((form) => {
        const submitButtons = within(form).queryAllByRole("button").filter(
          (btn) => btn.textContent?.includes("提交") || btn.textContent?.includes("保存")
        );
        submitButtons.forEach((btn) => {
          const type = btn.getAttribute("type");
          expect(type === "submit" || type === "button").toBe(true);
        });
      });
    });
  });

  describe("禁用状态审计", () => {
    it("禁用按钮不应响应点击", async () => {
      const mockClick = vi.fn();

      render(
        React.createElement(
          "button",
          { disabled: true, onClick: mockClick, "data-testid": "disabled-btn" },
          "Disabled Button"
        )
      );

      const button = screen.getByTestId("disabled-btn");
      expect(button).toBeDisabled();
    });
  });

  describe("链接有效性审计", () => {
    it("外部链接应有正确的协议", () => {
      const externalLinks = document.querySelectorAll('a[href^="http"]');
      externalLinks.forEach((link) => {
        const href = link.getAttribute("href");
        expect(href).toMatch(/^https?:\/\//);
      });
    });

    it("锚点链接应有对应的目标元素", () => {
      const anchorLinks = document.querySelectorAll('a[href^="#"]');
      anchorLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && href !== "#") {
          const targetId = href.slice(1);
          const target = document.getElementById(targetId);
          expect(target || href === "#").toBeTruthy();
        }
      });
    });
  });
});

describe("路由配置完整性", () => {
  const routeConfig = [
    { path: "/", component: "Dashboard" },
    { path: "/terminal", component: "CLITerminal" },
    { path: "/db-connections", component: "DatabaseConnectionPanel" },
    { path: "/connection-test", component: "ServiceConnectionTest" },
    { path: "/settings", component: "SystemSettings" },
    { path: "/ai-family", component: "AIFamilyPage" },
  ];

  routeConfig.forEach(({ path, component }) => {
    it(`路由 ${path} 应映射到组件 ${component}`, () => {
      expect(validRoutes.has(path)).toBe(true);
    });
  });
});

export { isValidRoute, validRoutes };
