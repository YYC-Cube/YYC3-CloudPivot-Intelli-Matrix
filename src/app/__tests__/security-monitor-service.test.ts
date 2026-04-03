/**
 * security-monitor-service.test.ts
 * ================================
 * 安全监控服务 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: () => mockSupabase,
}));

vi.mock("../lib/query-monitor", () => ({
  queryMonitor: {
    wrapQuery: async (_name: string, _table: string, _operation: string, fn: () => any) => {
      return await fn();
    },
  },
}));

describe("SecurityMonitorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runFullScan", () => {
    it("应成功运行安全扫描", async () => {
      const { SecurityMonitorService } = await import("../lib/security-monitor-service");
      const securityService = new SecurityMonitorService();

      const result = await securityService.runFullScan();

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.csp).toBeDefined();
      expect(result.cookie).toBeDefined();
    });
  });

  describe("getSecurityStatus", () => {
    it("应返回安全状态", async () => {
      const { SecurityMonitorService } = await import("../lib/security-monitor-service");
      const securityService = new SecurityMonitorService();

      const result = await securityService.runFullScan();

      expect(result).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.lastScanTime).toBeDefined();
    });
  });
});
