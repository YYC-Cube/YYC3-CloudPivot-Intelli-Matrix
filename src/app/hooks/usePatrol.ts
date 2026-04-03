/**
 * usePatrol.ts
 * ==============
 * 巡查模式 状态管理 Hook
 * 管理巡查结果、巡查历史、巡查计划、手动/自动巡查
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePersistedList } from "./usePersistedState";
import { patrolService } from "../lib/patrol-service";
import type {
  PatrolStatus,
  PatrolResult,
  PatrolSchedule,
  PatrolInterval,
} from "../types";

// RF-011: Re-export 已移除 — 所有类型统一从 types/index.ts 导入

// ============================================================
//  Hook
// ============================================================

export function usePatrol() {
  const [patrolStatus, setPatrolStatus] = useState<PatrolStatus>("idle");
  const [currentResult, setCurrentResult] = useState<PatrolResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedReport, setSelectedReport] = useState<PatrolResult | null>(null);

  const {
    items: history,
    setItems: _setHistory,
    prepend: prependHistory,
  } = usePersistedList<PatrolResult>(
    "patrolHistory",
    []
  );

  const [schedule, setSchedule] = useState<PatrolSchedule>({
    enabled: true,
    interval: 15,
    lastRun: null,
    nextRun: Date.now() + 15 * 60 * 1000,
  });

  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 加载初始数据
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [historyData, scheduleData] = await Promise.all([
          patrolService.getPatrolHistory(10),
          patrolService.getSchedule(),
        ]);
        
        _setHistory(historyData);
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Failed to load initial patrol data:', error);
      }
    };

    loadInitialData();
  }, [_setHistory]);

  // ── runPatrol ──────────────────────────────────────────────

  const runPatrol = useCallback(
    async (triggeredBy: "manual" | "auto" | "scheduled" = "manual") => {
      setPatrolStatus("running");
      setProgress(0);

      // 模拟渐进进度
      const steps = 5;
      for (let i = 1; i <= steps; i++) {
        await new Promise((r) => setTimeout(r, 80));
        setProgress(Math.round((i / steps) * 100));
      }

      const result = await patrolService.runPatrol(triggeredBy);

      setCurrentResult(result);
      setPatrolStatus("completed");
      setProgress(100);
      prependHistory(result);

      const newSchedule = await patrolService.getSchedule();
      setSchedule(newSchedule);

      if (triggeredBy === "manual") {
        toast.success(`巡查完成 — 健康度 ${result.healthScore}%`);
      }
    },
    [prependHistory]
  );

  // ── toggleAutoPatrol ───────────────────────────────────────

  const toggleAutoPatrol = useCallback(
    async (enabled: boolean) => {
      const newSchedule = {
        ...schedule,
        enabled,
        nextRun: enabled ? Date.now() + schedule.interval * 60 * 1000 : null,
      };

      await patrolService.updateSchedule(newSchedule);
      setSchedule(newSchedule);

      if (!enabled && autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }

      toast.info(enabled ? "自动巡查已开启" : "自动巡查已关闭");
    },
    [schedule]
  );

  // ── updateInterval ─────────────────────────────────────────

  const updateInterval = useCallback(
    async (interval: PatrolInterval) => {
      const newSchedule = {
        ...schedule,
        interval,
        nextRun: schedule.enabled ? Date.now() + interval * 60 * 1000 : schedule.nextRun,
      };

      await patrolService.updateSchedule(newSchedule);
      setSchedule(newSchedule);
    },
    [schedule]
  );

  // ── viewReport / closeReport ───────────────────────────────

  const viewReport = useCallback((report: PatrolResult) => {
    setSelectedReport(report);
  }, []);

  const closeReport = useCallback(() => {
    setSelectedReport(null);
  }, []);

  // ── 自动巡查定时器 ─────────────────────────────────────────

  useEffect(() => {
    if (schedule.enabled) {
      autoTimerRef.current = setInterval(() => {
        runPatrol("auto");
      }, schedule.interval * 60 * 1000);
    }
    return () => {
      if (autoTimerRef.current) {
        clearInterval(autoTimerRef.current);
        autoTimerRef.current = null;
      }
    };
  }, [schedule.enabled, schedule.interval, runPatrol]);

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