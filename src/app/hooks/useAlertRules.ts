/**
 * useAlertRules.ts
 * =================
 * Hook for Smart Alert Rules Configuration
 * Supports custom thresholds, aggregation, deduplication, escalation
 */

import { useState, useCallback } from "react";

// ============================================================
// Types
// ============================================================

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertMetric = "cpu" | "gpu" | "memory" | "latency" | "disk" | "network" | "error_rate" | "throughput";
export type AlertCondition = "gt" | "lt" | "gte" | "lte" | "eq" | "neq";
export type EscalationLevel = 1 | 2 | 3;

export interface AlertThreshold {
  metric: AlertMetric;
  condition: AlertCondition;
  value: number;
  unit: string;
  duration: number;
}

export interface EscalationPolicy {
  level: EscalationLevel;
  delayMinutes: number;
  notifyChannels: string[];
  autoAction?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: AlertSeverity;
  thresholds: AlertThreshold[];
  aggregation: {
    enabled: boolean;
    windowMinutes: number;
    maxGroupSize: number;
  };
  deduplication: {
    enabled: boolean;
    cooldownMinutes: number;
  };
  escalation: EscalationPolicy[];
  targets: string[];
  createdAt: number;
  lastTriggered: number | null;
  triggerCount: number;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  metric: AlertMetric;
  currentValue: number;
  threshold: number;
  nodeId: string;
  timestamp: number;
  acknowledged: boolean;
  resolved: boolean;
  escalationLevel: EscalationLevel;
}

const MOCK_RULES: AlertRule[] = [
  {
    id: "rule-001",
    name: "GPU 利用率过高",
    enabled: true,
    severity: "critical",
    thresholds: [
      { metric: "gpu", condition: "gt", value: 95, unit: "%", duration: 300 },
    ],
    aggregation: { enabled: true, windowMinutes: 5, maxGroupSize: 10 },
    deduplication: { enabled: true, cooldownMinutes: 15 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"], autoAction: "auto_scale_check" },
      { level: 2, delayMinutes: 10, notifyChannels: ["dashboard", "email"], autoAction: "auto_scale_up" },
      { level: 3, delayMinutes: 30, notifyChannels: ["dashboard", "email", "sms"], autoAction: "force_rebalance" },
    ],
    targets: ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03"],
    createdAt: Date.now() - 86400000 * 7,
    lastTriggered: Date.now() - 3600000,
    triggerCount: 23,
  },
  {
    id: "rule-002",
    name: "推理延迟异常",
    enabled: true,
    severity: "warning",
    thresholds: [
      { metric: "latency", condition: "gt", value: 2000, unit: "ms", duration: 60 },
    ],
    aggregation: { enabled: true, windowMinutes: 3, maxGroupSize: 5 },
    deduplication: { enabled: true, cooldownMinutes: 10 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"] },
      { level: 2, delayMinutes: 15, notifyChannels: ["dashboard", "email"] },
    ],
    targets: ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03", "GPU-A100-04"],
    createdAt: Date.now() - 86400000 * 5,
    lastTriggered: Date.now() - 7200000,
    triggerCount: 45,
  },
  {
    id: "rule-003",
    name: "磁盘空间不足",
    enabled: true,
    severity: "warning",
    thresholds: [
      { metric: "disk", condition: "gt", value: 85, unit: "%", duration: 0 },
    ],
    aggregation: { enabled: false, windowMinutes: 0, maxGroupSize: 0 },
    deduplication: { enabled: true, cooldownMinutes: 60 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"] },
    ],
    targets: ["NAS-01", "NAS-02"],
    createdAt: Date.now() - 86400000 * 3,
    lastTriggered: Date.now() - 86400000,
    triggerCount: 8,
  },
  {
    id: "rule-004",
    name: "内存使用率过高",
    enabled: false,
    severity: "critical",
    thresholds: [
      { metric: "memory", condition: "gt", value: 90, unit: "%", duration: 120 },
    ],
    aggregation: { enabled: true, windowMinutes: 5, maxGroupSize: 10 },
    deduplication: { enabled: true, cooldownMinutes: 20 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"] },
      { level: 2, delayMinutes: 5, notifyChannels: ["dashboard", "email"], autoAction: "restart_service" },
    ],
    targets: ["GPU-A100-01", "GPU-A100-02"],
    createdAt: Date.now() - 86400000 * 2,
    lastTriggered: null,
    triggerCount: 0,
  },
  {
    id: "rule-005",
    name: "错误率飙升",
    enabled: true,
    severity: "critical",
    thresholds: [
      { metric: "error_rate", condition: "gt", value: 5, unit: "%", duration: 60 },
    ],
    aggregation: { enabled: true, windowMinutes: 10, maxGroupSize: 20 },
    deduplication: { enabled: true, cooldownMinutes: 30 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"], autoAction: "log_capture" },
      { level: 2, delayMinutes: 5, notifyChannels: ["dashboard", "email"], autoAction: "circuit_breaker" },
      { level: 3, delayMinutes: 15, notifyChannels: ["dashboard", "email", "sms"], autoAction: "rollback" },
    ],
    targets: ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03"],
    createdAt: Date.now() - 86400000,
    lastTriggered: Date.now() - 1800000,
    triggerCount: 12,
  },
  {
    id: "rule-006",
    name: "网络延迟异常",
    enabled: true,
    severity: "info",
    thresholds: [
      { metric: "network", condition: "gt", value: 100, unit: "ms", duration: 30 },
    ],
    aggregation: { enabled: false, windowMinutes: 0, maxGroupSize: 0 },
    deduplication: { enabled: true, cooldownMinutes: 5 },
    escalation: [
      { level: 1, delayMinutes: 0, notifyChannels: ["dashboard"] },
    ],
    targets: ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03", "GPU-A100-04", "GPU-A100-05"],
    createdAt: Date.now() - 3600000 * 12,
    lastTriggered: Date.now() - 600000,
    triggerCount: 67,
  },
];

const MOCK_EVENTS: AlertEvent[] = [
  {
    id: "evt-001",
    ruleId: "rule-001",
    ruleName: "GPU 利用率过高",
    severity: "critical",
    message: "GPU-A100-03 利用率达到 98.2%，持续 5 分钟",
    metric: "gpu",
    currentValue: 98.2,
    threshold: 95,
    nodeId: "GPU-A100-03",
    timestamp: Date.now() - 300000,
    acknowledged: false,
    resolved: false,
    escalationLevel: 2,
  },
  {
    id: "evt-002",
    ruleId: "rule-002",
    ruleName: "推理延迟异常",
    severity: "warning",
    message: "GPU-A100-01 推理延迟 2,450ms > 2,000ms",
    metric: "latency",
    currentValue: 2450,
    threshold: 2000,
    nodeId: "GPU-A100-01",
    timestamp: Date.now() - 900000,
    acknowledged: true,
    resolved: false,
    escalationLevel: 1,
  },
  {
    id: "evt-003",
    ruleId: "rule-005",
    ruleName: "错误率飙升",
    severity: "critical",
    message: "GPU-A100-02 错误率达到 7.3%，已触发熔断",
    metric: "error_rate",
    currentValue: 7.3,
    threshold: 5,
    nodeId: "GPU-A100-02",
    timestamp: Date.now() - 1800000,
    acknowledged: true,
    resolved: true,
    escalationLevel: 2,
  },
  {
    id: "evt-004",
    ruleId: "rule-006",
    ruleName: "网络延迟异常",
    severity: "info",
    message: "GPU-A100-04 网络延迟 145ms > 100ms",
    metric: "network",
    currentValue: 145,
    threshold: 100,
    nodeId: "GPU-A100-04",
    timestamp: Date.now() - 600000,
    acknowledged: false,
    resolved: false,
    escalationLevel: 1,
  },
  {
    id: "evt-005",
    ruleId: "rule-003",
    ruleName: "磁盘空间不足",
    severity: "warning",
    message: "NAS-01 磁盘使用率 87.5% > 85%",
    metric: "disk",
    currentValue: 87.5,
    threshold: 85,
    nodeId: "NAS-01",
    timestamp: Date.now() - 3600000,
    acknowledged: true,
    resolved: false,
    escalationLevel: 1,
  },
];

export function useAlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(MOCK_RULES);
  const [events, setEvents] = useState<AlertEvent[]>(MOCK_EVENTS);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | "all">("all");

  const toggleRule = useCallback((ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const deleteRule = useCallback((ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    if (selectedRule?.id === ruleId) {setSelectedRule(null);}
  }, [selectedRule]);

  const acknowledgeEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e))
    );
  }, []);

  const resolveEvent = useCallback((eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, resolved: true, acknowledged: true } : e))
    );
  }, []);

  const createRule = useCallback((rule: Omit<AlertRule, "id" | "createdAt" | "lastTriggered" | "triggerCount">) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${String(Date.now()).slice(-6)}`,
      createdAt: Date.now(),
      lastTriggered: null,
      triggerCount: 0,
    };
    setRules((prev) => [newRule, ...prev]);
    setIsCreating(false);
  }, []);

  const filteredRules = filterSeverity === "all"
    ? rules
    : rules.filter((r) => r.severity === filterSeverity);

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter((r) => r.enabled).length,
    unresolvedEvents: events.filter((e) => !e.resolved).length,
    criticalEvents: events.filter((e) => e.severity === "critical" && !e.resolved).length,
  };

  return {
    rules: filteredRules,
    events,
    selectedRule,
    setSelectedRule,
    isCreating,
    setIsCreating,
    filterSeverity,
    setFilterSeverity,
    toggleRule,
    deleteRule,
    acknowledgeEvent,
    resolveEvent,
    createRule,
    stats,
  };
}
