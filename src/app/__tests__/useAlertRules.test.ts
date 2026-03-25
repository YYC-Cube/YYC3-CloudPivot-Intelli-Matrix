import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAlertRules } from "../hooks/useAlertRules";
import type { AlertSeverity, AlertMetric, AlertCondition, EscalationLevel, EscalationPolicy } from "../types";

describe("useAlertRules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with mock rules", () => {
    const { result } = renderHook(() => useAlertRules());
    
    expect(result.current.rules).toBeDefined();
    expect(Array.isArray(result.current.rules)).toBe(true);
    expect(result.current.rules.length).toBeGreaterThan(0);
  });

  it("should initialize with mock events", () => {
    const { result } = renderHook(() => useAlertRules());
    
    expect(result.current.events).toBeDefined();
    expect(Array.isArray(result.current.events)).toBe(true);
  });

  it("should toggle rule enabled status", async () => {
    const { result } = renderHook(() => useAlertRules());
    const firstRule = result.current.rules[0];
    const originalEnabled = firstRule.enabled;
    
    await act(async () => {
      await result.current.toggleRule(firstRule.id);
    });

    await waitFor(() => {
      const updatedRule = result.current.rules.find((r) => r.id === firstRule.id);
      expect(updatedRule?.enabled).toBe(!originalEnabled);
    });
  });

  it("should delete rule", async () => {
    const { result } = renderHook(() => useAlertRules());
    const firstRule = result.current.rules[0];
    const initialLength = result.current.rules.length;
    
    await act(async () => {
      await result.current.deleteRule(firstRule.id);
    });

    await waitFor(() => {
      expect(result.current.rules.length).toBe(initialLength - 1);
      expect(result.current.rules.find((r) => r.id === firstRule.id)).toBeUndefined();
    });
  });

  it("should acknowledge event", async () => {
    const { result } = renderHook(() => useAlertRules());
    const firstEvent = result.current.events[0];
    
    await act(async () => {
      await result.current.acknowledgeEvent(firstEvent.id);
    });

    await waitFor(() => {
      const updatedEvent = result.current.events.find((e) => e.id === firstEvent.id);
      expect(updatedEvent?.acknowledged).toBe(true);
    });
  });

  it("should resolve event", async () => {
    const { result } = renderHook(() => useAlertRules());
    const firstEvent = result.current.events[0];
    
    await act(async () => {
      await result.current.resolveEvent(firstEvent.id);
    });

    await waitFor(() => {
      const updatedEvent = result.current.events.find((e) => e.id === firstEvent.id);
      expect(updatedEvent?.resolved).toBe(true);
    });
  });

  it("should create new rule", async () => {
    const { result } = renderHook(() => useAlertRules());
    const initialLength = result.current.rules.length;
    
    const newRule = {
      name: "Test Rule",
      enabled: true,
      severity: "warning" as AlertSeverity,
      thresholds: [
        {
          metric: "cpu" as AlertMetric,
          condition: "gt" as AlertCondition,
          value: 80,
          unit: "%",
          duration: 60,
        },
      ],
      aggregation: {
        enabled: true,
        windowMinutes: 5,
        maxGroupSize: 10,
      },
      deduplication: {
        enabled: true,
        cooldownMinutes: 15,
      },
      escalation: [
        {
          level: 1 as EscalationLevel,
          delayMinutes: 0,
          notifyChannels: ["dashboard"],
        },
      ] as EscalationPolicy[],
      targets: ["node-1"],
    };

    await act(async () => {
      await result.current.createRule(newRule);
    });

    await waitFor(() => {
      expect(result.current.rules.length).toBe(initialLength + 1);
    });
  });

  it("should filter events by severity", async () => {
    const { result } = renderHook(() => useAlertRules());
    
    await act(async () => {
      result.current.setFilterSeverity("critical");
    });

    await waitFor(() => {
      expect(result.current.filterSeverity).toBe("critical");
    });
  });

  it("should calculate stats correctly", () => {
    const { result } = renderHook(() => useAlertRules());
    
    expect(result.current.stats).toBeDefined();
    expect(typeof result.current.stats.totalRules).toBe("number");
    expect(typeof result.current.stats.activeRules).toBe("number");
    expect(typeof result.current.stats.unresolvedEvents).toBe("number");
    expect(typeof result.current.stats.criticalEvents).toBe("number");
  });

  it("should select rule", () => {
    const { result } = renderHook(() => useAlertRules());
    const firstRule = result.current.rules[0];
    
    act(() => {
      result.current.setSelectedRule(firstRule);
    });

    expect(result.current.selectedRule).toBe(firstRule);
  });

  it("should set creating state", () => {
    const { result } = renderHook(() => useAlertRules());
    
    act(() => {
      result.current.setIsCreating(true);
    });

    expect(result.current.isCreating).toBe(true);
  });
});
