/**
 * retry-manager.test.ts
 * ====================
 * 重试管理器 - 单元测试
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { RetryManager } from "../lib/retry-manager";

describe("RetryManager", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("execute", () => {
    it("应成功执行函数", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      
      const result = await RetryManager.execute(fn);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(1);
    });

    it("应在失败时重试", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");
      
      const resultPromise = RetryManager.execute(fn, { maxAttempts: 3, baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
      expect(result.attempts).toBe(2);
    });

    it("应在达到最大重试次数后失败", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("Network error"));
      
      const resultPromise = RetryManager.execute(fn, { maxAttempts: 2, baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.attempts).toBe(2);
    });

    it("应调用重试回调", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValue("success");
      
      const onRetry = vi.fn();
      
      const resultPromise = RetryManager.execute(fn, { maxAttempts: 3, onRetry, baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      await resultPromise;
      expect(onRetry).toHaveBeenCalled();
    });

    it("应识别可重试错误", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValue("success");
      
      const resultPromise = RetryManager.execute(fn, { maxAttempts: 3, baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
    });
  });

  describe("executeWithFallback", () => {
    it("应在主函数失败时使用降级函数", async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error("Network error"));
      const fallbackFn = vi.fn().mockResolvedValue("fallback");
      
      const resultPromise = RetryManager.executeWithFallback(primaryFn, fallbackFn, { baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result.success).toBe(true);
      expect(result.data).toBe("fallback");
    });

    it("应在降级函数失败时返回错误", async () => {
      const primaryFn = vi.fn().mockRejectedValue(new Error("Network error"));
      const fallbackFn = vi.fn().mockRejectedValue(new Error("Fallback error"));
      
      const resultPromise = RetryManager.executeWithFallback(primaryFn, fallbackFn, { baseDelay: 10 });
      
      await vi.runAllTimersAsync();
      
      const result = await resultPromise;
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
