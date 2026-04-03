/**
 * operation-service.test.ts
 * ========================
 * 操作服务 - 单元测试
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

describe("OperationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getActions", () => {
    it("应返回操作列表", async () => {
      const { OperationService } = await import("../lib/operation-service");
      const operationService = new OperationService();

      const mockOperations = [
        {
          id: "op-1",
          name: "Restart Service",
          description: "Restart the main service",
          type: "system",
          status: "idle",
          target: "service-main",
          result: null,
          error_message: null,
          duration: null,
          created_by: "admin",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          completed_at: null,
        },
      ];

      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: mockOperations,
              error: null,
            }),
          }),
        }),
      });

      const result = await operationService.getActions();

      expect(result).toHaveLength(1);
      expect(result[0].label).toBe("Restart Service");
    });
  });

  describe("executeAction", () => {
    it("应成功执行操作", async () => {
      const { OperationService } = await import("../lib/operation-service");
      const operationService = new OperationService();

      const mockOperation = {
        id: "op-1",
        name: "Restart Service",
        type: "system",
        status: "idle",
        result: null,
        duration: null,
        completed_at: null,
      };

      let callCount = 0;

      (mockSupabase.from as any).mockImplementation((table: string) => {
        callCount++;
        
        if (table === "operation_logs") {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockImplementation(() => {
            if (callCount === 1) {
              return Promise.resolve({ data: [mockOperation], error: null });
            }
            if (callCount === 2) {
              return Promise.resolve({ data: { ...mockOperation, status: "running" }, error: null });
            }
            return Promise.resolve({ 
              data: { 
                ...mockOperation, 
                status: "success", 
                duration: 100,
                completed_at: new Date().toISOString() 
              }, 
              error: null 
            });
          }),
          update: vi.fn().mockReturnThis(),
        };
      });

      const result = await operationService.executeAction("op-1");

      expect(result).toBeDefined();
      expect(result.status).toBe("success");
    });
  });
});
