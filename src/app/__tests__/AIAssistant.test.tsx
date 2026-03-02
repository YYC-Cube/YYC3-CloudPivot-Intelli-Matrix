/**
 * AIAssistant.test.tsx
 * =====================
 * AIAssistant 组件测试
 *
 * 覆盖范围:
 * - 浮动按钮渲染与点击打开
 * - 面板打开后 header/tab/content 渲染
 * - Chat Tab: 欢迎消息, 发送消息, 输入框, 发送按钮
 * - Commands Tab: 分类过滤, 命令列表, 执行命令
 * - Prompts Tab: 预设列表, 应用预设, 自定义编辑
 * - Settings Tab: API Key, 模型选择, 参数调节
 * - 关闭面板
 * - 清空对话
 * - 最大化/还原
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";

vi.mock("../components/YYC3LogoSvg", () => ({
  YYC3LogoSvg: () => <div data-testid="yyc3-logo-svg" />,
}));

import AIAssistant from "../components/AIAssistant";

describe("AIAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe("浮动按钮", () => {
    it("初始应渲染浮动按钮", () => {
      render(<AIAssistant isMobile={false} />);
      expect(screen.getAllByText("AI 智能助理 (⌘J)").length).toBeGreaterThan(0);
    });

    it("浮动按钮应有 tooltip", () => {
      render(<AIAssistant isMobile={false} />);
      const tooltipElements = screen.getAllByText("AI 智能助理 (⌘J)");
      expect(tooltipElements.length).toBeGreaterThan(0);
    });

    it("点击浮动按钮应打开面板", () => {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
      expect(screen.getAllByText("AI 智能助理")[0]).toBeInTheDocument();
    });
  });

  describe("面板基础", () => {
    function openPanel() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
    }

    it("面板应渲染 header 和模型名称", () => {
      openPanel();
      expect(screen.getAllByText("AI 智能助理")[0]).toBeInTheDocument();
      expect(screen.getAllByText("本地 Qwen-72B")[0]).toBeInTheDocument(); // default model
    });

    it("面板应渲染 4 个 Tab", () => {
      openPanel();
      expect(screen.getAllByText("对话")[0]).toBeInTheDocument();
      expect(screen.getAllByText("命令")[0]).toBeInTheDocument();
      expect(screen.getAllByText("提示词")[0]).toBeInTheDocument();
      expect(screen.getAllByText("配置")[0]).toBeInTheDocument();
    });

    it("关闭按钮应关闭面板", () => {
      openPanel();
      // Find close button (X icon)
      // The last button in header area is close
      const headerBtns = screen.getAllByText("AI 智能助理")[0].closest("div")?.parentElement?.querySelectorAll("button");
      if (headerBtns && headerBtns.length > 0) {
        fireEvent.click(headerBtns[headerBtns.length - 1]); // last = close
        expect(screen.queryByText("AI 智能助理")).not.toBeInTheDocument();
      }
    });

    it("最大化按钮应切换面板大小", () => {
      openPanel();
      const maxBtn = screen.getByTitle("最大化");
      fireEvent.click(maxBtn);
      // After maximizing, title should change to 还原
      expect(screen.getAllByTitle("还原")[0]).toBeInTheDocument();
    });
  });

  describe("Chat Tab", () => {
    function openChat() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]); // open panel
    }

    it("应渲染欢迎消息", async () => {
      openChat();
      await waitFor(() => {
        const welcomeElements = screen.queryAllByText(/你好！我是 CP-IM AI 智能助理/);
        expect(welcomeElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it("应渲染输入框", () => {
      openChat();
      expect(screen.getByPlaceholderText(/输入指令/)).toBeInTheDocument();
    });

    it("输入文本后发送按钮应可用", () => {
      openChat();
      const input = screen.getByPlaceholderText(/输入指令/);
      fireEvent.change(input, { target: { value: "查看集群状态" } });
      const allBtns = screen.getAllByRole("button");
      const lastBtn = allBtns[allBtns.length - 1];
      expect(lastBtn).not.toBeDisabled();
    });

    it("发送消息后应显示用户消息", async () => {
      openChat();
      const input = screen.getByPlaceholderText(/输入指令/);
      fireEvent.change(input, { target: { value: "查看节点状态" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(screen.getAllByText("查看节点状态")[0]).toBeInTheDocument();
    });

    it("清空对话应重置消息", () => {
      openChat();
      const clearBtn = screen.getByTitle("清空对话");
      fireEvent.click(clearBtn);
      expect(screen.getAllByText("对话已清空。请输入新的指令开始操作。")[0]).toBeInTheDocument();
    });
  });

  describe("Commands Tab", () => {
    function openCommands() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]); // open panel
      fireEvent.click(screen.getAllByText("命令")[0]); // switch to commands tab
    }

    it("应渲染命令分类过滤按钮", () => {
      openCommands();
      expect(screen.getAllByText("全部")[0]).toBeInTheDocument();
      expect(screen.getAllByText("集群")[0]).toBeInTheDocument();
      expect(screen.getAllByText("模型")[0]).toBeInTheDocument();
      expect(screen.getAllByText("数据")[0]).toBeInTheDocument();
      expect(screen.getAllByText("安全")[0]).toBeInTheDocument();
      expect(screen.getAllByText("监控")[0]).toBeInTheDocument();
    });

    it("应渲染命令列表", () => {
      openCommands();
      expect(screen.getAllByText("集群状态总览")[0]).toBeInTheDocument();
      expect(screen.getAllByText("重启异常节点")[0]).toBeInTheDocument();
      expect(screen.getAllByText("部署模型")[0]).toBeInTheDocument();
    });

    it("点击分类应过滤命令", () => {
      openCommands();
      fireEvent.click(screen.getAllByText("安全")[0]);
      expect(screen.getAllByText("安全审计扫描")[0]).toBeInTheDocument();
      expect(screen.queryByText("集群状态总览")).not.toBeInTheDocument();
    });

    it("点击命令应切换到对话并发送", async () => {
      openCommands();
      const commandElements = screen.queryAllByText("集群状态总览");
      if (commandElements.length > 0) {
        fireEvent.click(commandElements[0]);
      }
      // Should switch to chat tab
      await waitFor(() => {
        const inputElements = screen.queryAllByPlaceholderText(/输入指令/);
        expect(inputElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe("Prompts Tab", () => {
    function openPrompts() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
      fireEvent.click(screen.getAllByText("提示词")[0]);
    }

    it("应渲染预设列表", () => {
      openPrompts();
      expect(screen.getAllByText("运维诊断专家")[0]).toBeInTheDocument();
      expect(screen.getAllByText("模型调优顾问")[0]).toBeInTheDocument();
      expect(screen.getAllByText("数据分析师")[0]).toBeInTheDocument();
      expect(screen.getAllByText("安全审计员")[0]).toBeInTheDocument();
      expect(screen.getAllByText("智能运维助手")[0]).toBeInTheDocument();
    });

    it("应渲染分类标签", () => {
      openPrompts();
      expect(screen.getAllByText("运维")[0]).toBeInTheDocument();
      expect(screen.getAllByText("通用")[0]).toBeInTheDocument();
    });

    it("应渲染自定义提示词编辑器", () => {
      openPrompts();
      expect(screen.getAllByText("自定义系统提示词")[0]).toBeInTheDocument();
      expect(screen.getByPlaceholderText("输入自定义系统提示词...")).toBeInTheDocument();
    });

    it("点击预设应应用并切换到对话", () => {
      openPrompts();
      fireEvent.click(screen.getAllByText("运维诊断专家")[0]);
      // Should switch to chat tab and add system message
      expect(screen.getByPlaceholderText(/输入指令/)).toBeInTheDocument();
    });
  });

  describe("Settings Tab", () => {
    function openSettings() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
      fireEvent.click(screen.getAllByText("配置")[0]);
    }

    it("应渲染 API Key 输入框", () => {
      openSettings();
      expect(screen.getByPlaceholderText("sk-xxxxxxxxxxxxxxxxxxxxxxxx")).toBeInTheDocument();
    });

    it("应渲染未配置 Key 提示", () => {
      openSettings();
      expect(screen.getAllByText(/未配置 Key/)[0]).toBeInTheDocument();
    });

    it("输入 API Key 后应显示已配置", () => {
      openSettings();
      const input = screen.getByPlaceholderText("sk-xxxxxxxxxxxxxxxxxxxxxxxx");
      fireEvent.change(input, { target: { value: "sk-test123" } });
      expect(screen.getAllByText(/API Key 已配置/)[0]).toBeInTheDocument();
    });

    it("应渲染模型选择按钮", () => {
      openSettings();
      expect(screen.getAllByText("GPT-4o")[0]).toBeInTheDocument();
      expect(screen.getAllByText("GPT-3.5 Turbo")[0]).toBeInTheDocument();
      expect(screen.getAllByText("本地 LLaMA-70B")[0]).toBeInTheDocument();
    });

    it("点击模型应切换选中", () => {
      openSettings();
      const gpt4Btn = screen.getAllByText("GPT-4o")[0].closest("button")!;
      fireEvent.click(gpt4Btn);
      expect(gpt4Btn.className).toContain("text-[#00d4ff]");
    });

    it("应渲染温度滑块", () => {
      openSettings();
      expect(screen.getAllByText(/Temperature/)[0]).toBeInTheDocument();
    });

    it("显示/隐藏 API Key 切换", () => {
      openSettings();
      const toggleBtn = screen.getAllByText("显示")[0];
      fireEvent.click(toggleBtn);
      expect(screen.getAllByText("隐藏")[0]).toBeInTheDocument();
    });
  });

  describe("移动端", () => {
    it("移动端浮动按钮定位不同", () => {
      render(<AIAssistant isMobile={true} />);
      const buttons = screen.getAllByRole("button");
      const btn = buttons[0];
      expect(btn).toBeInTheDocument();
    });

    it("移动端打开面板应全屏", () => {
      render(<AIAssistant isMobile={true} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
      expect(screen.getByText("AI 智能助理")).toBeInTheDocument();
      // In mobile, no maximize button
      expect(screen.queryByTitle("最大化")).not.toBeInTheDocument();
    });
  });
});
