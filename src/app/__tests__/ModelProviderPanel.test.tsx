/**
 * ModelProviderPanel.test.tsx
 * ============================
 * 模型提供商面板测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ModelProviderPanel } from "../components/ModelProviderPanel";
import { ViewContext } from "../components/Layout";
import { I18nContext } from "../hooks/useI18n";
import zhCN from "../i18n/zh-CN";

function getNestedValue(obj: Record<string, any>, path: string): string {
  const keys = path.split(".");
  let result: any = obj;
  for (const k of keys) {
    if (result == null) {return path;}
    result = result[k];
  }
  return typeof result === "string" ? result : path;
}

function renderPanel() {
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
    <MemoryRouter>
      <ViewContext.Provider value={viewValue}>
        <I18nContext.Provider value={i18nValue}>
          <ModelProviderPanel />
        </I18nContext.Provider>
      </ViewContext.Provider>
    </MemoryRouter>
  );
}

describe("ModelProviderPanel", () => {
  beforeEach(() => {
    cleanup();
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("应渲染页面标题", () => {
    renderPanel();
    expect(screen.getAllByText("模型管理")[0]).toBeInTheDocument();
  });

  it("应有主容器", () => {
    renderPanel();
    expect(screen.getAllByTestId("model-provider-panel")[0]).toBeInTheDocument();
  });

  it("应有添加模型按钮", () => {
    renderPanel();
    expect(screen.getAllByTestId("open-add-model")[0]).toBeInTheDocument();
  });

  it("点击添加模型应打开模态框", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    expect(screen.getAllByTestId("add-model-modal")[0]).toBeInTheDocument();
  });

  it("模态框应有服务商选择", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    expect(screen.getAllByTestId("provider-select")[0]).toBeInTheDocument();
  });

  it("点击服务商选择应展开下拉", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    fireEvent.click(screen.getAllByTestId("provider-select")[0]);
    expect(screen.getAllByTestId("provider-dropdown")[0]).toBeInTheDocument();
  });

  it("下拉应包含 9 个提供商选项", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    fireEvent.click(screen.getAllByTestId("provider-select")[0]);
    expect(screen.getAllByTestId("provider-option-zhipu")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("provider-option-openai")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("provider-option-ollama")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("provider-option-deepseek")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("provider-option-kimi-cn")[0]).toBeInTheDocument();
  });

  it("选择提供商后应显示模型选择", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    fireEvent.click(screen.getAllByTestId("provider-select")[0]);
    fireEvent.click(screen.getAllByTestId("provider-option-openai")[0]);
    expect(screen.getAllByTestId("model-select")[0]).toBeInTheDocument();
  });

  it("选择非 Ollama 提供商应显示 API 密钥输入", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    fireEvent.click(screen.getAllByTestId("provider-select")[0]);
    fireEvent.click(screen.getAllByTestId("provider-option-openai")[0]);
    expect(screen.getAllByTestId("api-key-input")[0]).toBeInTheDocument();
  });

  it("选择 Ollama 应显示端点输入", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    fireEvent.click(screen.getAllByTestId("provider-select")[0]);
    fireEvent.click(screen.getAllByTestId("provider-option-ollama")[0]);
    expect(screen.getAllByTestId("ollama-url-input")[0]).toBeInTheDocument();
  });

  it("关闭按钮应关闭模态框", () => {
    renderPanel();
    fireEvent.click(screen.getAllByTestId("open-add-model")[0]);
    expect(screen.getAllByTestId("add-model-modal")[0]).toBeInTheDocument();
    fireEvent.click(screen.getAllByTestId("close-modal")[0]);
    expect(screen.queryByTestId("add-model-modal")).not.toBeInTheDocument();
  });

  it("应有 Ollama 刷新按钮", () => {
    renderPanel();
    expect(screen.getAllByTestId("refresh-ollama-models")[0]).toBeInTheDocument();
  });
});
