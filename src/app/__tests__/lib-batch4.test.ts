/**
 * lib-batch4.test.ts
 * ==================
 * lib 域攻坚批六: MusicEmotionAnalyzer（emotion 0.86%）/ voice profiles（0%）/ network-utils（47%）
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_NETWORK_CONFIG,
  generateWsUrl,
  getLocalIP,
  getNetworkInterfaces,
  loadNetworkConfig,
  resetNetworkConfig,
  saveNetworkConfig,
  testHTTPConnection,
  testWebSocketConnection,
} from "../lib/network-utils";
import { MusicEmotionAnalyzer } from "../lib/voice/emotion/MusicEmotionAnalyzer";
import type { MusicFeatures } from "../lib/voice/emotion/types";
import {
  DEFAULT_FAMILY_PROFILE,
  FAMILY_VOICE_PROFILES,
  getFamilyVoiceProfile,
  getFamilyVoiceProfiles,
} from "../lib/voice/profiles/familyProfiles";
import {
  DEFAULT_MUSIC_PROFILE,
  MUSIC_VOICE_COMMANDS,
  MUSIC_VOICE_PROFILES,
  getMusicVoiceProfile,
  getMusicVoiceProfiles,
} from "../lib/voice/profiles/musicProfiles";

/* ================= MusicEmotionAnalyzer ================= */

describe("MusicEmotionAnalyzer", () => {
  const analyzer = new MusicEmotionAnalyzer();

  const features = (over: Partial<MusicFeatures> = {}): MusicFeatures => ({
    tempo: 120,
    energy: 0.5,
    danceability: 0.5,
    valence: 0.5,
    acousticness: 0.5,
    instrumentalness: 0.5,
    loudness: -10,
    mode: "major",
    key: "C",
    ...over,
  });

  it("analyzeFeatures: 高能快节奏 → energetic/happy", () => {
    const r = analyzer.analyzeFeatures(features({ tempo: 140, energy: 0.9, valence: 0.85 }));
    expect(r.primaryEmotion).toBe("happy");
    expect(r.mood).toBe("energetic");
    expect(r.confidence).toBeGreaterThan(0);
    expect(Array.isArray(r.tags)).toBe(true);
  });

  it("analyzeFeatures: 低能低律动 → melancholic/sad", () => {
    const r = analyzer.analyzeFeatures(
      features({ tempo: 70, energy: 0.2, valence: 0.1, mode: "minor" })
    );
    expect(r.primaryEmotion).toBe("sad");
    expect(r.mood).toBe("melancholic");
  });

  it("analyzeFeatures: 明亮慢板 → mood 枚举内不抛错", () => {
    const r = analyzer.analyzeFeatures(features({ tempo: 90, energy: 0.3, valence: 0.5 }));
    expect(["calm", "melancholic", "romantic", "dark"]).toContain(r.mood);
    expect(r.features.tempo).toBe(90);
  });

  it("analyzeFeatures: 高律动高声学 → tags 含 danceable/acoustic/instrumental", () => {
    const r = analyzer.analyzeFeatures(
      features({ tempo: 150, energy: 0.85, danceability: 0.9, acousticness: 0.8, instrumentalness: 0.6 })
    );
    expect(r.tags).toContain("danceable");
    expect(r.tags).toContain("acoustic");
    expect(r.tags).toContain("instrumental");
  });

  it("analyzePlaylist: 空列表 → trackCount 0 + 默认特征", () => {
    const r = analyzer.analyzePlaylist([], "空歌单");
    expect(r.trackCount).toBe(0);
    expect(r.name).toBe("空歌单");
    expect(r.averageFeatures.tempo).toBe(120);
    expect(r.dominantEmotions).toEqual([]);
    expect(r.recommendations).toEqual([]);
  });

  it("analyzePlaylist: 多曲聚合 → 平均特征 + 主导情感 + 推荐", () => {
    const tracks = [
      features({ tempo: 130, energy: 0.9, valence: 0.9, danceability: 0.8 }),
      features({ tempo: 135, energy: 0.85, valence: 0.8, mode: "major" }),
      features({ tempo: 125, energy: 0.8, valence: 0.85 }),
    ];
    const r = analyzer.analyzePlaylist(tracks, "运动歌单");
    expect(r.trackCount).toBe(3);
    expect(r.averageFeatures.tempo).toBeCloseTo(130, 0);
    expect(r.averageFeatures.mode).toBe("major");
    expect(r.dominantEmotions.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect((r.moodDistribution["energetic"] ?? 0) + (r.moodDistribution["upbeat"] ?? 0)).toBeGreaterThanOrEqual(1);
  });

  it("analyzePlaylist: 中性特征 → 兜底推荐「适合日常聆听」", () => {
    const r = analyzer.analyzePlaylist([features({ energy: 0.5 })], "平缓");
    expect(r.recommendations).toContain("适合日常聆听");
  });

  it("getRecommendedTracks: 按 happy 映射生成 N 首 / 未在映射表的情感 → 空", () => {
    const tracks = analyzer.getRecommendedTracks("happy", 5);
    expect(tracks).toHaveLength(5);
    for (const t of tracks) {
      expect(t.tempo).toBeGreaterThanOrEqual(100);
      expect(t.tempo).toBeLessThanOrEqual(140);
    }
    // EmotionType 7 值均在映射表中 → !mapping 分支以非法值探测健壮性
    expect(analyzer.getRecommendedTracks("unknown-emotion" as never, 3)).toEqual([]);
  });

  it("initialize: jsdom 缺 AudioContext 实现 → false，destroy 安全", async () => {
    await expect(analyzer.initialize()).resolves.toBe(false);
    analyzer.destroy();
  });

  it("initialize+destroy: mock AudioContext 生命周期", async () => {
    const closeMock = vi.fn();
    class FakeAudioContext {
      createAnalyser = vi.fn(() => ({ fftSize: 0 }));
      fftSize = 0;
      close = closeMock;
    }
    vi.stubGlobal("AudioContext", FakeAudioContext);
    const a2 = new MusicEmotionAnalyzer();
    await expect(a2.initialize()).resolves.toBe(true);
    a2.destroy();
    expect(closeMock).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });
});

/* ================= voice profiles ================= */

describe("voice profiles (family + music)", () => {
  it("FAMILY_VOICE_PROFILES: 8 成员 + 默认项为千行", () => {
    expect(FAMILY_VOICE_PROFILES).toHaveLength(8);
    expect(DEFAULT_FAMILY_PROFILE.memberId).toBe("navigator");
    expect(DEFAULT_FAMILY_PROFILE.name).toBe("言启·千行");
  });

  it("getFamilyVoiceProfile: 命中/未命中", () => {
    expect(getFamilyVoiceProfile("thinker")?.memberName).toBe("万物");
    expect(getFamilyVoiceProfile("ghost")).toBeUndefined();
  });

  it("getFamilyVoiceProfiles 返回全量数组", () => {
    expect(getFamilyVoiceProfiles()).toHaveLength(FAMILY_VOICE_PROFILES.length);
  });

  it("MUSIC_VOICE_PROFILES: 4 场景 + 默认为陪伴模式", () => {
    expect(MUSIC_VOICE_PROFILES).toHaveLength(4);
    expect(DEFAULT_MUSIC_PROFILE.scene).toBe("companion");
    expect(DEFAULT_MUSIC_PROFILE.name).toBe("陪伴模式");
  });

  it("getMusicVoiceProfile: dj/narrator/announcer 场景命中", () => {
    expect(getMusicVoiceProfile("dj")?.id).toBe("dj-voice");
    expect(getMusicVoiceProfile("narrator")?.id).toBe("narrator-voice");
    expect(getMusicVoiceProfile("announcer")?.id).toBe("announcer-voice");
    expect(getMusicVoiceProfile("ghost")).toBeUndefined();
  });

  it("MUSIC_VOICE_COMMANDS: 中英指令表结构与别名解析关键字段", () => {
    expect(MUSIC_VOICE_COMMANDS.zh.length).toBeGreaterThanOrEqual(14);
    expect(MUSIC_VOICE_COMMANDS.en.length).toBeGreaterThanOrEqual(17);

    const playZh = MUSIC_VOICE_COMMANDS.zh.find((c) => c.action === "play")!;
    expect(playZh.cmd).toBe("播放");
    expect(playZh.aliases).toContain("继续");

    const nextEn = MUSIC_VOICE_COMMANDS.en.find((c) => c.action === "next")!;
    expect(nextEn.aliases).toContain("skip");
  });

  it("getMusicVoiceProfiles 返回全量", () => {
    expect(getMusicVoiceProfiles()).toHaveLength(4);
  });
});

/* ================= network-utils ================= */

describe("network-utils", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("generateWsUrl: ws:// + /ws 后缀拼接", () => {
    expect(generateWsUrl("192.168.1.10", "8080")).toBe("ws://192.168.1.10:8080/ws");
  });

  it("DEFAULT_NETWORK_CONFIG: 内部一致性（wsUrl 由 address+port 推导）", () => {
    expect(DEFAULT_NETWORK_CONFIG.wsUrl).toBe(generateWsUrl(DEFAULT_NETWORK_CONFIG.serverAddress, DEFAULT_NETWORK_CONFIG.port));
    expect(DEFAULT_NETWORK_CONFIG.mode).toBe("auto");
  });

  it("loadNetworkConfig: 无存储 → 默认配置", () => {
    expect(loadNetworkConfig()).toEqual(DEFAULT_NETWORK_CONFIG);
  });

  it("saveNetworkConfig → loadNetworkConfig 往返持久化", () => {
    const cfg = { ...DEFAULT_NETWORK_CONFIG, port: "9999" };
    saveNetworkConfig(cfg);
    expect(loadNetworkConfig().port).toBe("9999");
  });

  it("loadNetworkConfig: 损坏 JSON → 回退默认", () => {
    localStorage.setItem("network_config", "{broken json");
    expect(loadNetworkConfig()).toEqual(DEFAULT_NETWORK_CONFIG);
  });

  it("resetNetworkConfig: 清存储回默认", () => {
    saveNetworkConfig({ ...DEFAULT_NETWORK_CONFIG, port: "1234" });
    const cfg = resetNetworkConfig();
    expect(cfg).toEqual(DEFAULT_NETWORK_CONFIG);
    expect(loadNetworkConfig()).toEqual(DEFAULT_NETWORK_CONFIG);
  });

  it("getLocalIP: WebRTC offer.sdp 含 IP → 提取成功", async () => {
    const closeMock = vi.fn();
    const offerMock = vi.fn().mockResolvedValue({ sdp: "v=0\nc=IN IP4 10.0.0.42" });
    class FakePC {
      createDataChannel = vi.fn();
      createOffer = offerMock;
      setLocalDescription = vi.fn().mockResolvedValue(undefined);
      close = closeMock;
    }
    vi.stubGlobal("RTCPeerConnection", FakePC);
    await expect(getLocalIP()).resolves.toBe("10.0.0.42");
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("getLocalIP: sdp 为空 / 无 RTCPeerConnection → 127.0.0.1 兜底", async () => {
    class EmptySdpPC {
      createDataChannel = vi.fn();
      createOffer = vi.fn().mockResolvedValue({ sdp: "" });
      setLocalDescription = vi.fn().mockResolvedValue(undefined);
      close = vi.fn();
    }
    vi.stubGlobal("RTCPeerConnection", EmptySdpPC);
    await expect(getLocalIP()).resolves.toBe("127.0.0.1");

    vi.stubGlobal("RTCPeerConnection", undefined);
    await expect(getLocalIP()).resolves.toBe("127.0.0.1");
  });

  it("getNetworkInterfaces: 4g 判定 WiFi + 真实 IP 追加 lo0", async () => {
    class FakePC {
      createDataChannel = vi.fn();
      createOffer = vi.fn().mockResolvedValue({ sdp: "c=IN IP4 10.0.0.42" });
      setLocalDescription = vi.fn().mockResolvedValue(undefined);
      close = vi.fn();
    }
    vi.stubGlobal("RTCPeerConnection", FakePC);
    Object.defineProperty(navigator, "connection", {
      value: { effectiveType: "4g" },
      configurable: true,
    });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    const interfaces = await getNetworkInterfaces();
    expect(interfaces[0]).toMatchObject({ name: "wlan0", type: "WiFi", ip: "10.0.0.42", status: "active" });
    expect(interfaces[1]).toMatchObject({ name: "lo0", ip: "127.0.0.1" });
  });

  it("getNetworkInterfaces: 127.0.0.1 时无 lo0 追加", async () => {
    vi.stubGlobal("RTCPeerConnection", undefined);
    Object.defineProperty(navigator, "connection", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    const interfaces = await getNetworkInterfaces();
    expect(interfaces).toHaveLength(1);
    expect(interfaces[0].name).toBe("en0");
  });

  it("testWebSocketConnection: open → success true + latency", async () => {
    vi.stubGlobal(
      "WebSocket",
      class {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
        constructor() {
          setTimeout(() => this.onopen?.(), 0);
        }
        close() { }
      }
    );
    const r = await testWebSocketConnection("ws://127.0.0.1:9999", 1000);
    expect(r.success).toBe(true);
    expect(r.error).toBeUndefined();
  });

  it("testWebSocketConnection: error → success false + 错误信息", async () => {
    vi.stubGlobal(
      "WebSocket",
      class {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
        constructor() {
          setTimeout(() => this.onerror?.(), 0);
        }
      }
    );
    const r = await testWebSocketConnection("ws://127.0.0.1:9999", 1000);
    expect(r.success).toBe(false);
    expect(r.error).toBe("连接被拒绝");
  });

  it("testWebSocketConnection: 超时 → false + 连接超时", async () => {
    vi.stubGlobal(
      "WebSocket",
      class {
        onopen: (() => void) | null = null;
        onerror: (() => void) | null = null;
        onclose: (() => void) | null = null;
      }
    );
    const r = await testWebSocketConnection("ws://127.0.0.1:9999", 50);
    expect(r.success).toBe(false);
    expect(r.error).toBe("连接超时");
  });

  it("testHTTPConnection: ok → success true", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const r = await testHTTPConnection("http://localhost:9999", 1000);
    expect(r.success).toBe(true);
  });

  it("testHTTPConnection: reject → false + 网络不可达", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("net down")));
    const r = await testHTTPConnection("http://localhost:9999", 1000);
    expect(r.success).toBe(false);
    expect(r.error).toBe("网络不可达");
  });
});
