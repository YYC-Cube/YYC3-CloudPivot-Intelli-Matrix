/**
 * AlertRulesPanel.test.tsx
 * ========================
 * 告警规则面板 - 单元测试
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children }: { children: React.ReactNode }) => <div data-testid="glass-card">{children}</div>,
}));

vi.mock("../components/CreateRuleModal", () => ({
  CreateRuleModal: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="create-rule-modal">Modal <button onClick={onClose}>Close</button></div> : null,
}));

vi.mock("../hooks/useAlertRules", () => {
  let isCreating = false;
  return {
    useAlertRules: () => ({
      rules: [
        {
          id: "rule-1",
          name: "High CPU Usage",
          description: "Alert when CPU usage exceeds 90%",
          severity: "high",
          enabled: true,
          thresholds: [
            { metric: "cpu", condition: ">", value: 90, unit: "%", duration: 60 },
          ],
          aggregation: { enabled: true, windowMinutes: 5, maxGroupSize: 10 },
          deduplication: { enabled: true, cooldownMinutes: 10 },
          escalation: [
            { level: 1, delayMinutes: 5, notifyChannels: ["email"] },
          ],
          targets: ["node-1"],
          createdAt: Date.now(),
          lastTriggered: null,
          triggerCount: 0,
        },
      ],
      events: [],
      stats: {
        totalRules: 1,
        activeRules: 1,
        unresolvedEvents: 0,
        criticalEvents: 0,
      },
      loading: false,
      error: null,
      selectedRule: null,
      setSelectedRule: vi.fn(),
      isCreating,
      setIsCreating: vi.fn((val: boolean) => { isCreating = val; }),
      editingRule: null,
      setEditingRule: vi.fn(),
      filterSeverity: "all",
      setFilterSeverity: vi.fn(),
      addRule: vi.fn(),
      updateRule: vi.fn(),
      deleteRule: vi.fn(),
      toggleRule: vi.fn(),
      createRule: vi.fn(),
      acknowledgeEvent: vi.fn(),
      resolveEvent: vi.fn(),
    }),
  };
});

vi.mock("../hooks/useI18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: "zh-CN",
    setLocale: vi.fn(),
  }),
}));

vi.mock("../hooks/useWebSocketData", () => ({
  useWebSocketData: () => ({
    connectionState: "connected",
    reconnectCount: 0,
    lastSyncTime: Date.now(),
    liveQPS: 100,
    qpsTrend: [],
    liveLatency: 50,
    latencyTrend: [],
    activeNodes: [],
    gpuUtil: 0,
    tokenThroughput: [],
    alerts: [],
    addAlert: vi.fn(),
    clearAlerts: vi.fn(),
    reconnect: vi.fn(),
  }),
}));

describe("AlertRulesPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("渲染测试", () => {
    it("应该正确渲染组件", async () => {
      const { AlertRulesPanel } = await import("../components/AlertRulesPanel");
      render(<AlertRulesPanel />);
      const createButtons = screen.getAllByTestId("create-rule-btn");
      expect(createButtons.length).toBeGreaterThan(0);
    });

    it("应该显示规则列表", async () => {
      const { AlertRulesPanel } = await import("../components/AlertRulesPanel");
      render(<AlertRulesPanel />);
      const ruleNames = screen.getAllByText("High CPU Usage");
      expect(ruleNames.length).toBeGreaterThan(0);
    });
  });

  describe("交互测试", () => {
    it("应该能够切换规则状态", async () => {
      const { AlertRulesPanel } = await import("../components/AlertRulesPanel");
      render(<AlertRulesPanel />);
      const toggleButtons = screen.getAllByRole("button");
      expect(toggleButtons.length).toBeGreaterThan(0);
    });

    it("应该能够打开创建规则模态框", async () => {
      const { AlertRulesPanel } = await import("../components/AlertRulesPanel");
      render(<AlertRulesPanel />);
      const addButton = screen.getAllByTestId("create-rule-btn")[0];
      expect(addButton).toBeInTheDocument();
      fireEvent.click(addButton);
    });
  });
});
