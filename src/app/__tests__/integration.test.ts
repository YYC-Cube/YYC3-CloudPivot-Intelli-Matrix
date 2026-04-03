/**
 * integration.test.ts
 * ============
 * YYC³ 集成测试
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

import {
  loadNetworkConfig,
  saveNetworkConfig,
  resetNetworkConfig,
  generateWsUrl,
  DEFAULT_NETWORK_CONFIG,
} from "../lib/network-utils";
import {
  captureError,
  getErrorLog,
  clearErrorLog,
  trySafe,
} from "../lib/error-handler";
import {
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
} from "../lib/backgroundSync";

describe("Integration Tests", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe("网络配置 → WebSocket 联动", () => {
    it("修改服务器地址后 WebSocket URL 应自动更新", () => {
      const config = loadNetworkConfig();
      expect(config.wsUrl).toBeDefined();

      const newConfig = {
        ...config,
        serverAddress: "10.0.0.100",
        port: "8080",
        wsUrl: generateWsUrl("10.0.0.100", "8080"),
      };
      saveNetworkConfig(newConfig);

      const loaded = loadNetworkConfig();
      expect(loaded.wsUrl).toBe("ws://10.0.0.100:8080/ws");
      expect(loaded.serverAddress).toBe("10.0.0.100");
    });

    it("重置配置后应恢复默认值", () => {
      saveNetworkConfig({
        ...DEFAULT_NETWORK_CONFIG,
        serverAddress: "custom",
      });

      const reset = resetNetworkConfig();
      expect(reset).toEqual(DEFAULT_NETWORK_CONFIG);

      const loaded = loadNetworkConfig();
      expect(loaded).toEqual(DEFAULT_NETWORK_CONFIG);
    });
  });

  describe("错误处理 → 日志联动", () => {
    it("捕获的错误应持久化到日志", () => {
      clearErrorLog();

      captureError(new Error("test error 1"), { silent: true });
      captureError(new Error("test error 2"), { silent: true });

      const log = getErrorLog();
      expect(log.length).toBe(2);
      expect(log[0].message).toBe("test error 2");
    });

    it("trySafe 失败应自动记录到日志", async () => {
      clearErrorLog();

      const [data, error] = await trySafe(async () => {
        throw new Error("async failure");
      }, "IntegrationTest");

      expect(data).toBeNull();
      expect(error).not.toBeNull();

      const log = getErrorLog();
      expect(log.length).toBe(1);
      expect(log[0].source).toBe("IntegrationTest");
    });

    it("trySafe 成功不应记录日志", async () => {
      clearErrorLog();

      const [data] = await trySafe(async () => 42);
      expect(data).toBe(42);

      const log = getErrorLog();
      expect(log.length).toBe(0);
    });
  });

  describe("后台同步 → 队列处理联动", () => {
    it("完整的添加 → 清空流程", () => {
      addToSyncQueue({ type: "config_update", payload: { key: "theme" } });
      addToSyncQueue({ type: "audit_log", payload: { action: "login" } });
      addToSyncQueue({ type: "user_action", payload: { click: "button" } });

      expect(getSyncQueue().length).toBe(3);

      clearSyncQueue();
      expect(getSyncQueue().length).toBe(0);
    });
  });
});
