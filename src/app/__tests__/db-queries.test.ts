/**
 * db-queries.test.ts
 * ================
 * 数据库查询函数 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockSupabase = {
  from: vi.fn(),
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: vi.fn(() => mockSupabase as any),
}));

const mockStorage = {
  get: vi.fn(),
  set: vi.fn(),
  add: vi.fn().mockImplementation((_table: string, item: unknown) => Promise.resolve(item)),
  update: vi.fn(),
  delete: vi.fn(),
  clear: vi.fn(),
};

vi.mock("../lib/hybrid-storage-manager", () => ({
  getHybridStorage: vi.fn(() => mockStorage),
  initHybridStorage: vi.fn(),
}));

vi.mock("../lib/query-monitor", () => ({
  queryMonitor: {
    wrapQuery: vi.fn(async (_name: string, _table: string, _operation: string, fn: () => any) => {
      return await fn();
    }),
  },
}));

vi.mock("../lib/query-cache", () => ({
  queryCache: {
    get: vi.fn(() => null),
    set: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
  generateCacheKey: vi.fn((table: string, operation: string, params?: any) => 
    `${table}:${operation}:${JSON.stringify(params || {})}`
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("db-queries", () => {
  describe("基础功能", () => {
    it("应该正确导入模块", async () => {
      const dbQueries = await import("../lib/db-queries");
      expect(dbQueries).toBeDefined();
    });

    it("getActiveModels 应该返回数组", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await dbQueries.getActiveModels();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("getModelById 应该返回模型或 null", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      const result = await dbQueries.getModelById("test-id");
      expect(result.data).toBeNull();
    });

    it("addDbModel 应该返回新模型", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      // Mock storage.add to return the model with the expected ID
      mockStorage.add.mockResolvedValueOnce({
        id: "new-model-id",
        name: "Test Model",
        provider: "Test",
        tier: "primary",
        status: "active",
      });

      const result = await dbQueries.addDbModel({
        name: "Test Model",
        provider: "Test",
        tier: "primary",
        status: "active",
      } as any);

      expect(result.id).toBeDefined();
      expect(result.name).toBe("Test Model");
    });

    it("getActiveAgents 应该返回数组", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const result = await dbQueries.getActiveAgents();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("getNodesStatus 应该返回数组", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await dbQueries.getNodesStatus();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("addInferenceLog 应该返回日志 ID", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "new-log-id" },
              error: null,
            }),
          }),
        }),
      });

      const result = await dbQueries.addInferenceLog({
        model_id: "model-1",
        input_tokens: 100,
        output_tokens: 50,
        latency_ms: 200,
      } as any);

      expect(result.id).toBe("new-log-id");
    });

    it("getModelStats 应该返回统计数据", async () => {
      const dbQueries = await import("../lib/db-queries");
      
      (mockSupabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await dbQueries.getModelStats("model-1");
      expect(result).toBeDefined();
    });
  });

  describe("降级行为", () => {
    it("Supabase 不可用时应降级到本地存储", async () => {
      const { getNativeSupabaseClient } = await import("../lib/native-supabase-client");
      (getNativeSupabaseClient as any).mockReturnValue(null);

      mockStorage.get.mockResolvedValue([]);

      const dbQueries = await import("../lib/db-queries");
      const result = await dbQueries.getActiveModels();
      
      expect(Array.isArray(result.data)).toBe(true);
    });
  });
});
