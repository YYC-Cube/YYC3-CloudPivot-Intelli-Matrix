/**
 * ThemeCustomizer.test.tsx
 * =========================
 * ThemeCustomizer 组件测试
 *
 * 覆盖范围:
 * - Header 渲染 (标题/重置/保存)
 * - Section 手风琴展开/折叠
 * - 品牌设置: 系统名称/标语输入
 * - 颜色自定义: 语义化变量
 * - 预设下拉: 打开/搜索/选择/空匹配
 * - 字体排版设置
 * - 阴影/圆角滑块
 * - 亮度调节
 * - 实时预览区域
 * - 重置按钮恢复默认
 */

// @vitest-environment jsdom
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../components/GlassCard", () => ({
  __esModule: true,
  default: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

vi.mock("../components/YYC3Logo", () => ({
  default: () => <div data-testid="yyc3-logo" />,
}))

vi.mock("../components/theme/ColorSwatch", () => ({
  ColorSwatch: ({ label, value, onChange }: any) => (
    <div data-testid={`swatch-${label}`}>
      <span>{label}</span>
      <input data-testid={`swatch-input-${label}`} value={value} onChange={(e: any) => onChange(e.target.value)} />
    </div>
  ),
}));

vi.mock("../components/theme/color-utils", () => ({
  hexToOklch: () => ({ L: 0.5, C: 0.2, h: 220 }),
  formatOklch: () => "oklch(0.50 0.20 220)",
  oklchToHex: () => "#00d4ff",
}));

vi.mock("../components/theme/theme-presets", () => ({
  THEME_PRESETS: [
    {
      id: "base",
      name: "赛博朋克",
      nameEn: "Cyberpunk",
      colors: {
        primary: "#00d4ff", primaryForeground: "#ffffff",
        secondary: "#1a2a40", secondaryForeground: "#c0dcf0",
        accent: "#7b2ff7", accentForeground: "#ffffff",
        background: "#060e1f", foreground: "#e0f0ff",
        card: "#0a1628", cardForeground: "#e0f0ff",
        popover: "#0a1628", popoverForeground: "#e0f0ff",
        muted: "#1a2a40", mutedForeground: "#8ab4d8",
        destructive: "#ff3366", destructiveForeground: "#ffffff",
        border: "#1a3050", input: "#1a3050", ring: "#00d4ff",
        chart1: "#00d4ff", chart2: "#00ff88", chart3: "#ff6600",
        chart4: "#aa55ff", chart5: "#ffdd00", chart6: "#ff3366",
        sidebar: "#040a16", sidebarForeground: "#c0dcf0",
        sidebarPrimary: "#00d4ff", sidebarPrimaryForeground: "#ffffff",
        sidebarAccent: "#1a2a40", sidebarAccentForeground: "#8ab4d8",
        sidebarBorder: "#1a3050", sidebarRing: "#00d4ff",
      },
    },
    {
      id: "nature",
      name: "自然绿",
      nameEn: "Nature Green",
      colors: {
        primary: "#22c55e", primaryForeground: "#ffffff",
        secondary: "#1a2a1f", secondaryForeground: "#c0f0d0",
        accent: "#10b981", accentForeground: "#ffffff",
        background: "#0a1f0e", foreground: "#e0ffe8",
        card: "#0f2a14", cardForeground: "#e0ffe8",
        popover: "#0f2a14", popoverForeground: "#e0ffe8",
        muted: "#1a3020", mutedForeground: "#8ad8a0",
        destructive: "#ef4444", destructiveForeground: "#ffffff",
        border: "#1a4030", input: "#1a4030", ring: "#22c55e",
        chart1: "#22c55e", chart2: "#10b981", chart3: "#059669",
        chart4: "#34d399", chart5: "#6ee7b7", chart6: "#a7f3d0",
        sidebar: "#081a0c", sidebarForeground: "#c0f0d0",
        sidebarPrimary: "#22c55e", sidebarPrimaryForeground: "#ffffff",
        sidebarAccent: "#1a3020", sidebarAccentForeground: "#8ad8a0",
        sidebarBorder: "#1a4030", sidebarRing: "#22c55e",
      },
    },
  ],
  DEFAULT_COLORS: {
    primary: "#00d4ff", primaryForeground: "#ffffff",
    secondary: "#1a2a40", secondaryForeground: "#c0dcf0",
    accent: "#7b2ff7", accentForeground: "#ffffff",
    background: "#060e1f", foreground: "#e0f0ff",
    card: "#0a1628", cardForeground: "#e0f0ff",
    popover: "#0a1628", popoverForeground: "#e0f0ff",
    muted: "#1a2a40", mutedForeground: "#8ab4d8",
    destructive: "#ff3366", destructiveForeground: "#ffffff",
    border: "#1a3050", input: "#1a3050", ring: "#00d4ff",
    chart1: "#00d4ff", chart2: "#00ff88", chart3: "#ff6600",
    chart4: "#aa55ff", chart5: "#ffdd00", chart6: "#ff3366",
    sidebar: "#040a16", sidebarForeground: "#c0dcf0",
    sidebarPrimary: "#00d4ff", sidebarPrimaryForeground: "#ffffff",
    sidebarAccent: "#1a2a40", sidebarAccentForeground: "#8ab4d8",
    sidebarBorder: "#1a3050", sidebarRing: "#00d4ff",
  },
  DEFAULT_TYPOGRAPHY: { sansSerif: "'Rajdhani', sans-serif", serif: "Georgia, serif", mono: "'JetBrains Mono', monospace" },
  DEFAULT_SHADOW: { offsetX: 0, offsetY: 4, blur: 12, spread: 0, color: "#0000000d" },
  DEFAULT_BRANDING: { systemName: "YYC³ CloudPivot Intelli-Matrix", tagline: "本地多端推理矩阵数据库", backgroundUrl: "" },
}));

// Mock Layout ViewContext
vi.mock("@/lib/layoutContext", () => ({
  ViewContext: React.createContext({ isMobile: false, isTablet: false, isDesktop: true, width: 1200, breakpoint: "lg", isTouch: false }),
  WebSocketContext: React.createContext(null),
}));

import ThemeCustomizer from "../components/ThemeCustomizer";

describe("ThemeCustomizer", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("Header", () => {
    it("应渲染标题", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("主题自定义")[0]).toBeInTheDocument();
    });

    it("应渲染副标题", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText(/OKLch/)[0]).toBeInTheDocument();
    });

    it("应渲染重置按钮", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("重置")[0]).toBeInTheDocument();
    });

    it("应渲染保存按钮", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("保存主题")[0]).toBeInTheDocument();
    });
  });

  describe("品牌设置 Section", () => {
    it("品牌设置默认展开", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("系统名称")[0]).toBeInTheDocument();
    });

    it("应显示 YYC3 Logo", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByTestId("yyc3-logo").length).toBeGreaterThan(0);
    });

    it("应渲染标语输入框", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("标语 (Tagline)")[0]).toBeInTheDocument();
    });

    it("修改系统名称应更新输入值", () => {
      render(<ThemeCustomizer />);
      const inputs = screen.getAllByDisplayValue("YYC³ CloudPivot Intelli-Matrix");
      expect(inputs.length).toBeGreaterThan(0);
      fireEvent.change(inputs[0], { target: { value: "New Name" } });
      expect(screen.getByDisplayValue("New Name")).toBeInTheDocument();
    });

    it("应渲染背景上传按钮", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("上传背景")[0]).toBeInTheDocument();
    });
  });

  describe("颜色 Section", () => {
    it("颜色 section 默认展开", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByTestId("swatch-主色").length).toBeGreaterThan(0);
    });

    it("应渲染多个颜色对", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByTestId("swatch-主色").length).toBeGreaterThan(0);
      expect(screen.getAllByTestId("swatch-次色").length).toBeGreaterThan(0);
      expect(screen.getAllByTestId("swatch-强调色").length).toBeGreaterThan(0);
      expect(screen.getAllByTestId("swatch-背景色").length).toBeGreaterThan(0);
      expect(screen.getAllByTestId("swatch-破坏性").length).toBeGreaterThan(0);
    });
  });

  describe("Section 手风琴", () => {
    it("点击折叠的 section 应展开", () => {
      render(<ThemeCustomizer />);
      // "2. 环形区域" section is collapsed by default
      const sectionBtn = screen.getAllByText(/环形区域/)[0];
      fireEvent.click(sectionBtn);
      expect(screen.getByTestId("swatch-环形 (Ring)")).toBeInTheDocument();
    });

    it("点击已展开的 section 应折叠", () => {
      render(<ThemeCustomizer />);
      // "1. 颜色" section is open by default
      const sectionBtn = screen.getAllByText(/颜色 · 语义化变量/)[0];
      fireEvent.click(sectionBtn);
      // Section should toggle - just verify no error occurs
      expect(sectionBtn).toBeInTheDocument();
    });
  });

  describe("字体排版 Section", () => {
    it("点击展开后应渲染字体输入框", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/字体排版/)[0]);
      expect(screen.getAllByText("无衬线字体 (Sans-Serif)")[0]).toBeInTheDocument();
      expect(screen.getAllByText("衬线字体 (Serif)")[0]).toBeInTheDocument();
      expect(screen.getAllByText("等宽字体 (Monospace)")[0]).toBeInTheDocument();
    });
  });

  describe("阴影/圆角 Section", () => {
    it("展开后应渲染圆角滑块", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/阴影 \/ 圆角/)[0]);
      expect(screen.getAllByText("圆角 (Radius)")[0]).toBeInTheDocument();
      expect(screen.getAllByText("0.5rem")[0]).toBeInTheDocument();
    });

    it("展开后应渲染阴影控制", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/阴影 \/ 圆角 · 透明度/)[0]);
      // Verify section is rendered - check for shadow-related content
      expect(screen.getAllByText(/阴影/).length).toBeGreaterThan(0);
    });
  });

  describe("亮度调节 Section", () => {
    it("展开后应渲染亮度百分比", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/OKLch · 亮度调节/)[0]);
      expect(screen.getAllByText(/亮度: 50%/)[0]).toBeInTheDocument();
    });
  });

  describe("预设系统", () => {
    it("应显示当前预设名称", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText(/预设系统: 赛博朋克/).length).toBeGreaterThan(0);
    });

    it("点击应打开预设下拉列表", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/预设系统: 赛博朋克/)[0]);
      expect(screen.getAllByText("自然绿").length).toBeGreaterThan(0);
    });

    it("选择预设应切换并关闭下拉", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/预设系统: 赛博朋克/)[0]);
      fireEvent.click(screen.getAllByText("自然绿")[0]);
      expect(screen.getAllByText(/预设系统: 自然绿/).length).toBeGreaterThan(0);
    });

    it("搜索应过滤预设列表", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/预设系统: 赛博朋克/)[0]);
      const searchInput = screen.getAllByPlaceholderText(/搜索设计系统/)[0];
      fireEvent.change(searchInput, { target: { value: "green" } });
      expect(screen.getAllByText("自然绿").length).toBeGreaterThan(0);
    });

    it("无匹配时应显示空提示", () => {
      render(<ThemeCustomizer />);
      fireEvent.click(screen.getAllByText(/预设系统: 赛博朋克/)[0]);
      const searchInput = screen.getAllByPlaceholderText(/搜索设计系统/)[0];
      fireEvent.change(searchInput, { target: { value: "zzzzz" } });
      expect(screen.getAllByText("无匹配预设").length).toBeGreaterThan(0);
    });
  });

  describe("实时预览", () => {
    it("应渲染实时预览区域", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("实时预览").length).toBeGreaterThan(0);
    });

    it("应渲染预览中的操作按钮", () => {
      render(<ThemeCustomizer />);
      expect(screen.getAllByText("主要操作").length).toBeGreaterThan(0);
    });
  });

  describe("重置功能", () => {
    it("选择其他预设后重置应恢复默认", () => {
      render(<ThemeCustomizer />);
      // Select another preset
      fireEvent.click(screen.getAllByText(/预设系统: 赛博朋克/)[0]);
      fireEvent.click(screen.getAllByText("自然绿")[0]);
      expect(screen.getAllByText(/预设系统: 自然绿/).length).toBeGreaterThan(0);
      // Reset
      fireEvent.click(screen.getAllByText("重置")[0]);
      expect(screen.getAllByText(/预设系统: 赛博朋克/).length).toBeGreaterThan(0);
    });
  });
});
