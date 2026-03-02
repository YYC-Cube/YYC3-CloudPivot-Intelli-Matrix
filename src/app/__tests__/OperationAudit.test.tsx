/**
 * OperationAudit.test.tsx
 * ========================
 * OperationAudit 组件测试
 *
 * 覆盖范围:
 * - 4 个统计卡片渲染
 * - 操作趋势图表标题
 * - 风险分布图表标题
 * - 审计日志表格 (10 条)
 * - 表头渲染
 * - 状态图标映射 (success/running/failed/warning)
 * - 筛选按钮交互
 * - 搜索框渲染
 * - 导出按钮
 * - 分页控件
 * - 详情 Modal 打开/关闭
 * - Modal 中详情字段
 * - 追踪链路/导出报告按钮
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
    locales: ["zh-CN", "en-US"],
  }),
}));

vi.mock("../components/GlassCard", () => ({
  default: ( ({ children, className }: any) => <div className={className}>{children}</div>,
}));

// Mock recharts
vi.mock("recharts", () => {
  const Wrap = ({ children }: any) => <div data-testid="chart">{children}</div>;
  return {
    ResponsiveContainer: Wrap,
    AreaChart: Wrap,
    Area: () => null,
    BarChart: Wrap,
    Bar: ({ children }: any) => <div>{children}</div>,
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

import OperationAudit from "../components/OperationAudit";

describe("OperationAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("统计卡片", () => {
    it("应渲染 4 个统计卡片", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.todayOps")).toBeInTheDocument();
      expect(screen.getByText("audit.abnormalEvents")).toBeInTheDocument();
      expect(screen.getByText("audit.securityEvents")).toBeInTheDocument();
      expect(screen.getByText("audit.activeUsers")).toBeInTheDocument();
    });

    it("应渲染统计数值", () => {
      render(<OperationAudit />);
      expect(screen.getByText("1,284")).toBeInTheDocument();
      expect(screen.getByText("18")).toBeInTheDocument();
    });

    it("应渲染副标签", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.comparedYesterday")).toBeInTheDocument();
      expect(screen.getByText("audit.needProcess")).toBeInTheDocument();
    });
  });

  describe("图表区域", () => {
    it("应渲染操作趋势图表标题", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.opsTrend")).toBeInTheDocument();
    });

    it("应渲染风险分布图表标题", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.riskDist")).toBeInTheDocument();
    });
  });

  describe("审计日志表格", () => {
    it("应渲染审计日志标题", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.auditLog")).toBeInTheDocument();
    });

    it("应渲染表头列", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.colStatus")).toBeInTheDocument();
      expect(screen.getByText("audit.colAuditId")).toBeInTheDocument();
      expect(screen.getByText("audit.colTime")).toBeInTheDocument();
      expect(screen.getByText("audit.colUser")).toBeInTheDocument();
      expect(screen.getByText("audit.colRole")).toBeInTheDocument();
      expect(screen.getByText("audit.colAction")).toBeInTheDocument();
      expect(screen.getByText("audit.colTarget")).toBeInTheDocument();
      expect(screen.getByText("audit.colIp")).toBeInTheDocument();
      expect(screen.getByText("audit.colRisk")).toBeInTheDocument();
    });

    it("应渲染 10 条审计日志", () => {
      render(<OperationAudit />);
      expect(screen.getByText("AUD-20260222-0001")).toBeInTheDocument();
      expect(screen.getByText("AUD-20260222-0005")).toBeInTheDocument();
      expect(screen.getByText("AUD-20260222-0010")).toBeInTheDocument();
    });

    it("应渲染操作类型", () => {
      render(<OperationAudit />);
      expect(screen.getByText("模型部署")).toBeInTheDocument();
      expect(screen.getByText("节点重启")).toBeInTheDocument();
      expect(screen.getByText("数据迁移")).toBeInTheDocument();
    });

    it("应渲染风险等级标签", () => {
      render(<OperationAudit />);
      expect(screen.getAllByText("audit.riskLow").length).toBeGreaterThan(0);
      expect(screen.getAllByText("audit.riskMedium").length).toBeGreaterThan(0);
      expect(screen.getAllByText("audit.riskHigh").length).toBeGreaterThan(0);
    });

    it("应渲染 IP 地址", () => {
      render(<OperationAudit />);
      const ip1Elements = screen.getAllByText("192.168.1.100");
      const ip2Elements = screen.getAllByText("203.0.113.45");
      expect(ip1Elements.length).toBeGreaterThan(0);
      expect(ip2Elements.length).toBeGreaterThan(0);
    });
  });

  describe("筛选按钮", () => {
    it("应渲染 4 个筛选按钮", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.filterAll")).toBeInTheDocument();
      expect(screen.getByText("audit.filterSuccess")).toBeInTheDocument();
      expect(screen.getByText("audit.filterAbnormal")).toBeInTheDocument();
      expect(screen.getByText("audit.filterAlert")).toBeInTheDocument();
    });

    it("默认选中全部", () => {
      render(<OperationAudit />);
      const allBtn = screen.getByText("audit.filterAll").closest("button")!;
      expect(allBtn.className).toContain("text-[#00d4ff]");
    });

    it("点击筛选按钮应切换激活状态", () => {
      render(<OperationAudit />);
      fireEvent.click(screen.getByText("audit.filterSuccess"));
      const successBtn = screen.getByText("audit.filterSuccess").closest("button")!;
      expect(successBtn.className).toContain("text-[#00d4ff]");
      // "全部" should no longer be active
      const allBtn = screen.getByText("audit.filterAll").closest("button")!;
      expect(allBtn.className).not.toContain("bg-[rgba(0,212,255,0.12)]");
    });
  });

  describe("搜索与导出", () => {
    it("应渲染搜索框", () => {
      render(<OperationAudit />);
      expect(screen.getByPlaceholderText("audit.searchLog")).toBeInTheDocument();
    });

    it("应渲染导出按钮", () => {
      render(<OperationAudit />);
      expect(screen.getByText("audit.export")).toBeInTheDocument();
    });
  });

  describe("分页", () => {
    it("应渲染总记录数", () => {
      render(<OperationAudit />);
      expect(screen.getByText(/1,284/)).toBeInTheDocument();
    });

    it("应渲染分页页码", () => {
      render(<OperationAudit />);
      const page1Elements = screen.getAllByText("1");
      const page2Elements = screen.getAllByText("2");
      const page3Elements = screen.getAllByText("3");
      const page128Elements = screen.getAllByText("128");
      expect(page1Elements.length).toBeGreaterThan(0);
      expect(page2Elements.length).toBeGreaterThan(0);
      expect(page3Elements.length).toBeGreaterThan(0);
      expect(page128Elements.length).toBeGreaterThan(0);
    });

    it("第一页应高亮", () => {
      render(<OperationAudit />);
      const page1 = screen.getByText("1").closest("button")!;
      expect(page1.className).toContain("text-[#00d4ff]");
    });
  });

  describe("详情 Modal", () => {
    it("点击日志行应打开详情 Modal", () => {
      render(<OperationAudit />);
      const row = screen.getByText("AUD-20260222-0001").closest("tr")!;
      fireEvent.click(row);
      expect(screen.getByText("audit.detailTitle")).toBeInTheDocument();
    });

    it("Modal 应显示详情字段", () => {
      render(<OperationAudit />);
      const row = screen.getByText("AUD-20260222-0001").closest("tr")!;
      fireEvent.click(row);
      expect(screen.getByText("audit.fieldAuditId")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldTime")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldUser")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldRole")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldAction")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldTarget")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldIp")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldStatus")).toBeInTheDocument();
      expect(screen.getByText("audit.fieldRisk")).toBeInTheDocument();
    });

    it("Modal 应显示追踪链路和导出按钮", () => {
      render(<OperationAudit />);
      const row = screen.getByText("AUD-20260222-0001").closest("tr")!;
      fireEvent.click(row);
      expect(screen.getByText("audit.traceLink")).toBeInTheDocument();
      expect(screen.getByText("audit.exportReport")).toBeInTheDocument();
    });

    it("关闭按钮应关闭 Modal", () => {
      render(<OperationAudit />);
      const row = screen.getByText("AUD-20260222-0001").closest("tr")!;
      fireEvent.click(row);
      expect(screen.getByText("audit.detailTitle")).toBeInTheDocument();
      // Close button
      const closeBtn = screen.getByText("audit.detailTitle").parentElement?.querySelector("button");
      if (closeBtn) {
        fireEvent.click(closeBtn);
        expect(screen.queryByText("audit.detailTitle")).not.toBeInTheDocument();
      }
    });

    it("点击遮罩应关闭 Modal", () => {
      render(<OperationAudit />);
      const row = screen.getByText("AUD-20260222-0001").closest("tr")!;
      fireEvent.click(row);
      const modalOuter = screen.getByText("audit.detailTitle").closest(".fixed");
      if (modalOuter) {
        fireEvent.click(modalOuter);
        expect(screen.queryByText("audit.detailTitle")).not.toBeInTheDocument();
      }
    });

    it("不同状态日志 Modal 应显示对应状态文本", () => {
      render(<OperationAudit />);
      // Click failed log
      const row = screen.getByText("AUD-20260222-0010").closest("tr")!;
      fireEvent.click(row);
      expect(screen.getByText("audit.statusFailed")).toBeInTheDocument();
      expect(screen.getByText("audit.riskHighFull")).toBeInTheDocument();
    });
  });
});
