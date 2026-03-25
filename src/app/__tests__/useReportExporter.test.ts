import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useReportExporter } from "../hooks/useReportExporter";

describe("useReportExporter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useReportExporter());
    
    expect(result.current.reportType).toBe("performance");
    expect(result.current.timeRange).toBe("24h");
    expect(result.current.isGenerating).toBe(false);
    expect(result.current.report).toBeNull();
  });

  it("should set report type", () => {
    const { result } = renderHook(() => useReportExporter());
    
    act(() => {
      result.current.setReportType("security");
    });

    expect(result.current.reportType).toBe("security");
  });

  it("should set time range", () => {
    const { result } = renderHook(() => useReportExporter());
    
    act(() => {
      result.current.setTimeRange("7d");
    });

    expect(result.current.timeRange).toBe("7d");
  });

  it("should generate report", () => {
    const { result } = renderHook(() => useReportExporter());
    
    act(() => {
      result.current.generateReport();
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.report).not.toBeNull();
  });

  it("should have recent reports", () => {
    const { result } = renderHook(() => useReportExporter());
    
    expect(result.current.recentReports).toBeDefined();
    expect(Array.isArray(result.current.recentReports)).toBe(true);
    expect(result.current.recentReports.length).toBeGreaterThan(0);
  });
});
