// @vitest-environment jsdom
/**
 * AlertBanner.test.tsx
 * ============
 * AlertBanner 组件 - 告警横幅跳转测试
 *
 * 覆盖范围:
 * - 基础渲染（标题、指标、计数）
 * - 点击导航到 /follow-up
 * - compact 模式
 * - 严重级别色带
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockNavigate = vi.fn() as any;

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

import { AlertBanner } from "../components/AlertBanner";

describe("AlertBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // 基础渲染
  // ----------------------------------------------------------

  describe("基础渲染", () => {
    it("应渲染告警标题", () => {
      render(<AlertBanner />);
      const titleTexts = screen.getAllByText("GPU-A100-03 推理延迟异常");
      expect(titleTexts.length).toBeGreaterThan(0);
    });

    it("应渲染告警指标", () => {
      render(<AlertBanner />);
      const metricTexts = screen.getAllByText("2,450ms > 2,000ms");
      expect(metricTexts.length).toBeGreaterThan(0);
    });

    it("应渲染告警计数信息", () => {
      render(<AlertBanner />);
      const countTexts = screen.getAllByText("5 条告警");
      expect(countTexts.length).toBeGreaterThan(0);
    });

    it("应渲染严重告警数", () => {
      render(<AlertBanner />);
      const severeTexts = screen.getAllByText("1 严重");
      expect(severeTexts.length).toBeGreaterThan(0);
    });

    it("应渲染一键跟进按钮文字", () => {
      render(<AlertBanner />);
      const actionTexts = screen.getAllByText("一键跟进");
      expect(actionTexts.length).toBeGreaterThan(0);
    });

    it("应有 data-testid=alert-banner", () => {
      render(<AlertBanner />);
      expect(screen.getByTestId("alert-banner")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 导航
  // ----------------------------------------------------------

  describe("导航", () => {
    it("点击横幅应导航到 /follow-up", () => {
      render(<AlertBanner />);
      fireEvent.click(screen.getByTestId("alert-banner"));
      expect(mockNavigate).toHaveBeenCalledWith("/follow-up");
    });
  });

  // ----------------------------------------------------------
  // compact 模式
  // ----------------------------------------------------------

  describe("compact 模式", () => {
    it("compact 模式不应渲染告警计数详情", () => {
      render(<AlertBanner compact />);
      expect(screen.queryByText("5 条告警")).not.toBeInTheDocument();
    });

    it("compact 模式仍应渲染标题", () => {
      render(<AlertBanner compact />);
      expect(screen.getByText("GPU-A100-03 推理延迟异常")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 样式
  // ----------------------------------------------------------

  describe("样式", () => {
    it("应有严重告警边框样式（有 critical 告警时）", () => {
      render(<AlertBanner />);
      const banner = screen.getByTestId("alert-banner");
      expect(banner.className).toContain("border-[rgba(255,51,102");
    });

    it("应有 cursor-pointer 样式", () => {
      render(<AlertBanner />);
      const banner = screen.getByTestId("alert-banner");
      expect(banner.className).toContain("cursor-pointer");
    });
  });
});
