import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useAIDiagnostics } from "../hooks/useAIDiagnostics";

describe("useAIDiagnostics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("should initialize with idle status", () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [],
      liveQPS: 0,
      liveLatency: 0,
    }));

    expect(result.current.status).toBe("idle");
    expect(result.current.session).toBeNull();
  });

  it("should start diagnosis", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [
        {
          id: "node-1",
          gpu: 85,
          mem: 60,
          temp: 45,
          status: "online",
        },
      ],
      liveQPS: 1000,
      liveLatency: 120,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    expect(result.current.status).toBe("analyzing");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");
    expect(result.current.session).not.toBeNull();
  });

  it("should detect patterns", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [
        {
          id: "node-1",
          gpu: 95,
          mem: 70,
          temp: 60,
          status: "online",
        },
      ],
      liveQPS: 1500,
      liveLatency: 200,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");

    expect(result.current.session?.patterns).toBeDefined();
    expect(result.current.session?.patterns.length).toBeGreaterThan(0);
  });

  it("should detect anomalies", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [
        {
          id: "node-1",
          gpu: 98,
          mem: 90,
          temp: 75,
          status: "degraded",
        },
      ],
      liveQPS: 500,
      liveLatency: 500,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");

    expect(result.current.session?.anomalies).toBeDefined();
    expect(result.current.session?.anomalies.length).toBeGreaterThan(0);
  });

  it("should generate suggested actions", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [
        {
          id: "node-1",
          gpu: 98,
          mem: 90,
          temp: 75,
          status: "degraded",
        },
      ],
      liveQPS: 500,
      liveLatency: 500,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");

    expect(result.current.session?.actions).toBeDefined();
    expect(result.current.session?.actions.length).toBeGreaterThan(0);
  });

  it("should generate predictive forecasts", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [
        {
          id: "node-1",
          gpu: 85,
          mem: 60,
          temp: 45,
          status: "online",
        },
      ],
      liveQPS: 1000,
      liveLatency: 120,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");

    expect(result.current.session?.forecasts).toBeDefined();
    expect(result.current.session?.forecasts.length).toBeGreaterThan(0);
  });

  it("should execute action", async () => {
    const { result } = renderHook(() => useAIDiagnostics({
      liveNodes: [],
      liveQPS: 0,
      liveLatency: 0,
    }));

    act(() => {
      result.current.startDiagnosis();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.status).toBe("complete");

    if (result.current.session?.actions && result.current.session.actions.length > 0) {
      const firstAction = result.current.session.actions[0];

      act(() => {
        result.current.executeAction(firstAction.id);
      });

      expect(result.current.executingAction).toBe(firstAction.id);

      act(() => {
        vi.advanceTimersByTime(2500);
      });

      expect(result.current.executingAction).toBeNull();
    }
  });
});
