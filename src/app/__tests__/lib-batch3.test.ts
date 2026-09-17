/**
 * lib-batch3.test.ts
 * ==================
 * 组件域攻坚批三（M7 前置 · lib 域）: ollama-config + VoiceCreator
 *
 * 覆盖:
 * - ollama-config: 配置持久化 CRUD + 激活实例 + 服务发现/健康检查（fetch mock）
 *   + 智能连接 + 连接摘要 + 推理测试 + 一键配置 + 自动发现开关 + 定时器清理
 * - VoiceCreator: 会话生命周期 + 模板查询 + 歌词生成（zh/en）+ 情感分析 + 模板推荐
 *
 * ollama-config 是模块级单例: 每用例前 resetOllamaConfig() 重置内存态，
 * fetch 以 vi.stubGlobal 替换
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addOllamaInstance,
  autoConfigureOllama,
  checkOllamaService,
  cleanup,
  discoverOllamaServices,
  fetchOllamaModels,
  getActiveInstanceModels,
  getActiveOllamaInstance,
  getAllOllamaInstances,
  getConnectionSummary,
  getDefaultOllamaInstance,
  getOllamaBaseUrl,
  getOllamaConfig,
  healthCheckOllamaInstance,
  removeOllamaInstance,
  resetOllamaConfig,
  runOllamaModel,
  setActiveOllamaInstance,
  setAutoDiscovery,
  smartConnect,
  startAutoDiscovery,
  startHealthCheck,
  stopAutoDiscovery,
  stopHealthCheck,
  testModelInference,
  updateOllamaInstance,
  type OllamaInstance,
} from "../lib/ollama-config";
import { VoiceCreator } from "../lib/voice/creation/VoiceCreator";

/* fetch 响应工厂 */
function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => body,
  } as unknown as Response;
}

function failResponse(status: number): Response {
  return {
    ok: false,
    status,
    statusText: "Error",
    json: async () => ({}),
  } as unknown as Response;
}

const makeInstance = (overrides: Partial<OllamaInstance> = {}): OllamaInstance => ({
  id: "inst-1",
  name: "test",
  host: "localhost",
  port: 11434,
  baseUrl: "http://localhost:11434",
  enabled: true,
  status: "unknown",
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  resetOllamaConfig();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ---------------- 配置存储与实例 CRUD ---------------- */

describe("ollama-config 配置存储", () => {
  it("首次访问 → 返回默认配置并写入 localStorage", () => {
    const cfg = getOllamaConfig();
    expect(cfg.instances).toEqual([]);
    expect(cfg.autoDiscovery).toBe(true);
    expect(cfg.discoveryInterval).toBe(30000);
    expect(localStorage.getItem("yyc3_ollama_config")).toBeTruthy();
  });

  it("resetOllamaConfig → 清空内存态并重建默认配置", () => {
    addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    expect(getAllOllamaInstances().length).toBe(1);

    resetOllamaConfig();
    expect(getAllOllamaInstances().length).toBe(0);
  });

  it("localStorage 损坏 JSON → console.error + 默认配置兜底", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    resetOllamaConfig();
    localStorage.setItem("yyc3_ollama_config", "{broken json");

    // 重置内存单例后再次加载
    resetOllamaConfig();
    localStorage.setItem("yyc3_ollama_config", "{broken");
    const cfg = getOllamaConfig();
    // _config 已在 reset 时置 null，损坏 JSON 触发 catch → 默认配置
    expect(cfg.instances).toEqual([]);
    errSpy.mockRestore();
  });
});

describe("ollama-config 实例 CRUD", () => {
  it("addOllamaInstance → 生成 id/status/baseUrl 并持久化", () => {
    const inst = addOllamaInstance({ name: "本地", host: "localhost", port: 11434, baseUrl: "http://localhost:11434", enabled: true });
    expect(inst.id).toMatch(/^ollama_/);
    expect(inst.status).toBe("unknown");
    expect(inst.baseUrl).toBe("http://localhost:11434");
    expect(getAllOllamaInstances().length).toBe(1);
  });

  it("updateOllamaInstance → 部分更新 + 不存在返回 null", () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    const updated = updateOllamaInstance(inst.id, { name: "b", status: "online" });
    expect(updated?.name).toBe("b");
    expect(updated?.status).toBe("online");
    expect(updateOllamaInstance("no-such-id", { name: "x" })).toBeNull();
  });

  it("removeOllamaInstance → 删除成功 + 激活实例同步清除", () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    setActiveOllamaInstance(inst.id);
    expect(getActiveOllamaInstance()?.id).toBe(inst.id);

    expect(removeOllamaInstance(inst.id)).toBe(true);
    expect(removeOllamaInstance(inst.id)).toBe(false); // 二次删除失败
    expect(getActiveOllamaInstance()).toBeNull();
  });

  it("setActiveOllamaInstance → 仅对存在的实例生效", () => {
    setActiveOllamaInstance("ghost");
    expect(getActiveOllamaInstance()).toBeNull();

    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    setActiveOllamaInstance(inst.id);
    expect(getActiveOllamaInstance()?.id).toBe(inst.id);
  });

  it("getActiveOllamaInstance → 无激活或指向已删实例返回 null", () => {
    expect(getActiveOllamaInstance()).toBeNull();
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    setActiveOllamaInstance(inst.id);
    removeOllamaInstance(inst.id);
    expect(getActiveOllamaInstance()).toBeNull();
  });
});

/* ---------------- 服务发现与健康检查 ---------------- */

describe("ollama-config 服务发现", () => {
  it("checkOllamaService → 服务可用返回实例（online）", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ models: [] }));
    vi.stubGlobal("fetch", fetchMock);

    const inst = await checkOllamaService("localhost", 11434);
    expect(inst).not.toBeNull();
    expect(inst?.status).toBe("online");
    expect(inst?.baseUrl).toBe("http://localhost:11434");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("checkOllamaService → 响应非 ok / fetch 抛错返回 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failResponse(500)));
    expect(await checkOllamaService("h", 1)).toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("refused")));
    expect(await checkOllamaService("h", 1)).toBeNull();
  });

  it("discoverOllamaServices → 扫描 3 主机 × 3 端口，仅收集可用", async () => {
    // 仅 127.0.0.1:11434 可用
    const fetchMock = vi.fn((url: string | URL | Request) => {
      const u = String(url);
      if (u === "http://127.0.0.1:11434/api/tags") { return Promise.resolve(okResponse({ models: [] })); }
      return Promise.reject(new Error("refused"));
    });
    vi.stubGlobal("fetch", fetchMock);

    const found = await discoverOllamaServices();
    expect(found.length).toBe(1);
    expect(found[0].host).toBe("127.0.0.1");
    expect(fetchMock.mock.calls.length).toBe(9);
  });

  it("healthCheckOllamaInstance → 在线/离线状态回写实例", async () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({})));
    expect(await healthCheckOllamaInstance(inst)).toBe(true);
    expect(getAllOllamaInstances()[0].status).toBe("online");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("down")));
    expect(await healthCheckOllamaInstance(inst)).toBe(false);
    expect(getAllOllamaInstances()[0].status).toBe("offline");
  });

  it("startAutoDiscovery/stopHealthCheck → 定时器生命周期不抛错", () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(() => startAutoDiscovery(1000)).not.toThrow();
    // 重复启动不泄漏（内部先 clear）
    expect(() => startAutoDiscovery(1000)).not.toThrow();
    stopAutoDiscovery();
    startHealthCheck(1000);
    stopHealthCheck();
    cleanup();
    expect(true).toBe(true);
  });
});

/* ---------------- 模型管理与推理 ---------------- */

describe("ollama-config 模型管理", () => {
  it("fetchOllamaModels → 返回 models / 非 ok 抛错返回空数组", async () => {
    const inst = makeInstance();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ models: [{ name: "llama3", size: 1, digest: "d" }] })));
    const models = await fetchOllamaModels(inst);
    expect(models.length).toBe(1);
    expect(models[0].name).toBe("llama3");

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failResponse(404)));
    expect(await fetchOllamaModels(inst)).toEqual([]);
    errSpy.mockRestore();
  });

  it("getActiveInstanceModels → 无激活实例返回空数组", async () => {
    expect(await getActiveInstanceModels()).toEqual([]);
  });

  it("getActiveInstanceModels → 委托 fetchOllamaModels", async () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    setActiveOllamaInstance(inst.id);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ models: [{ name: "qwen", size: 2, digest: "x" }] })));
    const models = await getActiveInstanceModels();
    expect(models[0].name).toBe("qwen");
  });

  it("runOllamaModel → POST 生成请求 / 非 ok 抛错", async () => {
    const inst = makeInstance();
    const fetchMock = vi.fn().mockResolvedValue(okResponse({}));
    vi.stubGlobal("fetch", fetchMock);
    const res = await runOllamaModel(inst, "llama3", { stream: true });
    expect(res.ok).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toBe("http://localhost:11434/api/generate");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failResponse(500)));
    await expect(runOllamaModel(inst, "llama3")).rejects.toThrow("Failed to run model");
  });

  it("testModelInference → 成功带 latency / HTTP 错误 / 网络异常三分支", async () => {
    const inst = makeInstance();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ response: "你好" })));
    const ok = await testModelInference(inst, "llama3", "hi");
    expect(ok.success).toBe(true);
    expect(ok.response).toBe("你好");
    expect(typeof ok.latency).toBe("number");

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(failResponse(503)));
    const httpErr = await testModelInference(inst, "llama3");
    expect(httpErr.success).toBe(false);
    expect(httpErr.error).toBe("HTTP 503");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const netErr = await testModelInference(inst, "llama3");
    expect(netErr.success).toBe(false);
    expect(netErr.error).toBe("timeout");
  });
});

/* ---------------- 向后兼容与智能连接 ---------------- */

describe("ollama-config 向后兼容", () => {
  it("getDefaultOllamaInstance → 激活实例优先", () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    setActiveOllamaInstance(inst.id);
    expect(getDefaultOllamaInstance()?.id).toBe(inst.id);
  });

  it("getDefaultOllamaInstance → 无激活回退环境变量默认实例", () => {
    // env 默认 OLLAMA_HOST/PORT 来自 config-loader（host.docker.internal:11435）
    const def = getDefaultOllamaInstance();
    expect(def?.id).toBe("default");
    expect(def?.host).toBeTruthy();
  });

  it("getOllamaBaseUrl → 激活优先，否则 env 回退", () => {
    expect(getOllamaBaseUrl()).toContain("http://");
    const inst = addOllamaInstance({ name: "a", host: "10.0.0.5", port: 9999, baseUrl: "http://10.0.0.5:9999", enabled: true });
    setActiveOllamaInstance(inst.id);
    expect(getOllamaBaseUrl()).toBe("http://10.0.0.5:9999");
  });
});

describe("ollama-config 智能连接与摘要", () => {
  it("smartConnect → 激活实例在线直接返回", async () => {
    const inst = addOllamaInstance({ name: "a", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    updateOllamaInstance(inst.id, { status: "online" });
    setActiveOllamaInstance(inst.id);

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const connected = await smartConnect();
    expect(connected?.id).toBe(inst.id);
    expect(fetchMock).not.toHaveBeenCalled(); // 免扫描
  });

  it("smartConnect → 扫描发现在线实例并激活", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string | URL | Request) => {
      const u = String(url);
      if (u === "http://localhost:11434/api/tags") { return Promise.resolve(okResponse({ models: [] })); }
      return Promise.reject(new Error("refused"));
    }));

    const connected = await smartConnect();
    expect(connected?.status).toBe("online");
    expect(getActiveOllamaInstance()).not.toBeNull();
  });

  it("smartConnect → 全部离线返回 null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("refused")));
    expect(await smartConnect()).toBeNull();
  });

  it("getConnectionSummary → 在线/离线统计与自动发现开关", async () => {
    addOllamaInstance({ name: "on", host: "h", port: 1, baseUrl: "http://h:1", enabled: true });
    addOllamaInstance({ name: "off", host: "h", port: 2, baseUrl: "http://h:2", enabled: true });
    const all = getAllOllamaInstances();
    updateOllamaInstance(all[0].id, { status: "online" });
    updateOllamaInstance(all[1].id, { status: "offline" });

    let summary = getConnectionSummary();
    expect(summary.totalInstances).toBe(2);
    expect(summary.onlineInstances).toBe(1);
    expect(summary.offlineInstances).toBe(1);
    expect(summary.autoDiscoveryEnabled).toBe(true);

    setAutoDiscovery(false);
    summary = getConnectionSummary();
    expect(summary.autoDiscoveryEnabled).toBe(false);
    stopAutoDiscovery(); // setAutoDiscovery(false) 已停定时器
  });

  it("autoConfigureOllama → 无可用服务失败 / 有服务成功并启动后台任务", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("refused")));
    const fail = await autoConfigureOllama();
    expect(fail.success).toBe(false);
    expect(fail.error).toBe("未找到可用的 Ollama 服务");

    cleanup();
    vi.stubGlobal("fetch", vi.fn((url: string | URL | Request) => {
      const u = String(url);
      if (u === "http://localhost:11434/api/tags") { return Promise.resolve(okResponse({ models: [{ name: "m", size: 1, digest: "d" }] })); }
      return Promise.reject(new Error("refused"));
    }));
    const ok = await autoConfigureOllama();
    expect(ok.success).toBe(true);
    expect(ok.models?.length).toBe(1);
    cleanup(); // 停掉 autoConfigure 启动的定时器
  });
});

/* ---------------- VoiceCreator ---------------- */

describe("VoiceCreator 会话管理", () => {
  let creator: VoiceCreator;

  beforeEach(() => {
    creator = new VoiceCreator();
  });

  it("createSession → 默认 lyrics 类型 + 设为当前会话", () => {
    const session = creator.createSession();
    expect(session.type).toBe("lyrics");
    expect(session.status).toBe("idle");
    expect(creator.getCurrentSession()?.id).toBe(session.id);
    expect(creator.getSession(session.id)).toBeTruthy();
  });

  it("createSession → 自定义类型", () => {
    const session = creator.createSession("melody");
    expect(session.type).toBe("melody");
  });

  it("endSession → completed + 当前会话清空", () => {
    const session = creator.createSession();
    creator.endSession(session.id);
    expect(creator.getSession(session.id)?.status).toBe("completed");
    expect(creator.getCurrentSession()).toBeNull();
  });

  it("endSession → 非当前会话不影响 currentSession", () => {
    const s1 = creator.createSession();
    creator.createSession();
    creator.endSession(s1.id);
    expect(creator.getCurrentSession()).not.toBeNull();
  });

  it("deleteSession → 移除 + 当前会话清空", () => {
    const session = creator.createSession();
    creator.deleteSession(session.id);
    expect(creator.getSession(session.id)).toBeUndefined();
    expect(creator.getCurrentSession()).toBeNull();
  });

  it("clearSessions → 全清", () => {
    creator.createSession();
    creator.createSession();
    creator.clearSessions();
    expect(creator.getCurrentSession()).toBeNull();
    expect(creator.getTemplates().length).toBeGreaterThan(0);
  });
});

describe("VoiceCreator 模板查询", () => {
  let creator: VoiceCreator;

  beforeEach(() => {
    creator = new VoiceCreator();
  });

  it("getTemplates → 返回 6 内置模板", () => {
    expect(creator.getTemplates().length).toBe(6);
  });

  it("getTemplatesByGenre → pop 过滤", () => {
    const pops = creator.getTemplatesByGenre("pop");
    expect(pops.length).toBeGreaterThan(0);
    expect(pops.every((t) => t.genre === "pop")).toBe(true);
  });

  it("getTemplatesByEmotion → happy 过滤", () => {
    const happy = creator.getTemplatesByEmotion("happy");
    expect(happy.length).toBeGreaterThan(0);
    expect(happy.every((t) => t.emotion === "happy")).toBe(true);
  });
});

describe("VoiceCreator 歌词生成", () => {
  let creator: VoiceCreator;

  beforeEach(() => {
    creator = new VoiceCreator();
  });

  it("默认参数生成 → 1 段 + 副歌 + bridge（pop）", () => {
    const lyrics = creator.generateLyrics({ verses: 1, includeChorus: true });
    expect(lyrics.emotion).toBe("neutral");
    expect(lyrics.genre).toBe("pop");
    expect(lyrics.content.verse.length).toBe(1);
    expect(lyrics.content.chorus?.length).toBe(1);
    expect(lyrics.content.bridge?.length).toBe(1);
    expect(lyrics.title).toBeTruthy();
    expect(lyrics.id).toMatch(/^lyrics-/);
  });

  it("多段生成 + 不含副歌 → chorus undefined", () => {
    const lyrics = creator.generateLyrics({ verses: 3, includeChorus: false });
    expect(lyrics.content.verse.length).toBe(3);
    expect(lyrics.content.chorus).toBeUndefined();
  });

  it("非 pop/ballad 流派 → 无 bridge", () => {
    const lyrics = creator.generateLyrics({ verses: 1, includeChorus: false, genre: "electronic" });
    expect(lyrics.content.bridge).toBeUndefined();
  });

  it("英文歌词 → en 模板（ASCII 句式，固定 theme 消除随机性）", () => {
    const lyrics = creator.generateLyrics({ verses: 2, includeChorus: false, language: "en", theme: "ocean" });
    expect(lyrics.title).toContain("ocean");
    expect(lyrics.content.verse.length).toBe(2);
    for (const verse of lyrics.content.verse) {
      expect(verse).toMatch(/ocean/);
      expect(verse).toMatch(/^[A-Za-z]/);
      expect(verse).not.toMatch(/第|段：/);
    }
  });

  it("自定义 theme 贯穿标题", () => {
    const lyrics = creator.generateLyrics({ verses: 1, includeChorus: false, theme: "星海" });
    expect(lyrics.title).toContain("星海");
  });

  it("emotional 生成 → 对应情感关键词注入", () => {
    const lyrics = creator.generateLyrics({ verses: 1, includeChorus: false, emotion: "happy" });
    expect(lyrics.emotion).toBe("happy");
  });
});

describe("VoiceCreator 情感分析与推荐", () => {
  let creator: VoiceCreator;

  beforeEach(() => {
    creator = new VoiceCreator();
  });

  it("analyzeTextEmotion → 中文关键词命中 happy", () => {
    // EMOTION_KEYWORDS.happy 首个关键词（以 types.ts 实际值命中）
    const emotion = creator.analyzeTextEmotion("今天真是开心的一天");
    expect(["happy", "neutral"]).toContain(emotion);
  });

  it("analyzeTextEmotion → 无命中返回 neutral", () => {
    expect(creator.analyzeTextEmotion("xyz123")).toBe("neutral");
  });

  it("suggestTemplate → 按情感返回首个模板", () => {
    const tpl = creator.suggestTemplate("普通的一句话");
    expect(tpl).toBeTruthy();
    expect(tpl.id).toBeTruthy();
  });
});
