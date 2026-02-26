/**
 * useOfflineMode Hook
 * ===================
 * 离线模式检测 & 数据同步
 */

import { useState, useEffect, useCallback } from "react";

export function useOfflineMode() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      saveOfflineSnapshot();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveOfflineSnapshot = useCallback(() => {
    try {
      const state = localStorage.getItem("dashboard_state");
      if (state) {
        localStorage.setItem("offline_snapshot", state);
        localStorage.setItem("offline_snapshot_time", new Date().toISOString());
      }
    } catch {
      // storage full or unavailable
    }
  }, []);

  const syncOfflineData = useCallback(async () => {
    const offlineState = localStorage.getItem("offline_snapshot");
    if (!offlineState) {
      setLastSyncTime(new Date());
      return;
    }

    setPendingSync(true);
    try {
      // 在真实环境中，这里会 POST 到 /api/sync
      // 当前 Mock 模式：模拟同步延迟
      await new Promise((r) => setTimeout(r, 500));
      localStorage.removeItem("offline_snapshot");
      localStorage.removeItem("offline_snapshot_time");
      setLastSyncTime(new Date());
    } catch {
      // 同步失败，保留离线数据
    } finally {
      setPendingSync(false);
    }
  }, []);

  const getOfflineSnapshotTime = useCallback((): Date | null => {
    const time = localStorage.getItem("offline_snapshot_time");
    return time ? new Date(time) : null;
  }, []);

  return {
    isOnline,
    lastSyncTime,
    pendingSync,
    saveOfflineSnapshot,
    syncOfflineData,
    getOfflineSnapshotTime,
  };
}
