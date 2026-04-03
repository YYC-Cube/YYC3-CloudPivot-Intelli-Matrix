import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, cleanup, waitFor } from "@testing-library/react";
import { usePatrol } from "../hooks/usePatrol";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

// Create a mutable schedule state for mock
let mockSchedule = {
  enabled: true,
  interval: 15,
  lastRun: null as number | null,
  nextRun: Date.now() + 15 * 60 * 1000,
};

// Mock patrol-service
vi.mock("../lib/patrol-service", () => ({
  patrolService: {
    getPatrolHistory: vi.fn().mockResolvedValue([]),
    getSchedule: vi.fn().mockImplementation(() => Promise.resolve({ ...mockSchedule })),
    updateSchedule: vi.fn().mockImplementation((newSchedule: typeof mockSchedule) => {
      mockSchedule = { ...newSchedule };
      return Promise.resolve();
    }),
    runPatrol: vi.fn().mockImplementation((triggeredBy) => 
      Promise.resolve({
        id: `patrol-${Date.now()}`,
        timestamp: Date.now(),
        healthScore: 85,
        checks: [
          { id: "check-1", category: "system", label: "CPU Usage", status: "pass", value: "45%" },
          { id: "check-2", category: "system", label: "Memory", status: "warning", value: "78%" },
        ],
        passCount: 1,
        warningCount: 1,
        criticalCount: 0,
        skippedCount: 0,
        totalChecks: 2,
        triggeredBy: triggeredBy,
      })
    ),
  },
}));

describe("usePatrol", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset mock schedule
    mockSchedule = {
      enabled: true,
      interval: 15,
      lastRun: null,
      nextRun: Date.now() + 15 * 60 * 1000,
    };
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // 初始状态
  // ----------------------------------------------------------

  describe("初始状态", () => {
    it("patrolStatus 应为 idle", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.patrolStatus).toBe("idle");
    });

    it("currentResult 应为 null", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.currentResult).toBeNull();
    });

    it("history 初始为空数组", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.history.length).toBe(0);
    });

    it("schedule 应默认启用，间隔 15 分钟", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.schedule.enabled).toBe(true);
      expect(result.current.schedule.interval).toBe(15);
    });

    it("progress 应为 0", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.progress).toBe(0);
    });

    it("selectedReport 应为 null", () => {
      const { result } = renderHook(() => usePatrol());
      expect(result.current.selectedReport).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // runPatrol
  // ----------------------------------------------------------

  describe("runPatrol", () => {
    it("运行巡查后应产生结果", async () => {
      const { result } = renderHook(() => usePatrol());
      const historyBefore = result.current.history.length;

      await act(async () => {
        await result.current.runPatrol("manual");
      });

      expect(result.current.patrolStatus).toBe("completed");
      expect(result.current.currentResult).not.toBeNull();
      expect(result.current.currentResult!.healthScore).toBeGreaterThan(0);
      expect(result.current.currentResult!.checks.length).toBeGreaterThan(0);
      expect(result.current.currentResult!.triggeredBy).toBe("manual");
      expect(result.current.history.length).toBe(historyBefore + 1);
      expect(result.current.progress).toBe(100);
    });

    it("巡查结果应包含检查项", async () => {
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
      const { result } = renderHook(() => usePatrol());

      await act(async () => {
        await result.current.runPatrol("auto");
      });

      expect(result.current.currentResult!.triggeredBy).toBe("auto");
    });
  });

  // ----------------------------------------------------------
  // toggleAutoPatrol
  // ----------------------------------------------------------

  describe("toggleAutoPatrol", () => {
    it("关闭自动巡查", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.schedule.enabled).toBe(true);
      });
      
      await act(async () => {
        await result.current.toggleAutoPatrol(false);
      });
      await waitFor(() => {
        expect(result.current.schedule.enabled).toBe(false);
      });
      expect(result.current.schedule.nextRun).toBeNull();
    });

    it("开启自动巡查", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.schedule.enabled).toBe(true);
      });
      
      await act(async () => {
        await result.current.toggleAutoPatrol(false);
      });
      await waitFor(() => {
        expect(result.current.schedule.enabled).toBe(false);
      });
      await act(async () => {
        await result.current.toggleAutoPatrol(true);
      });
      await waitFor(() => {
        expect(result.current.schedule.enabled).toBe(true);
      });
      expect(result.current.schedule.nextRun).not.toBeNull();
    });
  });

  // ----------------------------------------------------------
  // updateInterval
  // ----------------------------------------------------------

  describe("updateInterval", () => {
    it("应更新巡查间隔", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.schedule.interval).toBe(15);
      });
      
      await act(async () => {
        await result.current.updateInterval(30);
      });
      await waitFor(() => {
        expect(result.current.schedule.interval).toBe(30);
      });
    });

    it("更新间隔应重新计算 nextRun", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // Wait for initial data load
      await waitFor(() => {
        expect(result.current.schedule.nextRun).toBeDefined();
      });
      
      const before = result.current.schedule.nextRun;
      await act(async () => {
        await result.current.updateInterval(60);
      });
      await waitFor(() => {
        expect(result.current.schedule.nextRun).not.toBe(before);
      });
    });
  });

  // ----------------------------------------------------------
  // viewReport / closeReport
  // ----------------------------------------------------------

  describe("报告查看", () => {
    it("viewReport 应设置 selectedReport", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // First run a patrol to create a result
      await act(async () => {
        await result.current.runPatrol("manual");
      });
      
      const report = result.current.currentResult;
      expect(report).not.toBeNull();
      
      act(() => {
        result.current.viewReport(report!);
      });
      expect(result.current.selectedReport).toEqual(report);
    });

    it("closeReport 应清除 selectedReport", async () => {
      const { result } = renderHook(() => usePatrol());
      
      // First run a patrol to create a result
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
