/**
 * DevGuidePage.test.tsx
 * =======================
 * DevGuidePage 组件 - 开发实施指南测试
 *
 * 覆盖范围:
 * - 页面渲染
 * - 4 个标签 (技术选型 / 开发优先级 / 架构 / 存储)
 * - 标签切换
 * - 数据完整性
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DevGuidePage } from "../components/DevGuidePage";
import { ViewContext } from "../components/Layout";
import { I18nContext } from "../hooks/useI18n";
import zhCN from "../i18n/zh-CN";

// Helper: 嵌套取值
function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".");
  let result: any = obj;
  for (const k of keys) {
    if (result == null) {return path;}
    result = result[k];
  }
  return typeof result === "string" ? result : path;
}

function renderPage() {
  const viewValue = {
    breakpoint: "lg" as const,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1280,
    isTouch: false,
  };

  const i18nValue = {
    locale: "zh-CN" as const,
    setLocale: vi.fn(),
    t: (key: string, vars?: Record<string, string | number>) => {
      let raw = getNestedValue(zhCN as Record<string, any>, key);
      if (vars) {
        raw = raw.replace(/\{(\w+)\}/g, (_: string, k: string) =>
          vars[k] != null ? String(vars[k]) : `{${k}}`
        );
      }
      return raw;
    },
    locales: [],
  };

  return render(
    <ViewContext.Provider value={viewValue}>
      <I18nContext.Provider value={i18nValue}>
        <DevGuidePage />
      </I18nContext.Provider>
    </ViewContext.Provider>
  );
}

describe("DevGuidePage", () => {

afterEach(() => {
  cleanup();
});
  it("应渲染页面标题", () => {
    renderPage();
    expect(screen.getAllByText("开发实施指南")[0]).toBeInTheDocument();
  });

  it("应有主容器", () => {
    renderPage();
    expect(screen.getAllByTestId("dev-guide-page")[0]).toBeInTheDocument();
  });

  it("应有 4 个标签", () => {
    renderPage();
    expect(screen.getAllByTestId("devguide-tab-tech")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("devguide-tab-priority")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("devguide-tab-arch")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("devguide-tab-storage")[0]).toBeInTheDocument();
  });

  it("切换到开发优先级", () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId("devguide-tab-priority")[0]);
    expect(screen.getAllByTestId("devguide-priority")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("phase-1")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("phase-2")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("phase-3")[0]).toBeInTheDocument();
  });

  it("切换到架构概览", () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId("devguide-tab-arch")[0]);
    expect(screen.getAllByTestId("devguide-arch")[0]).toBeInTheDocument();
  });

  it("切换到存储策略", () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId("devguide-tab-storage")[0]);
    expect(screen.getAllByTestId("devguide-storage")[0]).toBeInTheDocument();
  });

  it("技术选型应列出 8 项", () => {
    renderPage();
    expect(screen.getAllByTestId("tech-list")[0]).toBeInTheDocument();
  });

  it("Phase 1 应有 3 个任务项", () => {
    renderPage();
    fireEvent.click(screen.getAllByTestId("devguide-tab-priority")[0]);
    expect(screen.getAllByTestId("priority-item-1")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("priority-item-2")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("priority-item-3")[0]).toBeInTheDocument();
  });
});
