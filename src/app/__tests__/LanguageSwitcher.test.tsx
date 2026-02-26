/**
 * LanguageSwitcher.test.tsx
 * ==========================
 * LanguageSwitcher 组件 - 语言切换器测试
 *
 * 覆盖范围:
 * - 渲染触发按钮
 * - 点击展开下拉菜单
 * - 显示语言选项
 * - 切换语言回调
 * - 选中状态
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { I18nContext } from "../hooks/useI18n";
import type { Locale } from "../types";

function renderWithI18n(locale: Locale = "zh-CN") {
  const setLocale = vi.fn() as any;
  const t = (key: string) => key;
  const locales = [
    { code: "zh-CN" as const, label: "简体中文", nativeLabel: "简体中文" },
    { code: "en-US" as const, label: "English",  nativeLabel: "English" },
  ];

  const utils = render(
    <I18nContext.Provider value={{ locale, setLocale, t, locales }}>
      <LanguageSwitcher />
    </I18nContext.Provider>
  );

  return { ...utils, setLocale };
}

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("基础渲染", () => {
    it("应渲染触发按钮", () => {
      renderWithI18n();
      expect(screen.getByTestId("lang-trigger")).toBeInTheDocument();
    });

    it("应显示当前语言", () => {
      renderWithI18n("zh-CN");
      const elements = screen.getAllByText("简体中文");
      expect(elements[0]).toBeInTheDocument();
    });

    it("应有 data-testid", () => {
      renderWithI18n();
      const elements = screen.getAllByTestId("language-switcher");
      expect(elements[0]).toBeInTheDocument();
    });
  });

  describe("下拉菜单", () => {
    it("初始不应显示下拉菜单", () => {
      renderWithI18n();
      expect(screen.queryByTestId("lang-dropdown")).not.toBeInTheDocument();
    });

    it("点击触发按钮应展开下拉", () => {
      renderWithI18n();
      const triggers = screen.getAllByTestId("lang-trigger");
      fireEvent.click(triggers[0]);
      expect(screen.getByTestId("lang-dropdown")).toBeInTheDocument();
    });

    it("应显示 2 个语言选项", () => {
      renderWithI18n();
      const triggers = screen.getAllByTestId("lang-trigger");
      fireEvent.click(triggers[0]);
      expect(screen.getByTestId("lang-zh-CN")).toBeInTheDocument();
      expect(screen.getByTestId("lang-en-US")).toBeInTheDocument();
    });

    it("当前语言应有 ✓ 标记", () => {
      renderWithI18n("zh-CN");
      const triggers = screen.getAllByTestId("lang-trigger");
      fireEvent.click(triggers[0]);
      const zhBtn = screen.getByTestId("lang-zh-CN");
      expect(zhBtn.textContent).toContain("✓");
    });
  });

  describe("语言切换", () => {
    it("点击 en-US 应调用 setLocale", () => {
      const { setLocale } = renderWithI18n("zh-CN");
      const triggers = screen.getAllByTestId("lang-trigger");
      fireEvent.click(triggers[0]);
      fireEvent.click(screen.getByTestId("lang-en-US"));
      expect(setLocale).toHaveBeenCalledWith("en-US");
    });

    it("切换后下拉应关闭", () => {
      renderWithI18n("zh-CN");
      const triggers = screen.getAllByTestId("lang-trigger");
      fireEvent.click(triggers[0]);
      fireEvent.click(screen.getByTestId("lang-en-US"));
      expect(screen.queryByTestId("lang-dropdown")).not.toBeInTheDocument();
    });
  });
});
