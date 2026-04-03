// @vitest-environment jsdom
/**
 * SecurityMonitor.test.tsx
 * =========================
 * 安全与性能监控页面测试
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { SecurityMonitor } from "../components/SecurityMonitor";
import { I18nContext } from "../hooks/useI18n";
import type { I18nContextValue } from "../types";
import { zhCN } from "../i18n";

function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".");
  let result: any = obj;
  for (const k of keys) {
    if (result === null || result === undefined || typeof result !== "object") { return path; }
    result = result[k];
  }
  return typeof result === "string" ? result : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) { return template; }
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== null && vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}

function createI18nValue(): I18nContextValue {
  return {
    locale: "zh-CN",
    setLocale: () => { },
    t: (key: string, vars?: Record<string, string | number>) => {
      const raw = getNestedValue(zhCN as Record<string, any>, key);
      return vars ? interpolate(raw, vars) : raw;
    },
    locales: [
      { code: "zh-CN", label: "简体中文", nativeLabel: "简体中文" },
      { code: "en-US", label: "English", nativeLabel: "English" },
    ],
  };
}

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../hooks/useSecurityMonitor", () => ({
  useSecurityMonitor: () => ({
    state: {
      scanStatus: "idle",
      activeTab: "security",
      overallScore: 0,
      csp: { score: 0, directives: [], recommendations: [] },
      cookie: { score: 0, count: 0, checks: [] },
      sensitive: { score: 0, totalRisks: 0, findings: [] },
      performance: null,
      diagnostics: null,
      dataManagement: null,
    },
    runScan: vi.fn(),
    setActiveTab: vi.fn(),
    cleanupData: vi.fn(),
  }),
}));

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <I18nContext.Provider value={createI18nValue()}>
        {ui}
      </I18nContext.Provider>
    </MemoryRouter>
  );
}

describe("SecurityMonitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the title and subtitle", () => {
    renderWithProviders(<SecurityMonitor />);
    const titles = screen.getAllByText("安全与性能监控");
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.getByText("安全检测 · 性能分析 · 系统诊断 · 数据管理")).toBeInTheDocument();
  });

  it("renders the scan button", () => {
    renderWithProviders(<SecurityMonitor />);
    const scanButtons = screen.getAllByText("开始扫描");
    expect(scanButtons.length).toBeGreaterThan(0);
  });

  it("renders the page structure correctly", () => {
    renderWithProviders(<SecurityMonitor />);
    const titles = screen.getAllByText("安全与性能监控");
    expect(titles.length).toBeGreaterThan(0);
  });

  it("shows scan button is clickable", () => {
    renderWithProviders(<SecurityMonitor />);
    const scanBtn = screen.getAllByText("开始扫描")[0];
    expect(scanBtn).toBeInTheDocument();
    fireEvent.click(scanBtn);
  });

  it("switches to performance tab", () => {
    renderWithProviders(<SecurityMonitor />);
    const perfTab = screen.getAllByText("性能监控")[0];
    expect(perfTab).toBeInTheDocument();
    fireEvent.click(perfTab);
  });

  it("switches to diagnostics tab", () => {
    renderWithProviders(<SecurityMonitor />);
    const diagTab = screen.getAllByText("系统诊断")[0];
    expect(diagTab).toBeInTheDocument();
    fireEvent.click(diagTab);
  });

  it("switches to data management tab", () => {
    renderWithProviders(<SecurityMonitor />);
    const dataTab = screen.getAllByText("数据管理")[0];
    expect(dataTab).toBeInTheDocument();
    fireEvent.click(dataTab);
  });
});
