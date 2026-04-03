/**
 * realtime-sync.test.ts
 * =====================
 * 实时数据同步服务 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RealtimeSync } from "../lib/realtime-sync";

const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockResolvedValue('SUBSCRIBED'),
  unsubscribe: vi.fn(),
};

const mockSupabase = {
  channel: vi.fn(() => mockChannel),
};

vi.mock("../lib/native-supabase-client", () => ({
  getNativeSupabaseClient: vi.fn(() => mockSupabase as any),
}));

vi.mock("../lib/query-cache", () => ({
  queryCache: {
    keys: vi.fn(() => []),
    delete: vi.fn(),
  },
}));

describe("RealtimeSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RealtimeSync.unsubscribeAll();
  });

  afterEach(() => {
    RealtimeSync.unsubscribeAll();
  });

  describe("subscribe", () => {
    it("应成功订阅表变更", async () => {
      const callback = vi.fn();
      const subscription = await RealtimeSync.subscribe("test_table", callback);

      expect(subscription.id).toBeDefined();
      expect(subscription.table).toBe("test_table");
      expect(mockChannel.on).toHaveBeenCalled();
    });

    it("应支持指定事件类型", async () => {
      const callback = vi.fn();
      const subscription = await RealtimeSync.subscribe(
        "test_table",
        callback,
        "INSERT"
      );

      expect(subscription.eventType).toBe("INSERT");
      expect(mockChannel.on).toHaveBeenCalled();
    });

    it("Supabase 不可用时应返回降级订阅", async () => {
      const { getNativeSupabaseClient } = await import("../lib/native-supabase-client");
      (getNativeSupabaseClient as any).mockReturnValue(null);

      const callback = vi.fn();
      const subscription = await RealtimeSync.subscribe("test_table", callback);

      expect(subscription.id).toContain("fallback-");
      expect(subscription.unsubscribe).toBeDefined();
      
      // 恢复 mock
      (getNativeSupabaseClient as any).mockReturnValue(mockSupabase);
    });
  });

  describe("unsubscribe", () => {
    it("应成功取消订阅", async () => {
      const callback = vi.fn();
      const subscription = await RealtimeSync.subscribe("test_table", callback);

      subscription.unsubscribe();

      expect(RealtimeSync.getSubscriptionCount()).toBe(0);
    });
  });

  describe("unsubscribeAll", () => {
    it("应取消所有订阅", async () => {
      const callback = vi.fn();
      await RealtimeSync.subscribe("table1", callback);
      await RealtimeSync.subscribe("table2", callback);

      expect(RealtimeSync.getSubscriptionCount()).toBe(2);

      RealtimeSync.unsubscribeAll();

      expect(RealtimeSync.getSubscriptionCount()).toBe(0);
    });
  });
});
