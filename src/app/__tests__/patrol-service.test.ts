/**
 * patrol-service.test.ts
 * ======================
 * 巡查服务 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: () => mockSupabase,
}));

describe("PatrolService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("runPatrol", () => {
    it("应成功执行巡查", async () => {
      const { PatrolService } = await import("../lib/patrol-service");
      const patrolService = new PatrolService();

      const mockPatrol = {
        id: "patrol-1",
        name: "巡查 - 2024-01-01",
        description: "由手动触发",
        status: "completed",
        checks: { items: [] },
        results: {
          healthScore: 95,
          passCount: 10,
          warningCount: 1,
          criticalCount: 0,
        },
        total_checks: 11,
        passed_checks: 10,
        failed_checks: 1,
        created_by: "admin",
        completed_at: "2024-01-01T00:00:00Z",
      };

      (mockSupabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPatrol,
              error: null,
            }),
          }),
        }),
      });

      const result = await patrolService.runPatrol("manual", "admin");

      expect(result).toBeDefined();
      expect(result.healthScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getHistory", () => {
    it("应返回巡查历史", async () => {
      const { PatrolService } = await import("../lib/patrol-service");
      const patrolService = new PatrolService();

      const mockHistory = [
        {
          id: "patrol-1",
          name: "巡查 - 2024-01-01",
          status: "completed",
          created_at: "2024-01-01T00:00:00Z",
        },
      ];

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockHistory,
              error: null,
            }),
          }),
        }),
      });

      const result = await patrolService.getPatrolHistory();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("completed");
    });
  });
});
