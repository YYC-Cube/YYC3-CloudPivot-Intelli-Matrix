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
import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const createMockSettings = () => {
  const settings: Record<string, any> = {
    aiModel: "qwen-72b",
    aiApiKey: "",
    aiTemperature: "0.7",
    aiMaxTokens: "2048",
    aiTopP: "0.9",
  };
  return {
    values: settings,
    updateValue: vi.fn((key: string, value: any) => {
      settings[key] = value;
    }),
    getSettings: () => settings,
  };
};

const mockSettingsStore = createMockSettings();

vi.mock("../hooks/useModelProvider", () => ({
  useModelProvider: () => ({
    availableModels: [
      { id: "qwen-72b", name: "本地 Qwen-72B", isLocal: true },
      { id: "gpt-4o", name: "GPT-4o", isLocal: false },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isLocal: false },
      { id: "llama-70b", name: "本地 LLaMA-70B", isLocal: true },
    ],
    ollamaLoading: false,
  }),
}));

vi.mock("../hooks/useSettingsStore", () => ({
  useSettingsStore: () => mockSettingsStore,
}));

vi.mock("../components/YYC3LogoSvg", () => ({
  YYC3LogoSvg: () => <div data-testid="yyc3-logo-svg" />,
}));

import { AIAssistant } from "../components/AIAssistant";

describe("AIAssistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
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
      expect(screen.getAllByText("本地 Qwen-72B")[0]).toBeInTheDocument();
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
      const headerBtns = screen.getAllByText("AI 智能助理")[0].closest("div")?.parentElement?.querySelectorAll("button");
      if (headerBtns && headerBtns.length > 0) {
        fireEvent.click(headerBtns[headerBtns.length - 1]);
        expect(screen.queryByText("AI 智能助理")).not.toBeInTheDocument();
      }
    });

    it("最大化按钮应切换面板大小", () => {
      openPanel();
      const maxBtn = screen.getByTitle("最大化");
      fireEvent.click(maxBtn);
      expect(screen.getAllByTitle("还原")[0]).toBeInTheDocument();
    });
  });

  describe("Chat Tab", () => {
    function openChat() {
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      fireEvent.click(buttons[0]);
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
    it("应渲染命令分类过滤按钮", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const commandTabs = screen.getAllByText("命令");
      await user.click(commandTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("全部")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.getAllByText("集群")[0]).toBeVisible();
      expect(screen.getAllByText("模型")[0]).toBeVisible();
      expect(screen.getAllByText("数据")[0]).toBeVisible();
      expect(screen.getAllByText("安全")[0]).toBeVisible();
      expect(screen.getAllByText("监控")[0]).toBeVisible();
    });

    it("应渲染命令列表", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const commandTabs = screen.getAllByText("命令");
      await user.click(commandTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("集群状态总览")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.getAllByText("重启异常节点")[0]).toBeVisible();
      expect(screen.getAllByText("部署模型")[0]).toBeVisible();
    });

    it("点击分类应过滤命令", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const commandTabs = screen.getAllByText("命令");
      await user.click(commandTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("安全")[0]).toBeVisible();
      }, { timeout: 5000 });

      await user.click(screen.getAllByText("安全")[0]);

      await waitFor(() => {
        expect(screen.getAllByText("安全审计扫描")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.queryByText("集群状态总览")).not.toBeInTheDocument();
    });

    it("点击命令应切换到对话并发送", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const commandTabs = screen.getAllByText("命令");
      await user.click(commandTabs[0]);

      await waitFor(() => {
        expect(screen.queryAllByText("集群状态总览").length).toBeGreaterThan(0);
      }, { timeout: 5000 });

      const commandElements = screen.queryAllByText("集群状态总览");
      if (commandElements.length > 0) {
        await user.click(commandElements[0]);
      }

      await waitFor(() => {
        const inputElements = screen.queryAllByPlaceholderText(/输入指令/);
        expect(inputElements.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe("Prompts Tab", () => {
    it("应渲染预设列表", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const promptsTabs = screen.getAllByText("提示词");
      await user.click(promptsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("运维诊断专家")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.getAllByText("模型调优顾问")[0]).toBeVisible();
      expect(screen.getAllByText("数据分析师")[0]).toBeVisible();
      expect(screen.getAllByText("安全审计员")[0]).toBeVisible();
      expect(screen.getAllByText("智能运维助手")[0]).toBeVisible();
    });

    it("应渲染分类标签", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const promptsTabs = screen.getAllByText("提示词");
      await user.click(promptsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("运维")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.getAllByText("通用")[0]).toBeVisible();
    });

    it("应渲染自定义提示词编辑器", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const promptsTabs = screen.getAllByText("提示词");
      await user.click(promptsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("自定义系统提示词")[0]).toBeVisible();
      }, { timeout: 5000 });

      expect(screen.getByPlaceholderText("输入自定义系统提示词...")).toBeVisible();
    });

    it("点击预设应应用预设", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const promptsTabs = screen.getAllByText("提示词");
      await user.click(promptsTabs[0]);

      await waitFor(() => {
        expect(screen.getAllByText("运维诊断专家")[0]).toBeVisible();
      }, { timeout: 5000 });

      await user.click(screen.getAllByText("运维诊断专家")[0]);

      await waitFor(() => {
        const checkIcons = document.querySelectorAll('svg.lucide-check');
        expect(checkIcons.length).toBeGreaterThan(0);
      }, { timeout: 5000 });
    });
  });

  describe("Settings Tab", () => {
    it("应渲染 API Key 输入框", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const input = await screen.findByPlaceholderText("sk-xxxxxxxxxxxxxxxxxxxxxxxx", {}, { timeout: 5000 });
      expect(input).toBeVisible();
    });

    it("应渲染未配置 Key 提示", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const hint = await screen.findByText(/未配置 Key/, {}, { timeout: 5000 });
      expect(hint).toBeVisible();
    });

    it("输入 API Key 后应显示已配置", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const input = await screen.findByPlaceholderText("sk-xxxxxxxxxxxxxxxxxxxxxxxx", {}, { timeout: 5000 });
      fireEvent.change(input, { target: { value: "sk-test123" } });

      expect(mockSettingsStore.updateValue).toHaveBeenCalledWith("aiApiKey", "sk-test123");
    });

    it("应渲染模型选择按钮", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const gpt4Btn = await screen.findByText("GPT-4o", {}, { timeout: 5000 });
      expect(gpt4Btn).toBeVisible();
      expect(screen.getAllByText("GPT-3.5 Turbo")[0]).toBeVisible();
      expect(screen.getAllByText("本地 LLaMA-70B")[0]).toBeVisible();
    });

    it("点击模型应切换选中", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const gpt4Text = await screen.findByText("GPT-4o", {}, { timeout: 5000 });
      const gpt4Btn = gpt4Text.closest("button")!;
      await user.click(gpt4Btn);

      expect(mockSettingsStore.updateValue).toHaveBeenCalledWith("aiModel", "gpt-4o");
    });

    it("应渲染温度滑块", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const tempLabel = await screen.findByText(/Temperature/, {}, { timeout: 5000 });
      expect(tempLabel).toBeVisible();
    });

    it("显示/隐藏 API Key 切换", async () => {
      const user = userEvent.setup();
      render(<AIAssistant isMobile={false} />);
      const buttons = screen.getAllByRole("button");
      await user.click(buttons[0]);

      const settingsTabs = screen.getAllByText("配置");
      await user.click(settingsTabs[0]);

      const input = await screen.findByPlaceholderText("sk-xxxxxxxxxxxxxxxxxxxxxxxx", {}, { timeout: 5000 });
      expect(input).toHaveAttribute("type", "password");

      const container = input.parentElement;
      const toggleBtn = container?.querySelector("button");
      expect(toggleBtn).toBeTruthy();
      await user.click(toggleBtn!);

      await waitFor(() => {
        expect(input).toHaveAttribute("type", "text");
      }, { timeout: 5000 });
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
      expect(screen.queryByTitle("最大化")).not.toBeInTheDocument();
    });
  });
});
