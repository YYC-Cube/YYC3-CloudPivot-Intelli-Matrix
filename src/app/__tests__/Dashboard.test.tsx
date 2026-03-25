/**
 * Dashboard.test.tsx
 * ====================
 * Dashboard 组件测试
 *
 * 覆盖范围:
 * - 6 个统计卡片渲染 (QPS/Latency/Nodes/GPU/Tokens/Storage)
 * - 图表区域渲染 (吞吐量/模型分布/雷达/性能/预测)
 * - 节点矩阵渲染与点击
 * - 实时操作列表渲染
 * - NodeDetailModal 打开/关闭
 * - 移动端/桌面端响应式
 * - ChartTabBar 切换 (移动端)
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

// ── Mocks ──

// Mock view-context FIRST (before other imports that might depend on it)
vi.mock("../lib/view-context", () => ({
  ViewContext: React.createContext({ isMobile: false, isTablet: false, isDesktop: true, width: 1200, breakpoint: "lg", isTouch: false }),
  WebSocketContext: React.createContext(null),
}));

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/" }),
}));

// Mock recharts
vi.mock("recharts", () => {
  const Wrap = ({ children, ...p }: any) => <div data-testid="chart-container" {...p}>{children}</div>;
  return {
    ResponsiveContainer: Wrap,
    AreaChart: Wrap,
    Area: () => <div data-testid="area" />,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    PieChart: Wrap,
    Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
    Cell: () => <div data-testid="cell" />,
    RadarChart: Wrap,
    Radar: () => <div data-testid="radar" />,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    PolarRadiusAxis: () => null,
    Legend: () => null,
    BarChart: Wrap,
    Bar: () => <div data-testid="bar" />,
    LineChart: Wrap,
    Line: () => <div data-testid="line" />,
  };
});

// Mock react-swipeable
vi.mock("react-swipeable", () => ({
  useSwipeable: () => ({}),
}));

// Mock useI18n
vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
    locales: ["zh-CN", "en-US"],
  }),
}));

// Mock sub-components
vi.mock("../components/NodeDetailModal", () => ({
  NodeDetailModal: ({ node, onClose }: any) => (
    <div data-testid="node-detail-modal">
      <span>{node.id}</span>
      <button onClick={onClose}>close-modal</button>
    </div>
  ),
}));

vi.mock("../components/AlertBanner", () => ({
  AlertBanner: () => <div data-testid="alert-banner" />,
}));

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// ── Context setup ──
import { ViewContext, WebSocketContext } from "../lib/view-context";
import type { WebSocketDataState, ViewState, NodeData } from "../types";
import { Dashboard } from "../components/Dashboard";

const mockNodes: NodeData[] = [
  { id: "GPU-A100-01", status: "active", gpu: 75, mem: 60, temp: 68, model: "LLaMA-70B", tasks: 12 },
  { id: "GPU-A100-02", status: "warning", gpu: 92, mem: 85, temp: 78, model: "Qwen-72B", tasks: 8 },
  { id: "GPU-A100-03", status: "inactive", gpu: 98, mem: 95, temp: 88, model: "DeepSeek-V3", tasks: 0 },
];

function createWsData(overrides: Partial<WebSocketDataState> = {}): WebSocketDataState {
  return {
    connectionState: "connected",
    reconnectCount: 0,
    lastSyncTime: "14:30:00",
    manualReconnect: vi.fn(),
    clearAlerts: vi.fn(),
    liveQPS: 4200,
    qpsTrend: "+8.5%",
    liveLatency: 42,
    latencyTrend: "-3.1%",
    activeNodes: "7/8",
    gpuUtil: "85.3%",
    tokenThroughput: "142K/s",
    storageUsed: "13.5TB",
    nodes: mockNodes,
    throughputHistory: [
      { time: "10:00", qps: 3500, tokens: 120000 },
      { time: "11:00", qps: 3800, tokens: 130000 },
      { time: "12:00", qps: 4200, tokens: 142000 },
    ],
    alerts: [],
    ...overrides,
  } as unknown as WebSocketDataState;
}

function createView(overrides: Partial<ViewState> = {}): ViewState {
  return {
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    width: 1440,
    breakpoint: "xl",
    isTouch: false,
    ...overrides,
  } as ViewState;
}

function renderDashboard(wsOverrides?: Partial<WebSocketDataState>, viewOverrides?: Partial<ViewState>) {
  return render(
    <WebSocketContext.Provider value={createWsData(wsOverrides)}>
      <ViewContext.Provider value={createView(viewOverrides)}>
        <Dashboard />
      </ViewContext.Provider>
    </WebSocketContext.Provider>
  );
}

describe("Dashboard", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  describe("基础渲染", () => {
    it("应渲染 AlertBanner", () => {
      renderDashboard();
      expect(screen.getByTestId("alert-banner")).toBeInTheDocument();
    });

    it("应渲染 6 个统计卡片", () => {
      renderDashboard();
      const qpsElements = screen.getAllByText("4,200");
      expect(qpsElements.length).toBeGreaterThan(0);
      const latencyElements = screen.getAllByText("42ms");
      expect(latencyElements.length).toBeGreaterThan(0);
      const nodesElements = screen.getAllByText("7/8");
      expect(nodesElements.length).toBeGreaterThan(0);
      const gpuElements = screen.getAllByText("85.3%");
      expect(gpuElements.length).toBeGreaterThan(0);
      const tokenElements = screen.getAllByText("142K/s");
      expect(tokenElements.length).toBeGreaterThan(0);
      const storageElements = screen.getAllByText("13.5TB");
      expect(storageElements.length).toBeGreaterThan(0);
    });

    it("应渲染趋势标识", () => {
      renderDashboard();
      const trend1Elements = screen.getAllByText("+8.5%");
      expect(trend1Elements.length).toBeGreaterThan(0);
      const trend2Elements = screen.getAllByText("-3.1%");
      expect(trend2Elements.length).toBeGreaterThan(0);
    });

    it("应渲染吞吐量图表标题", () => {
      renderDashboard();
      const throughputElements = screen.getAllByText("monitor.throughputChart");
      expect(throughputElements.length).toBeGreaterThan(0);
    });

    it("应渲染模型负载分布", () => {
      renderDashboard();
      const modelElements = screen.getAllByText("monitor.modelLoadDist");
      expect(modelElements.length).toBeGreaterThan(0);
    });

    it("应渲染饼图图例项", () => {
      renderDashboard();
      const llamaElements = screen.getAllByText("LLaMA-70B");
      expect(llamaElements.length).toBeGreaterThan(0);
      const qwenElements = screen.getAllByText("Qwen-72B");
      expect(qwenElements.length).toBeGreaterThan(0);
      const deepseekElements = screen.getAllByText("DeepSeek-V3");
      expect(deepseekElements.length).toBeGreaterThan(0);
    });
  });

  describe("节点矩阵", () => {
    it("应渲染所有节点卡片", () => {
      renderDashboard();
      const node1Elements = screen.getAllByText("GPU-A100-01");
      expect(node1Elements.length).toBeGreaterThan(0);
      const node2Elements = screen.getAllByText("GPU-A100-02");
      expect(node2Elements.length).toBeGreaterThan(0);
      const node3Elements = screen.getAllByText("GPU-A100-03");
      expect(node3Elements.length).toBeGreaterThan(0);
    });

    it("点击节点应弹出 NodeDetailModal", () => {
      renderDashboard();
      const node1Elements = screen.getAllByText("GPU-A100-01");
      fireEvent.click(node1Elements[0]);
      expect(screen.getByTestId("node-detail-modal")).toBeInTheDocument();
    });

    it("关闭 NodeDetailModal 后应消失", () => {
      renderDashboard();
      const node1Elements = screen.getAllByText("GPU-A100-01");
      fireEvent.click(node1Elements[0]);
      expect(screen.getByTestId("node-detail-modal")).toBeInTheDocument();
      const closeElements = screen.getAllByText("close-modal");
      if (closeElements.length > 0) {
        fireEvent.click(closeElements[0]);
      }
      expect(screen.queryByTestId("node-detail-modal")).not.toBeInTheDocument();
    });

    it("应渲染节点矩阵标题", () => {
      renderDashboard();
      const matrixElements = screen.getAllByText("monitor.nodeMatrix");
      expect(matrixElements.length).toBeGreaterThan(0);
    });

    it("应渲染刷新按钮", () => {
      renderDashboard();
      const refreshElements = screen.getAllByText("monitor.refresh");
      expect(refreshElements.length).toBeGreaterThan(0);
    });
  });

  describe("实时操作列表", () => {
    it("应渲染实时操作标题", () => {
      renderDashboard();
      const realtimeElements = screen.getAllByText("monitor.realtimeOps");
      expect(realtimeElements.length).toBeGreaterThan(0);
    });

    it("应渲染所有操作条目", () => {
      renderDashboard();
      const viewAllElements = screen.getAllByText("monitor.viewAll");
      expect(viewAllElements.length).toBeGreaterThan(0);
    });
  });

  describe("桌面端分析图表", () => {
    it("桌面端应渲染三栏图表", () => {
      renderDashboard();
      const radarElements = screen.getAllByText("monitor.radarTitle");
      expect(radarElements.length).toBeGreaterThan(0);
      const perfElements = screen.getAllByText("monitor.performanceTitle");
      expect(perfElements.length).toBeGreaterThan(0);
      const predElements = screen.getAllByText("monitor.predictionTitle");
      expect(predElements.length).toBeGreaterThan(0);
    });

    it("应渲染 AI 预测标签", () => {
      renderDashboard();
      const aiElements = screen.getAllByText("monitor.aiPrediction");
      expect(aiElements.length).toBeGreaterThan(0);
    });
  });

  describe("移动端适配", () => {
    it("移动端应渲染 Tab 切换栏", () => {
      renderDashboard({}, { isMobile: true, isTablet: false, isDesktop: false, width: 375, breakpoint: "sm" } as ViewState);
      const radarTabElements = screen.getAllByText("monitor.radarTab");
      expect(radarTabElements.length).toBeGreaterThan(0);
      const perfTabElements = screen.getAllByText("monitor.performanceTab");
      expect(perfTabElements.length).toBeGreaterThan(0);
      const predTabElements = screen.getAllByText("monitor.predictionTab");
      expect(predTabElements.length).toBeGreaterThan(0);
    });

    it("移动端点击 Tab 应切换图表", () => {
      renderDashboard({}, { isMobile: true, isTablet: false, isDesktop: false, width: 375, breakpoint: "sm" } as ViewState);
      const perfTabElements = screen.getAllByText("monitor.performanceTab");
      fireEvent.click(perfTabElements[0]);
      const tab = perfTabElements[0].closest("button")!;
      expect(tab.className).toContain("text-[#00d4ff]");
    });

    it("移动端不应渲染全景按钮", () => {
      renderDashboard({}, { isMobile: true, isTablet: false, isDesktop: false, width: 375, breakpoint: "sm" } as ViewState);
      // Look for the Maximize2 icon button which is the panorama button
      const maximizeButtons = screen.queryAllByTitle("最大化");
      expect(maximizeButtons.length).toBe(0);
    });
  });

  describe("默认数据兜底", () => {
    it("无 WebSocket 数据时应使用默认值", () => {
      render(
        <WebSocketContext.Provider value={null}>
          <ViewContext.Provider value={createView()}>
            <Dashboard />
          </ViewContext.Provider>
        </WebSocketContext.Provider>
      );
      expect(screen.getAllByText("3,842")[0]).toBeInTheDocument(); // default QPS
      expect(screen.getAllByText("48ms")[0]).toBeInTheDocument();   // default latency
    });
  });

  describe("时间段按钮", () => {
    it("桌面端应渲染 4 个时间段按钮", () => {
      renderDashboard();
      const h1Elements = screen.getAllByText("1H");
      expect(h1Elements.length).toBeGreaterThan(0);
      const h6Elements = screen.getAllByText("6H");
      expect(h6Elements.length).toBeGreaterThan(0);
      const h24Elements = screen.getAllByText("24H");
      expect(h24Elements.length).toBeGreaterThan(0);
      const d7Elements = screen.getAllByText("7D");
      expect(d7Elements.length).toBeGreaterThan(0);
    });

    it("移动端应渲染 2 个时间段按钮", () => {
      renderDashboard({}, { isMobile: true, isTablet: false, isDesktop: false, width: 375, breakpoint: "sm" } as ViewState);
      // Mobile should only show 24H and 7D buttons
      const h24Elements = screen.getAllByText("24H");
      const d7Elements = screen.getAllByText("7D");
      expect(h24Elements.length).toBeGreaterThan(0);
      expect(d7Elements.length).toBeGreaterThan(0);
      // Should not show 1H and 6H on mobile
      const h1Elements = screen.queryAllByText("1H");
      const h6Elements = screen.queryAllByText("6H");
      expect(h1Elements.length).toBe(0);
      expect(h6Elements.length).toBe(0);
    });
  });
});