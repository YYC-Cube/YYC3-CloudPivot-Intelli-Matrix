/**
 * network-utils.test.ts
 * ======================
 * YYC³ 网络工具函数 - 单元测试
 *
 * 测试框架: Vitest
 * 运行命令: npx vitest run src/app/__tests__/network-utils.test.ts
 *
 * 覆盖范围:
 * - 网络配置 CRUD（localStorage 读写）
 * - WebSocket URL 自动生成
 * - 默认值常量校验
 * - 连接测试超时逻辑
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  DEFAULT_NETWORK_CONFIG,
  loadNetworkConfig,
  saveNetworkConfig,
  resetNetworkConfig,
  generateWsUrl,
  testWebSocketConnection,
  testHTTPConnection,
  type NetworkConfig,
} from "../lib/network-utils";

// ============================================================
// Mock localStorage
// ============================================================

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

// ============================================================
// Tests
// ============================================================

describe("network-utils", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // DEFAULT_NETWORK_CONFIG
  // ----------------------------------------------------------

  describe("DEFAULT_NETWORK_CONFIG", () => {
    it("应包含正确的默认服务器地址", () => {
      expect(DEFAULT_NETWORK_CONFIG.serverAddress).toBe("192.168.3.45");
    });

    it("应包含正确的默认端口", () => {
      expect(DEFAULT_NETWORK_CONFIG.port).toBe("3113");
    });

    it("应包含正确的 NAS 地址", () => {
      expect(DEFAULT_NETWORK_CONFIG.nasAddress).toBe("192.168.3.45:9898");
    });

    it("应包含正确的 WebSocket URL", () => {
      expect(DEFAULT_NETWORK_CONFIG.wsUrl).toBe("ws://192.168.3.45:3113/ws");
    });

    it("应包含正确的模式", () => {
      expect(DEFAULT_NETWORK_CONFIG.mode).toBe("auto");
    });
  });

  // ----------------------------------------------------------
  // loadNetworkConfig
  // ----------------------------------------------------------

  describe("loadNetworkConfig", () => {
    it("localStorage 空时应返回默认配置", () => {
      const config = loadNetworkConfig();
      expect(config).toEqual(DEFAULT_NETWORK_CONFIG);
    });

    it("localStorage 有值时应返回保存的配置", () => {
      const customConfig: NetworkConfig = {
        serverAddress: "10.0.0.1",
        port: "8080",
        nasAddress: "10.0.0.1:9898",
        wsUrl: "ws://10.0.0.1:8080/ws",
        mode: "manual",
      };
      localStorageMock.setItem("network_config", JSON.stringify(customConfig));
      const config = loadNetworkConfig();
      expect(config.serverAddress).toBe("10.0.0.1");
      expect(config.port).toBe("8080");
      expect(config.nasAddress).toBe("10.0.0.1:9898");
      expect(config.wsUrl).toBe("ws://10.0.0.1:8080/ws");
      expect(config.mode).toBe("manual");
    });

    it("localStorage 数据损坏时应返回默认配置", () => {
      localStorageMock.setItem("network_config", "invalid json");
      const config = loadNetworkConfig();
      expect(config).toEqual(DEFAULT_NETWORK_CONFIG);
    });
  });

  // ----------------------------------------------------------
  // saveNetworkConfig
  // ----------------------------------------------------------

  describe("saveNetworkConfig", () => {
    it("应将配置保存到 localStorage", () => {
      const config: NetworkConfig = {
        serverAddress: "192.168.1.100",
        port: "9000",
        nasAddress: "192.168.1.100:9898",
        wsUrl: "ws://192.168.1.100:9000/ws",
        mode: "manual",
      };
      saveNetworkConfig(config);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "network_config",
        JSON.stringify(config)
      );
    });

    it("保存后应能读取相同配置", () => {
      const config: NetworkConfig = {
        serverAddress: "172.16.0.1",
        port: "7000",
        nasAddress: "172.16.0.1:9898",
        wsUrl: "ws://172.16.0.1:7000/ws",
        mode: "auto",
      };
      saveNetworkConfig(config);
      const loaded = loadNetworkConfig();
      expect(loaded.serverAddress).toBe("172.16.0.1");
      expect(loaded.port).toBe("7000");
      expect(loaded.nasAddress).toBe("172.16.0.1:9898");
      expect(loaded.wsUrl).toBe("ws://172.16.0.1:7000/ws");
      expect(loaded.mode).toBe("auto");
    });
  });

  // ----------------------------------------------------------
  // resetNetworkConfig
  // ----------------------------------------------------------

  describe("resetNetworkConfig", () => {
    it("应清除 localStorage 配置", () => {
      const config: NetworkConfig = {
        serverAddress: "10.0.0.1",
        port: "8080",
        nasAddress: "10.0.0.1:9898",
        wsUrl: "ws://10.0.0.1:8080/ws",
        mode: "manual",
      };
      saveNetworkConfig(config);
      resetNetworkConfig();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("network_config");
    });

    it("重置后应返回默认配置", () => {
      const config: NetworkConfig = {
        serverAddress: "10.0.0.1",
        port: "8080",
        nasAddress: "10.0.0.1:9898",
        wsUrl: "ws://10.0.0.1:8080/ws",
        mode: "manual",
      };
      saveNetworkConfig(config);
      const resetConfig = resetNetworkConfig();
      expect(resetConfig).toEqual(DEFAULT_NETWORK_CONFIG);
    });
  });

  // ----------------------------------------------------------
  // generateWsUrl
  // ----------------------------------------------------------

  describe("generateWsUrl", () => {
    it("应根据地址和端口生成正确的 WebSocket URL", () => {
      expect(generateWsUrl("192.168.1.1", "3113")).toBe("ws://192.168.1.1:3113/ws");
    });

    it("应处理 localhost", () => {
      expect(generateWsUrl("localhost", "8080")).toBe("ws://localhost:8080/ws");
    });

    it("应处理 IP v4 地址", () => {
      expect(generateWsUrl("10.0.0.1", "443")).toBe("ws://10.0.0.1:443/ws");
    });
  });

  // ----------------------------------------------------------
  // testWebSocketConnection
  // ----------------------------------------------------------

  describe("testWebSocketConnection", () => {
    it("应正确导出 testWebSocketConnection 函数", () => {
      expect(typeof testWebSocketConnection).toBe("function");
    });

    it("连接不可达时应返回失败结果", async () => {
      const mockWS = vi.fn().mockImplementation(() => {
        const ws = {
          onopen: null as any,
          onerror: null as any,
          onclose: null as any,
          close: vi.fn(),
        };
        queueMicrotask(() => {
          if (ws.onerror) {ws.onerror();}
        });
        return ws;
      });

      vi.stubGlobal("WebSocket", mockWS);

      const result = await testWebSocketConnection("ws://invalid:9999/ws", 1000);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      vi.unstubAllGlobals();
    });
  });

  // ----------------------------------------------------------
  // testHTTPConnection
  // ----------------------------------------------------------

  describe("testHTTPConnection", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("HTTP 请求成功时应返回成功结果", async () => {
      const mockFetch = fetch as any;
      mockFetch.mockResolvedValue({ ok: true });

      const result = await testHTTPConnection("http://example.com");
      expect(result.success).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it("HTTP 请求失败时应返回失败结果", async () => {
      const mockFetch = fetch as any;
      mockFetch.mockRejectedValue(new Error("Network error"));

      const result = await testHTTPConnection("http://example.com");
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
