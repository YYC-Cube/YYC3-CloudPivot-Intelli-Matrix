/**
 * usePatrol.ts
 * ==============
 * 巡查模式 状态管理 Hook
 * 管理巡查结果、巡查历史、巡查计划、手动/自动巡查
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

// ============================================================
// Types
// ============================================================

export type PatrolStatus = "idle" | "running" | "completed" | "failed";
export type CheckStatus = "pass" | "warning" | "critical" | "skipped";
export type PatrolInterval = 5 | 10 | 15 | 30 | 60;

export interface PatrolCheckItem {
  id: string;
  category: string;
  label: string;
  status: CheckStatus;
  value: string;
  threshold?: string;
  detail?: string;
}

export interface PatrolResult {
  id: string;
  timestamp: number;
  duration: number;          // seconds
  status: PatrolStatus;
  healthScore: number;       // 0-100
  totalChecks: number;
  passCount: number;
  warningCount: number;
  criticalCount: number;
  skippedCount: number;
  checks: PatrolCheckItem[];
  triggeredBy: "manual" | "auto" | "scheduled";
}

export interface PatrolSchedule {
  enabled: boolean;
  interval: PatrolInterval;  // minutes
  lastRun: number | null;
  nextRun: number | null;
}

// ============================================================
// Mock Data Generator
// ============================================================

function generatePatrolChecks(): PatrolCheckItem[] {
  return [
    { id: "n1", category: "节点健康", label: "GPU-A100-01", status: "pass", value: "在线 · GPU 72%", detail: "正常运行 48h" },
    { id: "n2", category: "节点健康", label: "GPU-A100-02", status: "pass", value: "在线 · GPU 68%", detail: "正常运行 48h" },
    { id: "n3", category: "节点健康", label: "GPU-A100-03", status: "warning", value: "在线 · 延迟高", detail: "推理延迟 2,450ms" },
    { id: "n4", category: "节点健康", label: "GPU-H100-01", status: "pass", value: "在线 · GPU 55%", detail: "正常运行 120h" },
    { id: "n5", category: "节点健康", label: "GPU-H100-02", status: "critical", value: "显存不足", detail: "98.1% 使用率" },
    { id: "n6", category: "节点健康", label: "GPU-A100-04", status: "pass", value: "在线 · GPU 45%", detail: "空闲" },
    { id: "s1", category: "存储", label: "NAS-Storage-01", status: "warning", value: "85.8%", threshold: "85%", detail: "41.2 TB / 48 TB" },
    { id: "s2", category: "存储", label: "NAS-Storage-02", status: "pass", value: "62.3%", threshold: "85%", detail: "29.9 TB / 48 TB" },
    { id: "s3", category: "存储", label: "本地 SSD 缓存", status: "pass", value: "45.1%", threshold: "90%", detail: "450 GB / 1 TB" },
    { id: "k1", category: "网络", label: "节点互联延迟", status: "warning", value: "平均 45ms", threshold: "30ms", detail: "5 节点 >100ms" },
    { id: "k2", category: "网络", label: "外部网络", status: "pass", value: "12ms", threshold: "50ms", detail: "192.168.3.1" },
    { id: "k3", category: "网络", label: "WebSocket 连接", status: "pass", value: "已连接", detail: "ws://localhost:3113" },
    { id: "m1", category: "模型服务", label: "LLaMA-70B", status: "pass", value: "正常", detail: "平均延迟 820ms" },
    { id: "m2", category: "模型服务", label: "DeepSeek-V3", status: "pass", value: "正常", detail: "平均延迟 1,200ms" },
    { id: "m3", category: "模型服务", label: "Qwen-72B", status: "pass", value: "正常", detail: "平均延迟 950ms" },
    { id: "d1", category: "数据库", label: "PostgreSQL 连接", status: "pass", value: "活跃", detail: "localhost:5433 · 12 连接" },
    { id: "d2", category: "数据库", label: "数据库存储", status: "pass", value: "23.4 GB", detail: "表空间正常" },
    { id: "p1", category: "进程", label: "推理引擎", status: "pass", value: "运行中", detail: "PID 3847" },
    { id: "p2", category: "进程", label: "API 网关", status: "pass", value: "运行中", detail: "PID 2103" },
    { id: "p3", category: "进程", label: "日志收集器", status: "pass", value: "运行中", detail: "PID 5621" },
  ];
}

function generateHistoryEntry(offset: number, triggeredBy: "manual" | "auto" | "scheduled"): PatrolResult {
  const baseTime = Date.now() - offset;
  const health = 90 + Math.floor(Math.random() * 10);
  const warnings = Math.floor(Math.random() * 4);
  const critical = Math.random() > 0.7 ? 1 : 0;
  const total = 20;
  const pass = total - warnings - critical;

  return {
    id: `patrol-${baseTime}`,
    timestamp: baseTime,
    duration: 8 + Math.floor(Math.random() * 15),
    status: "completed",
    healthScore: health,
    totalChecks: total,
    passCount: pass,
    warningCount: warnings,
    criticalCount: critical,
    skippedCount: 0,
    checks: [],
    triggeredBy,
  };
}

const INITIAL_HISTORY: PatrolResult[] = [
  generateHistoryEntry(30 * 60 * 1000, "auto"),
  generateHistoryEntry(60 * 60 * 1000, "auto"),
  generateHistoryEntry(90 * 60 * 1000, "auto"),
  generateHistoryEntry(2 * 60 * 60 * 1000, "auto"),
  generateHistoryEntry(3 * 60 * 60 * 1000, "scheduled"),
  generateHistoryEntry(4 * 60 * 60 * 1000, "auto"),
  generateHistoryEntry(6 * 60 * 60 * 1000, "manual"),
  generateHistoryEntry(12 * 60 * 60 * 1000, "auto"),
  generateHistoryEntry(24 * 60 * 60 * 1000, "scheduled"),
  generateHistoryEntry(48 * 60 * 60 * 1000, "auto"),
];

// ============================================================
// Hook
// ============================================================

export function usePatrol() {
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>("idle");
  const [currentResult, setCurrentResult] = useState<PatrolResult | null>(null);
  const [history, setHistory] = useState<PatrolResult[]>(INITIAL_HISTORY);
  const [selectedReport, setSelectedReport] = useState<PatrolResult | null>(null);
  const [schedule, setSchedule] = useState<PatrolSchedule>({
    enabled: true,
    interval: 15,
    lastRun: Date.now() - 30 * 60 * 1000,
    nextRun: Date.now() + 15 * 60 * 1000,
  });
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Run a patrol scan
  const runPatrol = useCallback(async (triggeredBy: "manual" | "auto" | "scheduled" = "manual") => {
    if (patrolStatus === "running") {return;}

    setPatrolStatus("running");
    setProgress(0);

    // Simulate progressive scanning
    const steps = 20;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 150 + Math.random() * 100));
      setProgress(Math.round((i / steps) * 100));
    }

    const checks = generatePatrolChecks();
    const passCount = checks.filter((c) => c.status === "pass").length;
    const warningCount = checks.filter((c) => c.status === "warning").length;
    const criticalCount = checks.filter((c) => c.status === "critical").length;
    const skippedCount = checks.filter((c) => c.status === "skipped").length;
    const healthScore = Math.round(
      ((passCount * 1 + warningCount * 0.6 + criticalCount * 0) / checks.length) * 100
    );

    const result: PatrolResult = {
      id: `patrol-${Date.now()}`,
      timestamp: Date.now(),
      duration: 8 + Math.floor(Math.random() * 12),
      status: "completed",
      healthScore,
      totalChecks: checks.length,
      passCount,
      warningCount,
      criticalCount,
      skippedCount,
      checks,
      triggeredBy,
    };

    setCurrentResult(result);
    setHistory((prev) => [result, ...prev]);
    setPatrolStatus("completed");
    setProgress(100);
    setSchedule((prev) => ({
      ...prev,
      lastRun: Date.now(),
      nextRun: prev.enabled ? Date.now() + prev.interval * 60 * 1000 : null,
    }));

    toast.success("巡查完成", {
      description: `健康度 ${healthScore}% · ${warningCount} 警告 · ${criticalCount} 严重`,
    });
  }, [patrolStatus]);

  // Toggle auto patrol
  const toggleAutoPatrol = useCallback((enabled: boolean) => {
    setSchedule((prev) => ({
      ...prev,
      enabled,
      nextRun: enabled ? Date.now() + prev.interval * 60 * 1000 : null,
    }));
    toast.info(enabled ? "自动巡查已启用" : "自动巡查已暂停");
  }, []);

  // Update interval
  const updateInterval = useCallback((interval: PatrolInterval) => {
    setSchedule((prev) => ({
      ...prev,
      interval,
      nextRun: prev.enabled ? Date.now() + interval * 60 * 1000 : null,
    }));
  }, []);

  // View a historical report
  const viewReport = useCallback((result: PatrolResult) => {
    setSelectedReport(result);
  }, []);

  const closeReport = useCallback(() => {
    setSelectedReport(null);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {clearInterval(intervalRef.current);}
    };
  }, []);

  return {
    patrolStatus,
    currentResult,
    history,
    schedule,
    progress,
    selectedReport,
    runPatrol,
    toggleAutoPatrol,
    updateInterval,
    viewReport,
    closeReport,
  };
}
