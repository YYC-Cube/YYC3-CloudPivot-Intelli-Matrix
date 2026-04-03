/**
 * query-cache.test.ts
 * ==================
 * 查询缓存服务 - 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { QueryCache, generateCacheKey } from "../lib/query-cache";

describe("QueryCache", () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache(1000);
  });

  afterEach(() => {
    cache.clear();
  });

  describe("基础操作", () => {
    it("应能设置和获取缓存", () => {
      cache.set("key1", { value: "test" });
      const result = cache.get("key1");
      expect(result).toEqual({ value: "test" });
    });

    it("应能删除缓存", () => {
      cache.set("key1", { value: "test" });
      const deleted = cache.delete("key1");
      expect(deleted).toBe(true);
      expect(cache.get("key1")).toBeNull();
    });

    it("应能清空所有缓存", () => {
      cache.set("key1", { value: "test1" });
      cache.set("key2", { value: "test2" });
      cache.clear();
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });

    it("应能检查缓存是否存在", () => {
      cache.set("key1", { value: "test" });
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(false);
    });

    it("应能获取所有缓存键", () => {
      cache.set("key1", { value: "test1" });
      cache.set("key2", { value: "test2" });
      const keys = cache.keys();
      expect(keys).toEqual(expect.arrayContaining(["key1", "key2"]));
    });
  });

  describe("过期时间", () => {
    it("应支持自定义过期时间", async () => {
      cache.set("key1", { value: "test" }, 100);
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(cache.get("key1")).toEqual({ value: "test" });
      await new Promise(resolve => setTimeout(resolve, 60));
      expect(cache.get("key1")).toBeNull();
    });

    it("应能清理过期缓存", async () => {
      cache.set("key1", { value: "test1" }, 100);
      cache.set("key2", { value: "test2" }, 500);
      await new Promise(resolve => setTimeout(resolve, 150));
      const cleaned = cache.cleanup();
      expect(cleaned).toBe(1);
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toEqual({ value: "test2" });
    });
  });

  describe("统计信息", () => {
    it("应正确记录缓存命中", () => {
      cache.set("key1", { value: "test" });
      cache.get("key1");
      cache.get("key1");
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it("应正确记录缓存未命中", () => {
      cache.get("key1");
      cache.get("key2");
      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it("应正确记录缓存大小", () => {
      cache.set("key1", { value: "test1" });
      cache.set("key2", { value: "test2" });
      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it("应能重置统计信息", () => {
      cache.set("key1", { value: "test" });
      cache.get("key1");
      cache.get("key2");
      cache.resetStats();
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(1);
    });
  });

  describe("generateCacheKey", () => {
    it("应生成一致的缓存键", () => {
      const key1 = generateCacheKey("models", "getActiveModels", { status: "active" });
      const key2 = generateCacheKey("models", "getActiveModels", { status: "active" });
      expect(key1).toBe(key2);
    });

    it("应按参数顺序排序", () => {
      const key1 = generateCacheKey("models", "get", { b: 2, a: 1 });
      const key2 = generateCacheKey("models", "get", { a: 1, b: 2 });
      expect(key1).toBe(key2);
    });

    it("应正确处理复杂参数", () => {
      const key = generateCacheKey("agents", "getActiveAgents", {
        is_active: true,
        filters: { role: "admin" },
      });
      expect(key).toContain("agents:getActiveAgents");
      expect(key).toContain("is_active:true");
    });
  });
});