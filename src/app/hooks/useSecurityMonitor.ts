/**
 * useSecurityMonitor.ts
 * ======================
 * Hook for Security & Performance Monitor
 * Provides real data for CSP, Cookie, Sensitive Data, Performance, Memory, Web Vitals,
 * Device Capabilities, Network Quality, Browser Compatibility, and Data Management.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { securityMonitorService } from "../lib/security-monitor-service";
import type {
  SecurityTab,
  SecurityMonitorState,
} from "../types";

declare global {
  interface Navigator {
    deviceMemory?: number;
    connection?: {
      type?: string;
      downlink?: number;
      rtt?: number;
      effectiveType?: string;
      saveData?: boolean;
    };
  }
}

// RF-011: Re-export 已移除 — 所有类型统一从 types/index.ts 导出

// ============================================================
// Hook
// ============================================================

export function useSecurityMonitor() {
  const [state, setState] = useState<SecurityMonitorState>({
    activeTab: "security",
    scanStatus: "idle",
    lastScanTime: null,
    overallScore: 0,
    overallRisk: "safe",
    csp: null,
    cookie: null,
    sensitive: null,
    performance: null,
    memory: null,
    vitals: [],
    device: null,
    network: null,
    browser: null,
    dataManagement: null,
  });

  const scanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setActiveTab = useCallback((tab: SecurityTab) => {
    setState((prev) => ({ ...prev, activeTab: tab }));
  }, []);

  const startScan = useCallback(async () => {
    setState((prev) => ({ ...prev, scanStatus: "scanning" }));

    // 模拟扫描延迟，让用户看到扫描过程
    scanTimer.current = setTimeout(async () => {
      try {
        const scanResult = await securityMonitorService.runFullScan();
        
        setState(scanResult);
        
        toast.success(`安全扫描完成 — 综合评分 ${scanResult.overallScore}%`);
      } catch (error) {
        console.error('Security scan failed:', error);
        setState((prev) => ({ ...prev, scanStatus: "idle" }));
        toast.error('安全扫描失败');
      }
    }, 1800);
  }, []);

  const cleanupData = useCallback(async (type: "expired" | "cache" | "privacy") => {
    setState((prev) => {
      if (!prev.dataManagement) { return prev; }
      const dm = { ...prev.dataManagement };
      if (type === "expired") { dm.expiredItems = 0; }
      if (type === "cache") { dm.cacheSize = 0; dm.storage = { ...dm.storage, cacheAPI: 0 }; }
      if (type === "privacy") {
        // 清理 sessionStorage
        window.sessionStorage.clear();
        dm.storage = { ...dm.storage, sessionStorage: 0 };
      }
      dm.storage.total = dm.storage.localStorage + dm.storage.sessionStorage + dm.storage.indexedDB + dm.storage.cacheAPI;
      return { ...prev, dataManagement: dm };
    });

    toast.success(`${type === 'expired' ? '过期数据' : type === 'cache' ? '缓存' : '隐私数据'}清理完成`);
  }, []);

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yyc3-security-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('安全报告已导出');
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimer.current) { clearTimeout(scanTimer.current); }
    };
  }, []);

  return {
    ...state,
    setActiveTab,
    startScan,
    cleanupData,
    exportData,
  };
}