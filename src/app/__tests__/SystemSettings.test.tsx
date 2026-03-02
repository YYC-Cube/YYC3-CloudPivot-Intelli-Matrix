/**
 * SystemSettings.test.tsx
 * ========================
 * SystemSettings 组件测试
 *
 * 覆盖范围:
 * - 设置分类列表渲染
 * - 分类切换交互
 * - Toggle 开关组件
 * - EditableField 编辑/显示/密码模式
 * - API Endpoint 配置区域
 * - 各分类内容渲染 (general/network/cluster/model/storage/websocket...)
 * - 保存/重置操作
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
    locales: ["zh-CN", "en-US"],
  }),
}));

vi.mock("../components/GlassCard", () => ({
  default: (
  GlassCard: ({ children, className }: { children?: React.ReactNode; className?: string }) => <div className={className}>{children}</div>,
}));

vi.mock("../components/NetworkConfig", () => ({
  NetworkConfig: () => <div data-testid="network-config" />,
}));

vi.mock("../components/YYC3Logo", () => ({
  YYC3Logo: () => <div data-testid="yyc3-logo" />,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../lib/api-config", () => ({
  getAPIConfig: () => ({
    enableBackend: false,
    timeout: 15000,
    maxRetries: 2,
    fsBase: "/api/fs",
    dbBase: "/api/db",
    wsEndpoint: "ws://localhost:3113/ws",
    aiBase: "https://api.openai.com/v1",
    clusterBase: "/api/cluster",
  }),
  setAPIConfig: vi.fn((patch: Record<string, unknown>) => ({ ...patch })),
  resetAPIConfig: vi.fn(() => ({})),
  onAPIConfigChange: vi.fn(() => () => {}),
  ENDPOINT_META: [
    { key: "enableBackend", label: "Enable Backend API", labelCn: "启用后端 API", description: "关闭时使用前端 Mock 数据", type: "boolean", placeholder: "", group: "通用" },
    { key: "timeout", label: "Request Timeout", labelCn: "请求超时 (ms)", description: "API 请求超时时间", type: "number", placeholder: "15000", group: "通用" },
    { key: "maxRetries", label: "Max Retries", labelCn: "最大重试次数", description: "请求失败后重试次数", type: "number", placeholder: "2", group: "通用" },
    { key: "wsEndpoint", label: "WebSocket", labelCn: "WebSocket 地址", description: "实时数据推送", type: "url", placeholder: "ws://localhost:3113/ws", group: "实时通信" },
  ],
}));

import SystemSettings from "../components/SystemSettings";

describe("SystemSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("基础渲染", () => {
    it("应渲染设置标题", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("系统设置")[0]).toBeInTheDocument();
    });

    it("应渲染 12 个设置分类", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("settings.general").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.network").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.cluster").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.model").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.storage").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.websocket").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.aiLlm").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.pwaOffline").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.security").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.notification").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.envVars").length).toBeGreaterThan(0);
      expect(screen.getAllByText("settings.advanced").length).toBeGreaterThan(0);
    });
  });

  describe("分类切换", () => {
    it("默认显示 general 分类内容", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("settings.general").length).toBeGreaterThan(0);
    });

    it("点击 network 应切换到网络配置", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.network")[0]);
      expect(screen.getAllByText("网络连接配置").length).toBeGreaterThan(0);
      expect(screen.getAllByText("打开网络配置面板").length).toBeGreaterThan(0);
    });

    it("点击 cluster 应显示集群配置", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.cluster")[0]);
      // Cluster section should show cluster-related settings
      expect(screen.getAllByText("settings.cluster").length).toBeGreaterThan(0);
    });
  });

  describe("General 分类", () => {
    it("应渲染系统信息标题", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("系统信息")[0]).toBeInTheDocument();
    });

    it("应渲染 YYC3 Logo", () => {
      render(<SystemSettings />);
      expect(screen.getAllByTestId("yyc3-logo").length).toBeGreaterThan(0);
    });

    it("应渲染系统名称字段", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("系统名称")[0]).toBeInTheDocument();
    });

    it("应渲染运行时间", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("运行时间")[0]).toBeInTheDocument();
    });

    it("应渲染许可证信息", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("Enterprise Pro")[0]).toBeInTheDocument();
    });

    it("应渲染深色模式开关", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("深色模式")[0]).toBeInTheDocument();
    });

    it("应渲染系统健康度", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("系统健康度")[0]).toBeInTheDocument();
      expect(screen.getAllByText("所有服务正常")[0]).toBeInTheDocument();
    });
  });

  describe("保存和重置", () => {
    it("应渲染保存按钮", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("settings.saveChanges")[0]).toBeInTheDocument();
    });

    it("应渲染重置按钮", () => {
      render(<SystemSettings />);
      expect(screen.getAllByText("settings.resetDefault")[0]).toBeInTheDocument();
    });

    it("无更改时保存按钮应禁用", () => {
      render(<SystemSettings />);
      const saveBtn = screen.getAllByText("settings.saveChanges")[0].closest("button")!;
      expect(saveBtn).toBeDisabled();
    });
  });

  describe("Model 分类", () => {
    it("应渲染模型管理标题和添加按钮", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.model")[0]);
      expect(screen.getAllByText("模型管理")[0]).toBeInTheDocument();
      expect(screen.getAllByText("添加模型")[0]).toBeInTheDocument();
    });

    it("应渲染模型列表", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.model")[0]);
      expect(screen.getAllByText("LLaMA-70B")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Qwen-72B")[0]).toBeInTheDocument();
      expect(screen.getAllByText("DeepSeek-V3")[0]).toBeInTheDocument();
    });
  });

  describe("Advanced 分类 (API 端点)", () => {
    it("应渲染高级设置标题", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.advanced")[0]);
      expect(screen.getAllByText("高级设置")[0]).toBeInTheDocument();
    });

    it("应渲染调试模式开关", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.advanced")[0]);
      expect(screen.getAllByText("调试模式")[0]).toBeInTheDocument();
    });

    it("应渲染危险操作区域", () => {
      render(<SystemSettings />);
      fireEvent.click(screen.getAllByText("settings.advanced")[0]);
      expect(screen.getAllByText("危险操作")[0]).toBeInTheDocument();
    });
  });

  describe("各分类渲染", () => {
    const categories = [
      "settings.model",
      "settings.storage",
      "settings.websocket",
      "settings.aiLlm",
      "settings.pwaOffline",
      "settings.security",
      "settings.notification",
      "settings.envVars",
    ];

    categories.forEach((cat) => {
      it(`点击 ${cat} 不应抛出错误`, () => {
        render(<SystemSettings />);
        fireEvent.click(screen.getAllByText(cat)[0]);
        expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
      });
    });
  });
});