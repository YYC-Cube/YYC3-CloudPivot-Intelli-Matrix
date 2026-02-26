/**
 * CommandPalette.test.tsx
 * ========================
 * CommandPalette 组件 - 全局命令面板测试
 *
 * 覆盖范围:
 * - 打开/关闭
 * - 搜索筛选
 * - 快捷键帮助面板
 * - 结果列表渲染
 * - 导航执行
 * - 键盘导航
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockNavigate = vi.fn() as any;

vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
}));

const mockT = (key: string) => {
  const translations: Record<string, string> = {
    "nav.dataMonitor": "数据监控",
    "nav.operations": "操作中心",
    "nav.aiDecision": "AI 决策",
    "nav.followUp": "跟进",
    "nav.patrol": "巡查",
    "nav.fileManager": "文件管理",
    "nav.terminal": "终端",
    "nav.ide": "IDE",
    "nav.serviceLoop": "服务闭环",
    "nav.designSystem": "设计系统",
    "nav.devGuide": "开发指南",
    "modelProvider.title": "模型提供商",
    "modelProvider.subtitle": "管理 AI 模型提供商",
    "nav.audit": "操作审计",
    "nav.userMgmt": "用户管理",
    "nav.settings": "设置",
    "monitor.subtitle": "实时系统状态面板",
    "followUp.subtitle": "跟进任务管理",
    "patrol.subtitle": "系统巡查",
    "operations.subtitle": "操作管理",
    "fileManager.subtitle": "文件管理",
    "palette.navigate": "导航",
    "palette.enter": "确认",
    "palette.escape": "关闭",
    "palette.open": "打开",
    "palette.noResults": "无匹配结果",
    "ai.subtitle": "AI 决策分析",
    "loop.subtitle": "服务闭环管理",
    "devGuide.architecture": "系统架构设计",
    "devGuide.subtitle": "开发指南",
    "settings.title": "系统设置",
  };
  return translations[key] || key;
};

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({ t: mockT }),
}));

import { CommandPalette } from "../components/CommandPalette";

describe("CommandPalette", () => {
  let onClose: any;

  beforeEach(() => {
    onClose = vi.fn() as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("显示/隐藏", () => {
    it("isOpen=false 时不应渲染", () => {
      render(<CommandPalette isOpen={false} onClose={onClose} />);
      expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
    });

    it("isOpen=true 时应渲染", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("应渲染搜索输入框", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      expect(screen.getByTestId("palette-input")).toBeInTheDocument();
    });

    it("点击遮罩应关闭", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId("command-palette-overlay"));
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("搜索筛选", () => {
    it("初始应显示所有项目", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      expect(screen.getByTestId("palette-results")).toBeInTheDocument();
      expect(screen.getByText("数据监控")).toBeInTheDocument();
      expect(screen.getByText("操作中心")).toBeInTheDocument();
    });

    it("输入关键词应筛选结果", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.change(screen.getByTestId("palette-input"), { target: { value: "操作" } });
      expect(screen.getByText("操作中心")).toBeInTheDocument();
      expect(screen.getByText("操作审计")).toBeInTheDocument();
    });

    it("无匹配时应显示空提示", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.change(screen.getByTestId("palette-input"), { target: { value: "zzzzzzz" } });
      expect(screen.getByText("无匹配结果")).toBeInTheDocument();
    });
  });

  describe("快捷键帮助", () => {
    it("点击快捷键按钮应显示帮助面板", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId("shortcuts-toggle"));
      expect(screen.getByTestId("shortcuts-panel")).toBeInTheDocument();
    });

    it("帮助面板应包含快捷键列表", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId("shortcuts-toggle"));
      expect(screen.getByText("快速搜索")).toBeInTheDocument();
      expect(screen.getByText("操作中心")).toBeInTheDocument();
    });
  });

  describe("导航执行", () => {
    it("点击项目应导航并关闭", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId("palette-item-nav-operations"));
      expect(mockNavigate).toHaveBeenCalledWith("/operations");
      expect(onClose).toHaveBeenCalled();
    });

    it("点击 AI 决策项应导航到 /ai", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.click(screen.getByTestId("palette-item-nav-ai"));
      expect(mockNavigate).toHaveBeenCalledWith("/ai");
    });
  });

  describe("键盘导航", () => {
    it("Escape 应关闭", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Escape" });
      expect(onClose).toHaveBeenCalled();
    });

    it("Enter 应执行选中项", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Enter" });
      expect(mockNavigate).toHaveBeenCalledWith("/");
      expect(onClose).toHaveBeenCalled();
    });

    it("ArrowDown 应移动选中项", () => {
      render(<CommandPalette isOpen={true} onClose={onClose} />);
      fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "ArrowDown" });
      // 选中第二项后按 Enter
      fireEvent.keyDown(screen.getByTestId("palette-input"), { key: "Enter" });
      expect(mockNavigate).toHaveBeenCalledWith("/follow-up");
    });
  });
});
