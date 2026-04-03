// @vitest-environment jsdom
/**
 * useSecurityMonitor.test.tsx
 * ============================
 * useSecurityMonitor Hook - 安全监控状态管理测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSecurityMonitor } from "../hooks/useSecurityMonitor";

describe("useSecurityMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("initializes with idle state", () => {
    const { result } = renderHook(() => useSecurityMonitor());
    expect(result.current.scanStatus).toBe("idle");
    expect(result.current.activeTab).toBe("security");
    expect(result.current.lastScanTime).toBeNull();
    expect(result.current.csp).toBeNull();
    expect(result.current.cookie).toBeNull();
    expect(result.current.sensitive).toBeNull();
    expect(result.current.performance).toBeNull();
    expect(result.current.memory).toBeNull();
    expect(result.current.vitals).toEqual([]);
    expect(result.current.device).toBeNull();
    expect(result.current.network).toBeNull();
    expect(result.current.browser).toBeNull();
    expect(result.current.dataManagement).toBeNull();
  });

  it("switches active tab", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.setActiveTab("performance");
    });
    expect(result.current.activeTab).toBe("performance");

    act(() => {
      result.current.setActiveTab("diagnostics");
    });
    expect(result.current.activeTab).toBe("diagnostics");

    act(() => {
      result.current.setActiveTab("dataManagement");
    });
    expect(result.current.activeTab).toBe("dataManagement");
  });

  it("starts scan and transitions to scanning state", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    expect(result.current.scanStatus).toBe("scanning");
  });

  it("completes scan after timeout", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    expect(result.current.scanStatus).toBe("scanning");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.scanStatus).toBe("complete");
    expect(result.current.lastScanTime).not.toBeNull();
  });

  it("populates all result fields after scan", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.csp).not.toBeNull();
    expect(result.current.cookie).not.toBeNull();
    expect(result.current.sensitive).not.toBeNull();
    expect(result.current.performance).not.toBeNull();
    expect(result.current.memory).not.toBeNull();
    expect(result.current.vitals.length).toBeGreaterThan(0);
    expect(result.current.device).not.toBeNull();
    expect(result.current.network).not.toBeNull();
    expect(result.current.browser).not.toBeNull();
    expect(result.current.dataManagement).not.toBeNull();
  });

  it("calculates overall score", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.overallScore).toBeDefined();
    expect(result.current.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.current.overallScore).toBeLessThanOrEqual(100);
  });

  it("cleanupData handles expired items", async () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await result.current.cleanupData("expired");
    });
    expect(result.current.dataManagement!.expiredItems).toBe(0);
  });

  it("cleanupData clears cache", async () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await result.current.cleanupData("cache");
    });
    expect(result.current.dataManagement!.cacheSize).toBe(0);
  });

  it("cleanupData handles privacy cleanup", async () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await result.current.cleanupData("privacy");
    });
    expect(result.current.dataManagement!.privacyCleaned).toBe(true);
  });

  it("CSP mock has valid structure", () => {
    const { result } = renderHook(() => useSecurityMonitor());

    act(() => {
      result.current.startScan();
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const csp = result.current.csp!;
    expect(csp).toHaveProperty("score");
    expect(csp).toHaveProperty("directives");
    expect(csp).toHaveProperty("recommendations");
    expect(csp.score).toBeGreaterThanOrEqual(0);
    expect(csp.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(csp.directives)).toBe(true);
    expect(Array.isArray(csp.recommendations)).toBe(true);
  });
});
