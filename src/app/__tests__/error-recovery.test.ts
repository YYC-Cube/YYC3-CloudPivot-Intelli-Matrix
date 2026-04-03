/**
 * error-recovery.test.ts
 * =====================
 * 错误恢复策略 - 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ErrorRecovery,
  ErrorCategory,
  RecoveryStrategy,
  ErrorRecoveryConfig,
} from "../lib/error-recovery";

describe("ErrorRecovery", () => {
  beforeEach(() => {
    ErrorRecovery.clearHistory();
  });

  afterEach(() => {
    ErrorRecovery.clearHistory();
  });

  describe("categorizeError", () => {
    it("应正确分类网络错误", () => {
      const error = new Error("Network connection failed");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.NETWORK);
    });

    it("应正确分类数据库错误", () => {
      const error = new Error("Database connection error");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.DATABASE);
    });

    it("应正确分类认证错误", () => {
      const error = new Error("Authentication failed");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.AUTHENTICATION);
    });

    it("应正确分类验证错误", () => {
      const error = new Error("Validation error: invalid input");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.VALIDATION);
    });

    it("应正确分类运行时错误", () => {
      const error = new Error("Runtime error: type mismatch");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.RUNTIME);
    });

    it("应正确分类未知错误", () => {
      const error = new Error("Unknown error");
      const category = ErrorRecovery.categorizeError(error);
      expect(category).toBe(ErrorCategory.UNKNOWN);
    });
  });

  describe("getRecoveryStrategy", () => {
    it("应为网络错误返回重试策略", () => {
      const error = new Error("Network error");
      const strategy = ErrorRecovery.getRecoveryStrategy(error);
      expect(strategy.category).toBe(ErrorCategory.NETWORK);
      expect(strategy.strategy).toBe(RecoveryStrategy.RETRY);
      expect(strategy.maxRetries).toBe(3);
    });

    it("应为数据库错误返回重试策略", () => {
      const error = new Error("Database error");
      const strategy = ErrorRecovery.getRecoveryStrategy(error);
      expect(strategy.category).toBe(ErrorCategory.DATABASE);
      expect(strategy.strategy).toBe(RecoveryStrategy.RETRY);
      expect(strategy.maxRetries).toBe(2);
    });

    it("应为验证错误返回忽略策略", () => {
      const error = new Error("Validation error");
      const strategy = ErrorRecovery.getRecoveryStrategy(error);
      expect(strategy.category).toBe(ErrorCategory.VALIDATION);
      expect(strategy.strategy).toBe(RecoveryStrategy.IGNORE);
    });

    it("应为认证错误返回告警策略", () => {
      const error = new Error("Authentication error");
      const strategy = ErrorRecovery.getRecoveryStrategy(error);
      expect(strategy.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(strategy.strategy).toBe(RecoveryStrategy.ALERT);
      expect(strategy.alertThreshold).toBe(1);
    });

    it("应使用自定义配置", () => {
      const error = new Error("Custom error");
      const customConfig: ErrorRecoveryConfig = {
        category: ErrorCategory.NETWORK,
        strategy: RecoveryStrategy.FALLBACK,
        maxRetries: 5,
      };
      
      ErrorRecovery.configureRecovery("custom error", customConfig);
      
      const strategy = ErrorRecovery.getRecoveryStrategy(error);
      expect(strategy.strategy).toBe(RecoveryStrategy.FALLBACK);
      expect(strategy.maxRetries).toBe(5);
    });
  });

  describe("recover", () => {
    it("应成功执行重试恢复", async () => {
      const error = new Error("Network error");
      const action = vi.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValue("success");
      
      const result = await ErrorRecovery.recover(error, action);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe("success");
      expect(result.record.strategy).toBe(RecoveryStrategy.RETRY);
      expect(result.record.attempts).toBeGreaterThan(1);
    });

    it("应成功执行降级恢复", async () => {
      const error = new Error("Network error");
      const action = vi.fn().mockRejectedValue(error);
      const fallbackAction = vi.fn().mockResolvedValue("fallback");
      
      const customConfig: ErrorRecoveryConfig = {
        category: ErrorCategory.NETWORK,
        strategy: RecoveryStrategy.FALLBACK,
        fallbackAction,
      };
      
      ErrorRecovery.configureRecovery("Network error", customConfig);
      
      const result = await ErrorRecovery.recover(error, action);
      
      expect(result.success).toBe(true);
      expect(result.result).toBe("fallback");
      expect(fallbackAction).toHaveBeenCalled();
    });

    it("应成功执行忽略恢复", async () => {
      const error = new Error("Validation error");
      const action = vi.fn().mockRejectedValue(error);
      
      const result = await ErrorRecovery.recover(error, action);
      
      expect(result.success).toBe(true);
      expect(result.record.strategy).toBe(RecoveryStrategy.IGNORE);
    });

    it("应记录恢复历史", async () => {
      const error = new Error("Network error");
      const action = vi.fn().mockRejectedValue(error);
      
      await ErrorRecovery.recover(error, action);
      
      const history = ErrorRecovery.getRecoveryHistory();
      expect(history).toHaveLength(1);
      expect(history[0].error).toBe(error);
    });

    it("应限制历史记录大小", async () => {
      const error = new Error("Test error");
      const action = vi.fn().mockRejectedValue(error);
      
      for (let i = 0; i < 1100; i++) {
        await ErrorRecovery.recover(error, action);
      }
      
      const history = ErrorRecovery.getRecoveryHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("getErrorCounts", () => {
    it("应正确统计错误次数", async () => {
      const error = new Error("Authentication error");
      const action = vi.fn().mockRejectedValue(error);
      
      await ErrorRecovery.recover(error, action);
      await ErrorRecovery.recover(error, action);
      await ErrorRecovery.recover(error, action);
      
      const counts = ErrorRecovery.getErrorCounts();
      expect(counts.get("Authentication error")).toBe(3);
    });

    it("应支持清除历史", async () => {
      const error = new Error("Test error");
      const action = vi.fn().mockRejectedValue(error);
      
      await ErrorRecovery.recover(error, action);
      
      ErrorRecovery.clearHistory();
      
      const history = ErrorRecovery.getRecoveryHistory();
      const counts = ErrorRecovery.getErrorCounts();
      
      expect(history).toHaveLength(0);
      expect(counts.size).toBe(0);
    });
  });
});