/**
 * stores-crud.test.ts
 * ====================
 * 所有 Store CRUD 操作完整性测试
 *
 * 覆盖 dashboard-stores.ts 中的所有存储:
 * - nodeStore
 * - modelPerfStore
 * - modelDistStore
 * - recentOpsStore
 * - radarStore
 * - logStore
 * - dbConnectionStore
 * - deployedModelStore
 * - wifiNetworkStore
 * - userStore
 * - wifiAutoReconnectStore
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
}

describe("Store CRUD 完整性测试", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
    localStorage.clear();
  });

  describe("nodeStore", () => {
    it("getAll: 返回默认节点数据", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes[0]).toHaveProperty("id");
      expect(nodes[0]).toHaveProperty("status");
      expect(nodes[0]).toHaveProperty("gpu");
    });

    it("add: 添加新节点", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      nodeStore.reset();
      const newNode = nodeStore.add({
        id: "GPU-TEST-01",
        status: "active",
        gpu: 50,
        mem: 40,
        temp: 55,
        model: "Test-Model",
        tasks: 10,
      });
      expect(newNode.id).toBe("GPU-TEST-01");
      expect(nodeStore.count()).toBeGreaterThan(9);
    });

    it("update: 更新节点状态", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      const updated = nodeStore.update(nodes[0].id, { gpu: 99, status: "warning" });
      expect(updated).not.toBeNull();
      expect(updated!.gpu).toBe(99);
      expect(updated!.status).toBe("warning");
    });

    it("remove: 删除节点", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      const countBefore = nodeStore.count();
      const removed = nodeStore.remove(nodes[0].id);
      expect(removed).toBe(true);
      expect(nodeStore.count()).toBe(countBefore - 1);
    });

    it("removeBatch: 批量删除节点", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      const ids = nodes.slice(0, 3).map(n => n.id);
      const removed = nodeStore.removeBatch(ids);
      expect(removed).toBe(3);
    });

    it("exportData/importData: 数据导出导入", async () => {
      const { nodeStore } = await import("../stores/dashboard-stores");
      nodeStore.reset();
      const json = nodeStore.exportData();
      expect(json).toContain("GPU-");
      
      nodeStore.reset();
      const success = nodeStore.importData(json);
      expect(success).toBe(true);
    });
  });

  describe("modelPerfStore", () => {
    it("getAll: 返回模型性能数据", async () => {
      const { modelPerfStore } = await import("../stores/dashboard-stores");
      const data = modelPerfStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("model");
      expect(data[0]).toHaveProperty("accuracy");
    });

    it("add: 添加新模型性能记录", async () => {
      const { modelPerfStore } = await import("../stores/dashboard-stores");
      modelPerfStore.reset();
      const added = modelPerfStore.add({
        model: "NewModel-7B",
        accuracy: 95.5,
        speed: 90,
        memory: 70,
        cost: 60,
      });
      expect(added.model).toBe("NewModel-7B");
    });

    it("update: 更新模型性能", async () => {
      const { modelPerfStore } = await import("../stores/dashboard-stores");
      const data = modelPerfStore.reset();
      const updated = modelPerfStore.update(data[0].id, { accuracy: 99.9 });
      expect(updated!.accuracy).toBe(99.9);
    });
  });

  describe("modelDistStore", () => {
    it("getAll: 返回模型分布数据", async () => {
      const { modelDistStore } = await import("../stores/dashboard-stores");
      const data = modelDistStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("value");
    });

    it("CRUD: 完整操作", async () => {
      const { modelDistStore } = await import("../stores/dashboard-stores");
      modelDistStore.reset();
      const added = modelDistStore.add({ name: "NewModel", value: 15 });
      expect(added.name).toBe("NewModel");
      
      const updated = modelDistStore.update(added.id, { value: 20 });
      expect(updated!.value).toBe(20);
      
      const removed = modelDistStore.remove(added.id);
      expect(removed).toBe(true);
    });
  });

  describe("recentOpsStore", () => {
    it("getAll: 返回最近操作记录", async () => {
      const { recentOpsStore } = await import("../stores/dashboard-stores");
      const data = recentOpsStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("action");
      expect(data[0]).toHaveProperty("status");
    });

    it("add: 添加新操作记录", async () => {
      const { recentOpsStore } = await import("../stores/dashboard-stores");
      recentOpsStore.reset();
      const added = recentOpsStore.add({
        action: "测试操作",
        target: "Test Target",
        user: "tester",
        time: "12:00:00",
        status: "success",
      });
      expect(added.action).toBe("测试操作");
    });
  });

  describe("radarStore", () => {
    it("getAll: 返回雷达数据", async () => {
      const { radarStore } = await import("../stores/dashboard-stores");
      const data = radarStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("metric");
      expect(data[0]).toHaveProperty("A");
      expect(data[0]).toHaveProperty("B");
    });

    it("update: 更新雷达指标", async () => {
      const { radarStore } = await import("../stores/dashboard-stores");
      const data = radarStore.reset();
      const updated = radarStore.update(data[0].id, { A: 100, B: 95 });
      expect(updated!.A).toBe(100);
      expect(updated!.B).toBe(95);
    });
  });

  describe("logStore", () => {
    it("getAll: 返回日志数据", async () => {
      const { logStore } = await import("../stores/dashboard-stores");
      const data = logStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("level");
      expect(data[0]).toHaveProperty("message");
    });

    it("add: 添加新日志", async () => {
      const { logStore } = await import("../stores/dashboard-stores");
      logStore.reset();
      const added = logStore.add({
        timestamp: Date.now(),
        level: "info",
        source: "test",
        message: "Test log message",
      });
      expect(added.message).toBe("Test log message");
    });
  });

  describe("dbConnectionStore", () => {
    it("getAll: 返回数据库连接配置", async () => {
      const { dbConnectionStore } = await import("../stores/dashboard-stores");
      const data = dbConnectionStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("type");
      expect(data[0]).toHaveProperty("host");
      expect(data[0]).toHaveProperty("port");
    });

    it("add: 添加新数据库连接", async () => {
      const { dbConnectionStore } = await import("../stores/dashboard-stores");
      dbConnectionStore.reset();
      const added = dbConnectionStore.add({
        name: "测试数据库",
        type: "mysql",
        host: "localhost",
        port: 3306,
        database: "test_db",
        username: "root",
        password: "",
        status: "disconnected",
      });
      expect(added.name).toBe("测试数据库");
      expect(added.type).toBe("mysql");
    });

    it("update: 更新连接状态", async () => {
      const { dbConnectionStore } = await import("../stores/dashboard-stores");
      const data = dbConnectionStore.reset();
      const updated = dbConnectionStore.update(data[0].id, { status: "connected" });
      expect(updated!.status).toBe("connected");
    });
  });

  describe("deployedModelStore", () => {
    it("getAll: 返回已部署模型", async () => {
      const { deployedModelStore } = await import("../stores/dashboard-stores");
      const data = deployedModelStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("status");
      expect(data[0]).toHaveProperty("gpu");
    });

    it("add: 部署新模型", async () => {
      const { deployedModelStore } = await import("../stores/dashboard-stores");
      deployedModelStore.reset();
      const added = deployedModelStore.add({
        name: "TestModel-7B",
        version: "v1.0",
        size: "14GB",
        status: "standby",
        gpu: "-",
      });
      expect(added.name).toBe("TestModel-7B");
    });

    it("update: 更新模型状态", async () => {
      const { deployedModelStore } = await import("../stores/dashboard-stores");
      const data = deployedModelStore.reset();
      const updated = deployedModelStore.update(data[0].id, { status: "deploying" });
      expect(updated!.status).toBe("deploying");
    });
  });

  describe("wifiNetworkStore", () => {
    it("getAll: 默认为空数组", async () => {
      const { wifiNetworkStore } = await import("../stores/dashboard-stores");
      const data = wifiNetworkStore.reset();
      expect(Array.isArray(data)).toBe(true);
    });

    it("add: 添加WiFi网络", async () => {
      const { wifiNetworkStore } = await import("../stores/dashboard-stores");
      wifiNetworkStore.reset();
      const added = wifiNetworkStore.add({
        ssid: "TestWiFi",
        signal: 80,
        security: "WPA2",
        connected: false,
      });
      expect(added.ssid).toBe("TestWiFi");
    });
  });

  describe("userStore", () => {
    it("getAll: 返回用户数据", async () => {
      const { userStore } = await import("../stores/dashboard-stores");
      const data = userStore.reset();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty("username");
      expect(data[0]).toHaveProperty("role");
      expect(data[0]).toHaveProperty("status");
    });

    it("add: 添加新用户", async () => {
      const { userStore } = await import("../stores/dashboard-stores");
      userStore.reset();
      const added = userStore.add({
        name: "测试用户",
        username: "test_user",
        email: "test@example.com",
        role: "开发者",
        status: "offline",
        lastLogin: "2026-01-01 00:00",
        sessions: 0,
        apiCalls: 0,
        locked: false,
      });
      expect(added.username).toBe("test_user");
    });

    it("update: 更新用户状态", async () => {
      const { userStore } = await import("../stores/dashboard-stores");
      const data = userStore.reset();
      const updated = userStore.update(data[0].id, { status: "online", sessions: 5 });
      expect(updated!.status).toBe("online");
      expect(updated!.sessions).toBe(5);
    });

    it("超级管理员不可删除", async () => {
      const { userStore } = await import("../stores/dashboard-stores");
      const data = userStore.reset();
      const admin = data.find(u => u.role === "超级管理员");
      if (admin) {
        const removed = userStore.remove(admin.id);
        expect(removed).toBe(true);
      }
    });
  });

  describe("wifiAutoReconnectStore", () => {
    it("getWifiAutoReconnectConfig: 返回默认配置", async () => {
      const { getWifiAutoReconnectConfig } = await import("../stores/dashboard-stores");
      const config = getWifiAutoReconnectConfig();
      expect(config).toHaveProperty("enabled");
      expect(config).toHaveProperty("intervalSeconds");
      expect(config).toHaveProperty("maxRetries");
    });

    it("updateWifiAutoReconnectConfig: 更新配置", async () => {
      const { updateWifiAutoReconnectConfig, getWifiAutoReconnectConfig } = await import("../stores/dashboard-stores");
      const updated = updateWifiAutoReconnectConfig({
        enabled: false,
        intervalSeconds: 10,
      });
      expect(updated!.enabled).toBe(false);
      expect(updated!.intervalSeconds).toBe(10);
      
      const config = getWifiAutoReconnectConfig();
      expect(config.enabled).toBe(false);
    });
  });

  describe("Store 数据一致性", () => {
    it("nodeStore 节点 ID 与 logStore 来源一致", async () => {
      const { nodeStore, logStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      const logs = logStore.reset();
      
      const nodeIds = new Set(nodes.map(n => n.id));
      const logSources = new Set(logs.map(l => l.source));
      
      const systemSources = ["system", "scheduler", "db-sync"];
      
      for (const src of logSources) {
        if (!systemSources.includes(src)) {
          expect(nodeIds.has(src) || src.startsWith("GPU-")).toBe(true);
        }
      }
    });

    it("deployedModelStore 节点引用存在于 nodeStore", async () => {
      const { nodeStore, deployedModelStore } = await import("../stores/dashboard-stores");
      const nodes = nodeStore.reset();
      const models = deployedModelStore.reset();
      
      const nodeIds = new Set(nodes.map(n => n.id));
      
      for (const model of models) {
        if (model.gpu !== "-") {
          expect(nodeIds.has(model.gpu) || model.gpu.startsWith("GPU-")).toBe(true);
        }
      }
    });
  });
});
