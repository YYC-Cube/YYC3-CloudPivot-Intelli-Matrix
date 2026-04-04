/**
 * batch-operations.test.ts
 * ======================
 * 批量操作 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const mockFrom = vi.fn();
const mockSupabase = {
  from: mockFrom,
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: () => mockSupabase,
}));

const mockStorage = {
  add: vi.fn(),
  update: vi.fn(),
  delete: vi.fn().mockResolvedValue(true),
  get: vi.fn(),
};

vi.mock("../lib/hybrid-storage-manager", () => ({
  getHybridStorage: () => mockStorage,
}));

describe("BatchOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("batchInsert", () => {
    it("应成功批量插入数据", async () => {
      const { BatchOperations } = await import("../lib/batch-operations");
      const batchOps = new BatchOperations();

      const items = [
        { id: "1", name: "Item 1" },
        { id: "2", name: "Item 2" },
      ];

      mockFrom.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: items,
            error: null,
          }),
        }),
      });

      const result = await batchOps.batchInsert("test_table", items);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe("batchUpdate", () => {
    it("应成功批量更新数据", async () => {
      const { BatchOperations } = await import("../lib/batch-operations");
      const batchOps = new BatchOperations();

      const updates = [
        { id: "1", changes: { name: "Updated Item 1" } },
        { id: "2", changes: { name: "Updated Item 2" } },
      ];

      const callIndex = 0;
      mockFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: updates[callIndex]?.id || "1", name: updates[callIndex]?.changes.name || "Updated" },
                error: null,
              }),
            }),
          }),
        }),
      }));

      const result = await batchOps.batchUpdate("test_table", updates);

      expect(result.success).toBe(true);
    });
  });

  describe("batchDelete", () => {
    it("应成功批量删除数据", async () => {
      const { BatchOperations } = await import("../lib/batch-operations");
      const batchOps = new BatchOperations();

      const ids = ["1", "2"];

      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await batchOps.batchDelete("test_table", ids);

      expect(result.success).toBe(true);
      expect(result.deleted).toBe(2);
    });
  });
});
