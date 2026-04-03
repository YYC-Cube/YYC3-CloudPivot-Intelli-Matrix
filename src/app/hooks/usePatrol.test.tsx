// @vitest-environment jsdom
/**
 * usePatrol.test.tsx
 * =========
 * usePatrol Hook - 巡查模式状态管理测试 (jsdom 环境)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../lib/patrol-service", () => ({
  patrolService: {
    getPatrolHistory: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockResolvedValue({
      enabled: true,
      interval: 15,
      lastRun: null,
      nextRun: Date.now() + 15 * 60 * 1000,
    }),
    runPatrol: vi.fn().mockResolvedValue({
      id: "patrol-1",
      triggeredBy: "manual",
      healthScore: 95,
      totalChecks: 10,
      passCount: 9,
      warningCount: 1,
      criticalCount: 0,
      skippedCount: 0,
      checks: [
        { id: "check-1", category: "system", label: "CPU", status: "pass", value: "45%" },
        { id: "check-2", category: "system", label: "Memory", status: "pass", value: "60%" },
      ],
      timestamp: Date.now(),
    }),
    updateSchedule: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("./usePersistedState", () => ({
  usePersistedList: () => ({
    items: [],
    setItems: vi.fn(),
    prepend: vi.fn((item: any) => {
      return [item];
    }),
  }),
}));

describe("usePatrol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("初始状态", () => {
    it("patrolStatus 应为 idle", () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());
      expect(result.current.patrolStatus).toBe("idle");
    });

    it("currentResult 应为 null", () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());
      expect(result.current.currentResult).toBeNull();
    });

    it("progress 应为 0", () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());
      expect(result.current.progress).toBe(0);
    });

    it("selectedReport 应为 null", () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());
      expect(result.current.selectedReport).toBeNull();
    });
  });

  describe("runPatrol", () => {
    it("运行巡查后应产生结果", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      expect(result.current.patrolStatus).toBe("completed");
      expect(result.current.currentResult).not.toBeNull();
      expect(result.current.currentResult!.healthScore).toBeGreaterThan(0);
      expect(result.current.progress).toBe(100);
    });

    it("巡查结果应包含检查项", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      const checks = result.current.currentResult!.checks;
      expect(checks.length).toBeGreaterThan(0);
      expect(checks[0]).toHaveProperty("id");
      expect(checks[0]).toHaveProperty("category");
      expect(checks[0]).toHaveProperty("label");
      expect(checks[0]).toHaveProperty("status");
      expect(checks[0]).toHaveProperty("value");
    });

    it("巡查结果应正确统计各状态数", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      const r = result.current.currentResult!;
      expect(r.passCount + r.warningCount + r.criticalCount + r.skippedCount).toBe(
        r.totalChecks
      );
    });

    it("auto 触发类型应正确记录", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("auto");
      });

      expect(result.current.currentResult!.triggeredBy).toBe("auto");
    });
  });

  describe("报告查看", () => {
    it("viewReport 应设置 selectedReport", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      const report = result.current.currentResult!;
      act(() => {
        result.current.viewReport(report);
      });
      expect(result.current.selectedReport).toEqual(report);
    });

    it("closeReport 应清除 selectedReport", async () => {
      const { usePatrol } = require("./usePatrol");
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      const report = result.current.currentResult!;
      act(() => {
        result.current.viewReport(report);
      });
      act(() => {
        result.current.closeReport();
      });
      expect(result.current.selectedReport).toBeNull();
    });
  });
});
