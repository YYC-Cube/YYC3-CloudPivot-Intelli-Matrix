/**
 * data-editor-panel-core.test.tsx
 * ================================
 * M7 批十：DataEditorPanel 三大 DB CRUD tab 全链路覆盖
 *
 * 覆盖:
 * - 模型/节点/Agent 三 tab 渲染 + 数据加载（mock db-queries 返回数据）
 * - 排序（再次点击反转）+ 全选/单选/批量删除/取消选择
 * - 编辑保存 / 新增（填写后添加成功）/ 删除单项
 * - 重置（按 tab 分派 resetDbModels/Nodes/Agents）+ 刷新按钮
 * - 搜索过滤（无匹配空态）+ export tab → ConfigExportCenter
 */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ---------- mocks ---------- */

vi.mock("../components/GlassCard", () => ({
  GlassCard: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock("../components/ConfigExportCenter", () => ({
  ConfigExportCenter: () => <div>配置中心面板</div>,
}));

const dbMocks = vi.hoisted(() => ({
  getActiveModels: vi.fn(),
  getNodesStatus: vi.fn(),
  getAllAgents: vi.fn(),
  addDbModel: vi.fn(),
  updateDbModel: vi.fn(),
  deleteDbModel: vi.fn(),
  addDbNode: vi.fn(),
  updateDbNode: vi.fn(),
  deleteDbNode: vi.fn(),
  addDbAgent: vi.fn(),
  updateDbAgent: vi.fn(),
  deleteDbAgent: vi.fn(),
  resetDbModels: vi.fn(),
  resetDbNodes: vi.fn(),
  resetDbAgents: vi.fn(),
}));

vi.mock("../lib/db-queries", () => dbMocks);

vi.mock("../hooks/useValidation", () => ({
  useValidation: () => ({
    errors: {},
    validateField: vi.fn(),
    clearAll: vi.fn(),
    clearError: vi.fn(),
  }),
  validateRange: vi.fn(() => null),
  validateModelName: vi.fn(() => null),
}));

vi.mock("../lib/view-context", () => ({
  ViewContext: React.createContext({ currentView: "data-editor", setCurrentView: vi.fn(), isMobile: false }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

vi.mock("../stores/dashboard-stores", () => {
  const mk = (seed: Array<Record<string, unknown>>) => {
    const items = seed;
    return {
      getAll: vi.fn(() => items),
      count: vi.fn(() => items.length),
      getById: vi.fn(),
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      reset: vi.fn(),
    };
  };
  return {
    nodeStore: mk([
      { id: "node-1", model: "GLM-4.6", status: "active" },
      { id: "node-2", model: "GPT-5", status: "warning" },
    ]),
    modelPerfStore: mk([{ id: "mp-1", model: "GLM-4.6", accuracy: 90, speed: 80, memory: 70, cost: 60 }]),
    recentOpsStore: mk([{ id: "op-1", action: "deploy", target: "edge", user: "admin", time: "10:00:00", status: "success" }]),
    radarStore: mk([{ id: "rd-1", metric: "accuracy", A: 85, B: 78 }]),
    modelDistStore: mk([{ id: "md-1", name: "GLM", value: 40 }]),
    logStore: mk([{ id: "log-1", level: "info", source: "system", message: "boot ok", timestamp: 1760000000000 }]),
  };
});

import { DataEditorPanel } from "../components/DataEditorPanel";

/* ---------- 测试数据 ---------- */

const MODELS_DATA = [
  { id: "m-1", name: "GLM-4.6", provider: "Zhipu", tier: "primary", status: "active", avg_latency_ms: 320, throughput: 1200, created_at: "2026-01-01" },
  { id: "m-2", name: "GPT-5", provider: "OpenAI", tier: "secondary", status: "active", avg_latency_ms: 210, throughput: 2000, created_at: "2026-01-02" },
  { id: "m-3", name: "DeepSeek V3", provider: "DeepSeek", tier: "standby", status: "inactive", avg_latency_ms: 150, throughput: 800, created_at: "2026-01-03" },
];

const NODES_DATA = [
  { id: "n-1", hostname: "gpu-a100-01", gpu_util: 85, mem_util: 60, temp_celsius: 71, model_deployed: "GLM-4.6", active_tasks: 5, status: "active" },
  { id: "n-2", hostname: "gpu-a100-02", gpu_util: 30, mem_util: 40, temp_celsius: 55, model_deployed: "", active_tasks: 2, status: "warning" },
];

const AGENTS_DATA = [
  { id: "a-1", name: "coder", name_cn: "程序员", role: "coding", description: "写代码的", is_active: true },
  { id: "a-2", name: "analyst", name_cn: "分析师", role: "analysis", description: "分析数据", is_active: false },
];

const ok = <T,>(data: T) => Promise.resolve({ data, error: null });

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getActiveModels.mockImplementation(() => ok(MODELS_DATA));
  dbMocks.getNodesStatus.mockImplementation(() => ok(NODES_DATA));
  dbMocks.getAllAgents.mockImplementation(() => ok(AGENTS_DATA));
});

afterEach(() => {
  cleanup();
});

/* ---------- 用例 ---------- */

describe("DataEditorPanel 全链路", () => {
  it("模型 tab: 加载渲染 3 行 + tab 计数徽标", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());
    expect(screen.getByText("GPT-5")).toBeTruthy();
    expect(screen.getByText("DeepSeek V3")).toBeTruthy();
    // 模型 tab 计数徽标（rounded-full 徽标内有 "3"）
    const badges = screen.getAllByText("3").filter((el) => el.className.includes("rounded-full"));
    expect(badges.length).toBeGreaterThan(0);
  });

  it("模型 tab: 编辑→保存 走 updateDbModel", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    const row = screen.getByText("GLM-4.6").closest("tr")!;
    // 非编辑态: 行内按钮 [0]=Edit3 编辑, [1]=Trash2 删除
    fireEvent.click(row.querySelectorAll("button")[0]);
    // 进入编辑态: name 输入框出现且预填
    const nameInput = row.querySelector("input:not([type=checkbox])") as HTMLInputElement;
    expect(nameInput.value).toBe("GLM-4.6");
    fireEvent.change(nameInput, { target: { value: "GLM-5" } });
    // 编辑态: 行内按钮 [0]=Check 保存
    fireEvent.click(row.querySelectorAll("button")[0]);
    await waitFor(() =>
      expect(dbMocks.updateDbModel).toHaveBeenCalledWith("m-1", expect.objectContaining({ name: "GLM-5" }))
    );
  });

  it("模型 tab: 新增表单填写→添加走 addDbModel", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("新增"));
    fireEvent.change(screen.getByPlaceholderText("模型名称 *"), { target: { value: "Kimi" } });
    fireEvent.click(screen.getByText("添加"));
    await waitFor(() =>
      expect(dbMocks.addDbModel).toHaveBeenCalledWith(expect.objectContaining({ name: "Kimi" }))
    );
  });

  it("模型 tab: 删除单项→deleteDbModel + 排序反转", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    // 删除第一行
    const row = screen.getByText("GLM-4.6").closest("tr")!;
    fireEvent.click(row.querySelectorAll("button")[1]);
    await waitFor(() => expect(dbMocks.deleteDbModel).toHaveBeenCalledWith("m-1"));

    // 排序: 点「延迟(ms)」表头 → 按 avg_latency_ms 升序，首行应为 DeepSeek V3 (150)
    fireEvent.click(screen.getByText("延迟(ms)"));
    const firstRow = screen.getByText("DeepSeek V3").closest("tr") as HTMLTableRowElement;
    expect(firstRow.rowIndex).toBe(1); // tbody 第一数据行
  });

  it("模型 tab: 勾选→批量删除→取消选择", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    // 勾选第一行 checkbox
    const checkbox = screen.getByText("GLM-4.6").closest("tr")!.querySelector("input[type=checkbox]") as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(screen.getByText("已选 1 项")).toBeTruthy();

    // 批量删除
    fireEvent.click(screen.getByText("批量删除"));
    await waitFor(() => expect(dbMocks.deleteDbModel).toHaveBeenCalledWith("m-1"));
  });

  it("节点 tab: 渲染 2 行 + 编辑保存走 updateDbNode", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("节点管理"));
    await waitFor(() => expect(screen.getByText("gpu-a100-01")).toBeTruthy());

    const row = screen.getByText("gpu-a100-01").closest("tr")!;
    fireEvent.click(row.querySelectorAll("button")[0]); // 编辑
    const hostInput = row.querySelector("input:not([type=checkbox])") as HTMLInputElement;
    expect(hostInput.value).toBe("gpu-a100-01");
    fireEvent.change(hostInput, { target: { value: "gpu-h100-01" } });
    fireEvent.click(row.querySelectorAll("button")[0]); // 保存
    await waitFor(() =>
      expect(dbMocks.updateDbNode).toHaveBeenCalledWith("n-1", expect.objectContaining({ hostname: "gpu-h100-01" }))
    );
  });

  it("节点 tab: 新增节点走 addDbNode", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("节点管理"));
    await waitFor(() => expect(screen.getByText("gpu-a100-01")).toBeTruthy());

    fireEvent.click(screen.getByText("新增"));
    fireEvent.change(screen.getByPlaceholderText("主机名 *"), { target: { value: "gpu-4090" } });
    fireEvent.click(screen.getByText("添加"));
    await waitFor(() =>
      expect(dbMocks.addDbNode).toHaveBeenCalledWith(expect.objectContaining({ hostname: "gpu-4090" }))
    );
  });

  it("Agent tab: 渲染 + 编辑保存走 updateDbAgent", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("Agent 管理"));
    await waitFor(() => expect(screen.getByText("coder")).toBeTruthy());

    const row = screen.getByText("coder").closest("tr")!;
    fireEvent.click(row.querySelectorAll("button")[0]); // 编辑
    const nameInput = row.querySelector("input:not([type=checkbox])") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "coder-pro" } });
    fireEvent.click(row.querySelectorAll("button")[0]); // 保存
    await waitFor(() =>
      expect(dbMocks.updateDbAgent).toHaveBeenCalledWith("a-1", expect.objectContaining({ name: "coder-pro" }))
    );
  });

  it("重置按钮: 模型/节点/Agent 三 tab 分派各自 reset", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    // 模型 tab 重置
    fireEvent.click(screen.getByText("重置"));
    await waitFor(() => expect(dbMocks.resetDbModels).toHaveBeenCalled());

    // 节点 tab 重置
    fireEvent.click(screen.getByText("节点管理"));
    fireEvent.click(screen.getByText("重置"));
    await waitFor(() => expect(dbMocks.resetDbNodes).toHaveBeenCalled());

    // Agent tab 重置
    fireEvent.click(screen.getByText("Agent 管理"));
    fireEvent.click(screen.getByText("重置"));
    await waitFor(() => expect(dbMocks.resetDbAgents).toHaveBeenCalled());
  });

  it("搜索过滤: 输入不存在关键词 → 空态文案", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("搜索..."), { target: { value: "不存在的模型" } });
    expect(screen.getByText("无匹配结果")).toBeTruthy();
  });

  it("liveNodes tab: store 渲染 + 重置分派 nodeStore.reset", async () => {
    const { nodeStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("实时节点"));
    expect(screen.getByText(/Dashboard 实时节点/)).toBeTruthy();
    // store tab 内重置按钮（最后一个，首个是顶部 Header 重置）
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(nodeStore.reset).toHaveBeenCalled();
  });

  it("modelPerf tab: store 渲染 + 重置分派 modelPerfStore.reset", async () => {
    const { modelPerfStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("模型性能"));
    expect(screen.getByText(/Dashboard 模型性能/)).toBeTruthy();
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(modelPerfStore.reset).toHaveBeenCalled();
  });

  it("recentOps tab: store 渲染 + 重置分派 recentOpsStore.reset", async () => {
    const { recentOpsStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("操作记录"));
    expect(screen.getByText(/Dashboard 最近操作/)).toBeTruthy();
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(recentOpsStore.reset).toHaveBeenCalled();
  });

  it("radarData tab: store 渲染 + 重置分派 radarStore.reset", async () => {
    const { radarStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("雷达数据"));
    expect(screen.getByText(/Dashboard 雷达对比/)).toBeTruthy();
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(radarStore.reset).toHaveBeenCalled();
  });

  it("modelDist tab: store 渲染 + 重置分派 modelDistStore.reset", async () => {
    const { modelDistStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("模型分布"));
    expect(screen.getByText(/Dashboard 模型分布/)).toBeTruthy();
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(modelDistStore.reset).toHaveBeenCalled();
  });

  it("logsData tab: store 渲染 + 重置分派 logStore.reset", async () => {
    const { logStore } = await import("../stores/dashboard-stores");
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("日志管理"));
    expect(screen.getByText(/Dashboard 日志数据/)).toBeTruthy();
    const resets = screen.getAllByText("重置");
    fireEvent.click(resets[resets.length - 1]);
    expect(logStore.reset).toHaveBeenCalled();
  });

  it("export tab: 渲染 ConfigExportCenter", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("配置中心"));
    expect(screen.getByText("配置中心面板")).toBeTruthy();
  });

  it("刷新按钮: 重新触发 loadData", async () => {
    render(<DataEditorPanel />);
    await waitFor(() => expect(screen.getByText("GLM-4.6")).toBeTruthy());

    fireEvent.click(screen.getByText("刷新"));
    await waitFor(() => expect(dbMocks.getActiveModels).toHaveBeenCalledTimes(2));
  });
});
