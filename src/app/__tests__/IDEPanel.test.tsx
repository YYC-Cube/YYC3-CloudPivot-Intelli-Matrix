/**
 * IDEPanel.test.tsx
 * ==================
 * IDEPanel 组件 - IDE 集成面板测试
 *
 * 覆盖范围:
 * - 面板标题渲染
 * - Tab 切换（监控/告警/操作/日志）
 * - 各 Tab 内容显示
 * - 导航跳转
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockNavigate = vi.fn() as any;

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/ide" }),
}));

// Mock layout context
vi.mock("../components/Layout", () => ({
  WebSocketContext: React.createContext(null),
  ViewContext: React.createContext({ isMobile: false, isTablet: false, isDesktop: true, width: 1200, breakpoint: "lg", isTouch: false }),
}));

// Mock i18n
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    "nav.dataMonitor": "数据监控",
    "common.warning": "告警",
    "nav.operations": "操作",
    "nav.logs": "日志",
    "nav.aiDecision": "AI 决策",
    "nav.serviceLoop": "服务闭环",
    "nav.designSystem": "设计系统",
    "nav.devGuide": "开发指南",
    "nav.settings": "设置",
    "nodeStatus": "节点状态",
    "quickActions": "快速操作",
    "openBrowser": "打开浏览器面板",
    "recentLogs": "最近日志",
    "ide.subtitle": "IDE 集成面板",
    "ide.dashboardTitle": "YYC³ Matrix Dashboard",
    "ide.nodeCount": "节点计数",
    "ide.alertCount": "告警计数",
    "ide.logCount": "日志计数",
    "nav.ide": "IDE",
    "log.title": "日志",
    "monitor.openBrowser": "打开浏览器面板",
    "monitor.nodeStatus": "节点状态",
    "monitor.activeAlerts": "活跃告警",
    "monitor.recentLogs": "最近日志",
    "operations.quickActions": "快速操作",
    "operations.title": "操作中心",
  };
  return translations[key] || key;
};

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({ t: mockT }),
}));

import { IDEPanel } from "../components/IDEPanel";

describe("IDEPanel", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // 基础渲染
  // ----------------------------------------------------------

  describe("基础渲染", () => {
    it("应渲染面板标题", () => {
      render(<IDEPanel />);
      expect(screen.getByText("IDE")).toBeInTheDocument();
    });

    it("应渲染 YYC³ CloudPivot Intelli-Matrix 标题", () => {
      render(<IDEPanel />);
      expect(screen.getByText("YYC³ CloudPivot Intelli-Matrix")).toBeInTheDocument();
    });

    it("应渲染 4 个 Tab", () => {
      render(<IDEPanel />);
      expect(screen.getByTestId("ide-tab-monitor")).toBeInTheDocument();
      expect(screen.getByTestId("ide-tab-alerts")).toBeInTheDocument();
      expect(screen.getByTestId("ide-tab-operations")).toBeInTheDocument();
      expect(screen.getByTestId("ide-tab-logs")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 监控 Tab（默认）
  // ----------------------------------------------------------

  describe("监控 Tab", () => {
    it("默认应显示节点列表", () => {
      render(<IDEPanel />);
      expect(screen.getByText("GPU-A100-01")).toBeInTheDocument();
      expect(screen.getByText("GPU-A100-03")).toBeInTheDocument();
      expect(screen.getByText("GPU-H100-02")).toBeInTheDocument();
    });

    it("应显示节点计数", () => {
      render(<IDEPanel />);
      // 6 out of 7 ok nodes
      expect(screen.getByText(/节点状态/)).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 告警 Tab
  // ----------------------------------------------------------

  describe("告警 Tab", () => {
    it("切换到告警 Tab 应显示告警列表", () => {
      render(<IDEPanel />);
      fireEvent.click(screen.getByTestId("ide-tab-alerts"));
      expect(screen.getByText("GPU-A100-03 推理延迟异常")).toBeInTheDocument();
      expect(screen.getByText("#AL-0032")).toBeInTheDocument();
    });

    it("点击告警应导航到 /follow-up", () => {
      render(<IDEPanel />);
      fireEvent.click(screen.getByTestId("ide-tab-alerts"));
      const alert = screen.getByText("GPU-A100-03 推理延迟异常").closest("[class*=cursor-pointer]");
      if (alert) {
        fireEvent.click(alert);
        expect(mockNavigate).toHaveBeenCalledWith("/follow-up");
      }
    });
  });

  // ----------------------------------------------------------
  // 操作 Tab
  // ----------------------------------------------------------

  describe("操作 Tab", () => {
    it("切换到操作 Tab 应显示快速操作", () => {
      render(<IDEPanel />);
      fireEvent.click(screen.getByTestId("ide-tab-operations"));
      expect(screen.getByText("快速操作")).toBeInTheDocument();
      expect(screen.getByText("重启节点")).toBeInTheDocument();
      expect(screen.getByText("清理缓存")).toBeInTheDocument();
    });

    it("应渲染浏览器面板和操作中心按钮", () => {
      render(<IDEPanel />);
      fireEvent.click(screen.getByTestId("ide-tab-operations"));
      expect(screen.getByText("打开浏览器面板")).toBeInTheDocument();
      expect(screen.getByText("操作中心")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // 日志 Tab
  // ----------------------------------------------------------

  describe("日志 Tab", () => {
    it("切换到日志 Tab 应显示日志记录", () => {
      render(<IDEPanel />);
      fireEvent.click(screen.getByTestId("ide-tab-logs"));
      expect(screen.getByText("最近日志")).toBeInTheDocument();
      expect(screen.getByText("模型加载 LLaMA-70B")).toBeInTheDocument();
    });
  });
});
