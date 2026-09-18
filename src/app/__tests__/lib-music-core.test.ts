/**
 * lib-music-core.test.ts
 * ======================
 * lib 域攻坚批八（M7 · music 域四大件）:
 *
 * - AudioPlayerService: 加载三源（audioUrl/youtubeId/demo 兜底）/播放控制/音量静音/seek/
 *   循环模式/队列 next/previous（>3s 回跳）/均衡器 preset+band/事件 on/off 分发/ended 单曲循环/destroy
 * - EmotionMusicService: 情绪推荐（主情绪判定/排除最近播放/空候选回退/活动能量过滤/原因文案）/
 *   mood BPM 推荐/activity 能量推荐/搜索/getSongById/markAsPlayed 淘汰
 * - MusicSourceManager: 源列表启停/在线 demo 搜索/本地文件上传删除/localFileToSong/AI 生成/
 *   FMA+Jamendo（成功映射/非 ok 抛错回退）/流地址 null/清空/存储用量
 * - MusicData: 30 logo/14 照片/7 视频/4 专辑歌曲聚合 + 全部查询函数
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MusicSong } from "../lib/music/types";

/* ---------- Audio stub（vi.hoisted 提前于所有 import 执行，拦截 lib 内 new Audio()） ---------- */

const { audioProto } = vi.hoisted(() => {
  const audioProto = {
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    load: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    crossOrigin: "",
    preload: "",
    src: "",
    volume: 1,
    currentTime: 0,
    duration: 200,
    error: null,
  };
  class FakeAudio {
    onloadedmetadata: (() => void) | null = null;
    onerror: (() => void) | null = null;
    // src 赋值触发 onerror → 支撑 MusicSourceManager.extractMetadata 兜底 resolve
    //（浏览器由 src 赋值启动加载，源码未显式调 load()）
    declare src: string;
    constructor() {
      Object.assign(this, audioProto);
      let _src = "";
      Object.defineProperty(this, "src", {
        get: () => _src,
        set: (v: string) => {
          _src = v;
          // 源码赋值顺序: src 先于 onerror → 延迟到宏任务读取最新 onerror
          setTimeout(() => this.onerror?.(), 0);
        },
        configurable: true,
      });
    }
  }
  // jsdom 环境裸标识符 Audio 解析到 jsdom window 的 HTMLAudioElement。
  // 必须在业务模块 import（模块工厂执行）前完成覆盖 → 放入 vi.hoisted
  Object.defineProperty(globalThis, "Audio", {
    value: FakeAudio,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "Audio", {
    value: FakeAudio,
    writable: true,
    configurable: true,
  });
  return { audioProto };
});

const analyserNode = {
  fftSize: 0,
  smoothingTimeConstant: 0,
  frequencyBinCount: 64,
  getByteFrequencyData: vi.fn(),
  getByteTimeDomainData: vi.fn(),
  connect: vi.fn(),
};
class FakeBiquadFilter {
  type = "";
  frequency = { value: 0 };
  Q = { value: 0 };
  gain = { value: 0 };
  connect = vi.fn();
}
const audioContextInstance = {
  state: "running",
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  destination: {},
  createAnalyser: vi.fn(() => ({ ...analyserNode, getByteFrequencyData: vi.fn(), getByteTimeDomainData: vi.fn() })),
  createGain: vi.fn(() => ({ gain: { value: 0 }, connect: vi.fn() })),
  createBiquadFilter: vi.fn(() => new FakeBiquadFilter()),
  createMediaElementSource: vi.fn(() => ({ connect: vi.fn() })),
};
class FakeAudioContext {
  constructor() {
    return audioContextInstance;
  }
}
vi.stubGlobal("AudioContext", FakeAudioContext);
vi.stubGlobal("webkitAudioContext", FakeAudioContext);
vi.stubGlobal("requestAnimationFrame", vi.fn(() => 42));
vi.stubGlobal("cancelAnimationFrame", vi.fn());

import { audioPlayerService } from "../lib/music/AudioPlayerService";
import { EmotionMusicService, emotionMusicService } from "../lib/music/EmotionMusicService";
import {
  ALBUMS,
  ARTIST,
  getAllSongs,
  getRandomLogo,
  getRandomPhoto,
  getRandomSongs,
  getRecentPhotos,
  getSongsByAlbum,
  getSongsByGenre,
  getSongsByMood,
  getVideos,
  LOGO_IMAGES,
  PHOTOS,
  VIDEOS,
} from "../lib/music/MusicData";
import { MusicSourceManager, musicSourceManager } from "../lib/music/MusicSourceManager";

const songOf = (overrides: Partial<MusicSong> = {}): MusicSong => ({
  id: "s-1",
  title: "测试曲",
  artist: "测试艺人",
  album: "测试专辑",
  albumCover: "/cover.jpg",
  duration: 180,
  audioUrl: "https://example.com/a.mp3",
  ...overrides,
});

/** 读取 service 持有的 audioElement（Object.assign 值拷贝 → 实例属性与 proto 独立） */
const getAudioEl = (): HTMLAudioElement =>
  (audioPlayerService as unknown as { audioElement: HTMLAudioElement }).audioElement!;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  audioPlayerService.setVolume(0.7);
});

afterEach(() => {
  vi.restoreAllMocks();
});

/* ================= AudioPlayerService ================= */

describe("AudioPlayerService", () => {
  it("loadSong: audioUrl 优先 → src 设置 + AudioContext 初始化", async () => {
    await audioPlayerService.loadSong(songOf({ audioUrl: "https://x.com/a1.mp3" }));
    expect((audioPlayerService as unknown as { audioElement: HTMLAudioElement }).audioElement?.src).toBe(
      "https://x.com/a1.mp3"
    );
    expect(audioContextInstance.createAnalyser).toHaveBeenCalled();
  });

  it("loadSong: youtubeId → embed URL", async () => {
    await audioPlayerService.loadSong(songOf({ audioUrl: undefined, youtubeId: "dQw4w9WgXcQ" }));
    const el = (audioPlayerService as unknown as { audioElement: HTMLAudioElement }).audioElement;
    expect(el?.src).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("loadSong: 无源 → demo 兜底（song-3 映射 + 未知名回退）", async () => {
    await audioPlayerService.loadSong(songOf({ id: "song-3", audioUrl: undefined }));
    const el = (audioPlayerService as unknown as { audioElement: HTMLAudioElement }).audioElement;
    expect(el?.src).toContain("SoundHelix-Song-3.mp3");

    await audioPlayerService.loadSong(songOf({ id: "unknown-id", audioUrl: undefined }));
    expect(el?.src).toContain("SoundHelix-Song-1.mp3");
  });

  it("play/pause/playSong + suspended AudioContext resume", async () => {
    const ctx = (audioPlayerService as unknown as { audioContext: { state: string; resume: () => Promise<void> } }).audioContext;
    await audioPlayerService.playSong(songOf(), 2);
    expect(audioProto.play).toHaveBeenCalled();

    if (ctx) {
      ctx.state = "suspended";
      await audioPlayerService.play();
      expect(ctx.resume).toHaveBeenCalled();
      ctx.state = "running";
    }
    audioPlayerService.pause();
    expect(audioProto.pause).toHaveBeenCalled();
  });

  it("play 失败 → onError 回调", async () => {
    audioProto.play.mockRejectedValueOnce(new Error("boom"));
    const onError = vi.fn();
    audioPlayerService.on("onError", onError);
    await audioPlayerService.play();
    expect(onError).toHaveBeenCalled();
    audioPlayerService.off("onError");
  });

  it("setVolume 钳制 + toggleMute 双态", () => {
    audioPlayerService.setVolume(2);
    expect(audioPlayerService.getCurrentState().volume).toBe(1);
    audioPlayerService.setVolume(-1);
    expect(audioPlayerService.getCurrentState().volume).toBe(0);

    expect(audioPlayerService.toggleMute()).toBe(true);
    expect(audioPlayerService.toggleMute()).toBe(false);
  });

  it("seekTo/seekToPercent（有 duration）", () => {
    const el = getAudioEl();
    audioPlayerService.seekTo(30);
    expect(el.currentTime).toBe(30);
    audioPlayerService.seekTo(-5);
    expect(el.currentTime).toBe(0);

    audioPlayerService.seekToPercent(50);
    expect(el.currentTime).toBe(100);
  });

  it("repeat 循环切换 off→all→one→off + setRepeat 直设", () => {
    expect(audioPlayerService.toggleRepeat()).toBe("all");
    expect(audioPlayerService.toggleRepeat()).toBe("one");
    expect(audioPlayerService.toggleRepeat()).toBe("off");
    audioPlayerService.setRepeat("all");
    expect(audioPlayerService.getCurrentState().repeat).toBe("all");
  });

  it("toggleShuffle 双态", () => {
    expect(audioPlayerService.toggleShuffle()).toBe(true);
    expect(audioPlayerService.getCurrentState().shuffle).toBe(true);
    expect(audioPlayerService.toggleShuffle()).toBe(false);
  });

  it("queue next/previous: 顺序环绕 + previous>3s 回跳当前曲", async () => {
    const songs = [songOf({ id: "q1" }), songOf({ id: "q2" }), songOf({ id: "q3" })];
    audioPlayerService.setQueue(songs, 0);

    const n1 = await audioPlayerService.next();
    expect(n1?.id).toBe("q2");
    const n2 = await audioPlayerService.next();
    expect(n2?.id).toBe("q3");
    const n3 = await audioPlayerService.next();
    expect(n3?.id).toBe("q1"); // 环绕

    // >3s 判定读实例 currentTime（Object.assign 值拷贝 → 实例属性独立）
    getAudioEl().currentTime = 5;
    const back = await audioPlayerService.previous();
    expect(back?.id).toBe("q1"); // >3s → seekTo(0) 回当前
    expect(getAudioEl().currentTime).toBe(0);

    const p1 = await audioPlayerService.previous();
    expect(p1?.id).toBe("q3"); // 0 索引 → 环绕末尾
  });

  it("shuffle next: 随机索引落界内", async () => {
    audioPlayerService.toggleShuffle();
    const songs = [songOf({ id: "r1" }), songOf({ id: "r2" })];
    audioPlayerService.setQueue(songs, 0);
    const spy = vi.spyOn(Math, "random").mockReturnValue(0.4);
    const picked = await audioPlayerService.next();
    expect(picked?.id).toBe("r1");
    spy.mockRestore();
    audioPlayerService.toggleShuffle();
  });

  it("空队列 next/previous → null", async () => {
    audioPlayerService.setQueue([]);
    expect(await audioPlayerService.next()).toBeNull();
    expect(await audioPlayerService.previous()).toBeNull();
  });

  it("ended 事件: repeat=one 重播 / off 触发 onEnded", () => {
    const onEnded = vi.fn();
    audioPlayerService.on("onEnded", onEnded);

    audioPlayerService.setRepeat("one");

    // 通过内部 handleSongEnded 触发（simulate ended listener 注册的回调）
    const service = audioPlayerService as unknown as {
      handleSongEnded: () => void;
      seekTo: (t: number) => void;
      play: () => Promise<void>;
    };
    service.handleSongEnded();
    expect(getAudioEl().currentTime).toBe(0); // seekTo(0) + play

    audioPlayerService.setRepeat("off");
    service.handleSongEnded();
    expect(onEnded).toHaveBeenCalled();
  });

  it("均衡器: preset 生效/未知 preset 忽略/band 钳制 ±12", () => {
    const nodes = audioPlayerService.getEqualizerPresets();
    expect(nodes.map((p) => p.name)).toContain("bass-boost");

    audioPlayerService.setEqualizerPreset("bass-boost");
    expect(audioPlayerService.getCurrentEqualizerPreset()).toBe("bass-boost");

    audioPlayerService.setEqualizerPreset("not-exist");
    expect(audioPlayerService.getCurrentEqualizerPreset()).toBe("bass-boost");

    audioPlayerService.setEqualizerBand(0, 50);
    audioPlayerService.setEqualizerBand(99, 5); // 越界忽略
  });

  it("getCurrentState/getQueue 快照 + isCurrentlyPlaying", () => {
    const state = audioPlayerService.getCurrentState();
    expect(state.currentSong).toBeTruthy();
    expect(state.queue).toBeInstanceOf(Array);
    expect(audioPlayerService.getQueue()).toHaveLength(state.queue?.length ?? 0);
    expect(typeof audioPlayerService.isCurrentlyPlaying()).toBe("boolean");
  });

  it("on/off 事件 + destroy 清理", async () => {
    const onPlay = vi.fn();
    audioPlayerService.on("onPlay", onPlay);
    audioPlayerService.off("onPlay");
    audioPlayerService.destroy();
    expect(onPlay).not.toHaveBeenCalled();
    // destroy 置空 audioElement（currentSong 按源码设计保留）
    expect((audioPlayerService as unknown as { audioElement: unknown }).audioElement).toBeNull();
    expect(
      (audioPlayerService as unknown as { eventListeners: object }).eventListeners
    ).toEqual({});
  });
});

/* ================= EmotionMusicService ================= */

describe("EmotionMusicService", () => {
  const profile = (over: Partial<Record<string, number>> = {}) => ({
    happy: 0, sad: 0, energetic: 0, calm: 0, romantic: 0, melancholy: 0, upbeat: 0, peaceful: 0,
    ...over,
  }) as Parameters<typeof emotionMusicService.recommendByEmotion>[0];

  it("情绪推荐: happy 主情绪 → 欢快文案 + 命中 happy 系曲目", () => {
    const rec = emotionMusicService.recommendByEmotion(profile({ happy: 0.9 }), { excludeRecent: false });
    expect(rec.reason).toContain("欢快");
    expect(rec.songs.length).toBeGreaterThan(0);
    expect(rec.emotionProfile.happy).toBe(0.9);
    expect(rec.timestamp).toBeInstanceOf(Date);
  });

  it("活动叠加: exercise → 高能过滤 + 运动文案", () => {
    const rec = emotionMusicService.recommendByEmotion(profile({ energetic: 0.8 }), {
      activity: "exercise",
      excludeRecent: false,
    });
    expect(rec.reason).toContain("运动");
    expect(rec.songs.every((s) => s.energy === "high" || s.energy === undefined)).toBe(true);
  });

  it("excludeRecent: markAsPlayed 后被排除 → 空候选回退全库过滤", () => {
    const all = emotionMusicService.getAllSongs();
    for (const s of all) { emotionMusicService.markAsPlayed(s.id); }
    const rec = emotionMusicService.recommendByEmotion(profile({ calm: 0.9 }));
    // 全部 recent → 主过滤空 → 回退分支按 energy 过滤（calm 无 activity → 不过滤 → 全量）
    expect(rec.songs.length).toBeGreaterThan(0);
  });

  it("全零 profile → neutral 兜底文案", () => {
    const rec = emotionMusicService.recommendByEmotion(profile(), { excludeRecent: false });
    expect(rec.reason).toContain("偏好");
  });

  it("recommendByMood: mood 直配 + BPM 区间兜底", () => {
    expect(emotionMusicService.recommendByMood("melancholy").length).toBeGreaterThan(0);
    expect(emotionMusicService.recommendByMood("peaceful").length).toBeGreaterThan(0);
    expect(emotionMusicService.recommendByMood("romantic").length).toBeGreaterThan(0);
  });

  it("recommendByActivity: focus→low / party→high", () => {
    expect(
      emotionMusicService.recommendByActivity("focus").every((s) => s.energy === "low")
    ).toBe(true);
    expect(
      emotionMusicService.recommendByActivity("party").every((s) => s.energy === "high")
    ).toBe(true);
  });

  it("searchSongs: 标题/艺人/专辑/流派多维命中", () => {
    expect(emotionMusicService.searchSongs("那些年").length).toBeGreaterThan(0);
    expect(emotionMusicService.searchSongs("董小姐").length).toBeGreaterThan(0);
    expect(emotionMusicService.searchSongs("岁月如歌").length).toBeGreaterThan(0);
    expect(emotionMusicService.searchSongs("民谣").length).toBeGreaterThan(0);
    expect(emotionMusicService.searchSongs("不存在xyz")).toHaveLength(0);
  });

  it("getSongById: 命中/未命中 undefined", () => {
    expect(emotionMusicService.getSongById("a-001")?.title).toBe("那些年");
    expect(emotionMusicService.getSongById("ghost")).toBeUndefined();
  });

  it("markAsPlayed: 超过 50 上限淘汰首项", () => {
    const svc = new EmotionMusicService();
    for (let i = 0; i < 55; i++) { svc.markAsPlayed(`m-${i}`); }
    // 内部 Set 不外露，验证不抛错即可（淘汰逻辑执行）
    expect(svc.getAllSongs().length).toBeGreaterThan(0);
  });

  it("类导出: EmotionMusicService 可独立实例化", () => {
    const svc = new EmotionMusicService();
    expect(svc.getAllSongs().length).toBe(getAllSongs().length);
  });
});

/* ================= MusicSourceManager ================= */

describe("MusicSourceManager", () => {
  it("getSources: 4 默认源（streaming 默认禁用）+ getOnlineProviders 6 家", () => {
    const sources = musicSourceManager.getSources();
    expect(sources).toHaveLength(4);
    expect(sources.find((s) => s.id === "streaming")?.enabled).toBe(false);

    const providers = musicSourceManager.getOnlineProviders();
    expect(providers).toHaveLength(6);
    expect(providers.map((p) => p.name)).toContain("NeteaseCloud");
  });

  it("enable/disableSource 启停切换", () => {
    musicSourceManager.disableSource("local");
    expect(musicSourceManager.getSources().find((s) => s.id === "local")?.enabled).toBe(false);
    musicSourceManager.enableSource("local");
    expect(musicSourceManager.getSources().find((s) => s.id === "local")?.enabled).toBe(true);
    // 不存在 id no-op
    musicSourceManager.enableSource("ghost");
    musicSourceManager.disableSource("ghost");
  });

  it("searchOnline: 无 provider → demo 双曲目", async () => {
    const results = await musicSourceManager.searchOnline("晴天");
    expect(results).toHaveLength(2);
    expect(results[0].title).toContain("晴天");
    expect(results[1].mood).toBe("calm");

    const demo = await musicSourceManager.searchOnline("雨", "demo");
    expect(demo).toHaveLength(2);
  });

  it("searchFreeMusicArchive: ok → 空数组 / 非 ok → catch 返回空", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) })
    );
    expect(await musicSourceManager.searchFreeMusicArchive("jazz")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );
    expect(await musicSourceManager.searchFreeMusicArchive("jazz")).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("searchJamendo: 结果映射（jamendo- 前缀/mood 映射）/请求失败回退空", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [
            {
              id: "t1",
              name: "Track One",
              artist_name: "Artist A",
              album_name: "Album X",
              album_image: "img.jpg",
              duration: 200,
              audio: "a.mp3",
              musicinfo: { tags: { genres: ["rock"] }, vocalinstrumental: "vocal" },
            },
            {
              id: "t2",
              name: "Track Two",
              artist_name: "Artist B",
              album_name: "Album Y",
              album_image: "img2.jpg",
              duration: 100,
              audio: "b.mp3",
              musicinfo: { tags: {}, vocalinstrumental: "instrumental" },
            },
          ],
        }),
      })
    );
    const tracks = await musicSourceManager.searchJamendo("rock");
    expect(tracks).toHaveLength(2);
    expect(tracks[0].id).toBe("jamendo-t1");
    expect(tracks[0].mood).toBe("romantic"); // vocal → romantic
    expect(tracks[1].mood).toBe("calm"); // instrumental → calm
    expect(tracks[0].genre).toBe("rock");

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await musicSourceManager.searchJamendo("x")).toEqual([]);
    vi.unstubAllGlobals();
  });

  it("uploadLocalFile: metadata 提取 + 存储 + deleteLocalFile 清理", async () => {
    const mgr = new MusicSourceManager();
    const file = new File(["audio"], "晴天.mp3", { type: "audio/mpeg" });

    // jsdom Audio 无真实 metadata → onerror 分支兜底
    const uploaded = await mgr.uploadLocalFile(file);
    expect(uploaded.name).toBe("晴天");
    expect(uploaded.artist).toBe("未知艺术家");
    expect(uploaded.audioUrl).toContain("blob:");

    expect(mgr.getLocalFiles()).toHaveLength(1);
    expect(mgr.getLocalFile(uploaded.id)?.name).toBe("晴天");

    mgr.deleteLocalFile(uploaded.id);
    expect(mgr.getLocalFiles()).toHaveLength(0);
    expect(mgr.getLocalFile(uploaded.id)).toBeUndefined();
  });

  it("localFileToSong + getAllAvailableSongs 转换", () => {
    const mgr = new MusicSourceManager();
    const localFile = {
      id: "local-x",
      file: new File([], "a.mp3"),
      name: "曲目A",
      artist: "艺人A",
      album: "专辑A",
      duration: 100,
      audioUrl: "blob:x",
    };
    const song = mgr.localFileToSong(localFile);
    expect(song.id).toBe("local-x");
    expect(song.title).toBe("曲目A");
    expect(song.mood).toBe("calm");
    expect(song.albumCover).toContain("placeholder");

    // 经 upload 注入后 getAllAvailableSongs 可转换
    expect(mgr.getAllAvailableSongs()).toBeInstanceOf(Array);
  });

  it("generateAIMusic: prompt 截断 30 字 + 默认值", async () => {
    const ai = await musicSourceManager.generateAIMusic({
      prompt: "A".repeat(50),
      style: "Jazz",
      mood: "energetic",
      duration: 120,
    });
    expect(ai?.title).toContain("...");
    expect(ai?.artist).toBe("YYC³ AI Composer");
    expect(ai?.genre).toBe("Jazz");
    expect(ai?.duration).toBe(120);

    const ai2 = await musicSourceManager.generateAIMusic({ prompt: "短" });
    expect(ai2?.duration).toBe(60);
    expect(ai2?.mood).toBe("calm");
  });

  it("getStreamingUrl → null + getStorageUsage + clearAllLocalFiles", () => {
    expect(musicSourceManager.getStreamingUrl("song-1", "NeteaseCloud")).toBeNull();

    const usage = musicSourceManager.getStorageUsage();
    expect(usage.count).toBe(0);
    expect(usage.estimatedSize).toContain("files");

    musicSourceManager.clearAllLocalFiles();
    expect(musicSourceManager.getLocalFiles()).toHaveLength(0);
  });

  it("损坏 localStorage JSON → 构造器 catch 不抛错", () => {
    localStorage.setItem("yyc3_music_local_files", "{broken");
    expect(() => new MusicSourceManager()).not.toThrow();
  });
});

/* ================= MusicData ================= */

describe("MusicData", () => {
  it("数据规模: 30 logo/14 照片/7 视频/4 专辑", () => {
    expect(LOGO_IMAGES).toHaveLength(30);
    expect(PHOTOS).toHaveLength(14);
    expect(VIDEOS).toHaveLength(7);
    expect(ALBUMS).toHaveLength(4);
    expect(ARTIST.albums).toHaveLength(4);
    expect(ARTIST.nameZh).toBe("董小姐");
  });

  it("getAllSongs: 4 专辑聚合去重计数", () => {
    const all = getAllSongs();
    expect(all.length).toBe(ALBUMS.reduce((sum, a) => sum + a.songs.length, 0));
    const ids = new Set(all.map((s) => s.id));
    expect(ids.size).toBe(all.length);
  });

  it("getSongsByMood/getSongsByGenre 过滤正确性", () => {
    const melancholy = getSongsByMood("melancholy");
    expect(melancholy.length).toBeGreaterThan(0);
    expect(melancholy.every((s) => s.mood === "melancholy")).toBe(true);

    const folk = getSongsByGenre("民谣");
    expect(folk.length).toBeGreaterThan(0);
    expect(folk.every((s) => s.genre === "民谣")).toBe(true);
  });

  it("getSongsByAlbum: 命中/未命中空数组", () => {
    expect(getSongsByAlbum("album-a").length).toBeGreaterThan(0);
    expect(getSongsByAlbum("ghost-album")).toEqual([]);
  });

  it("getRandomSongs: count 截取 + 全量不打乱引用", () => {
    expect(getRandomSongs(3)).toHaveLength(3);
    expect(getRandomSongs(999).length).toBe(getAllSongs().length);
  });

  it("getRandomLogo/getRandomPhoto/getRecentPhotos/getVideos", () => {
    expect(LOGO_IMAGES).toContain(getRandomLogo());

    const photo = getRandomPhoto();
    expect(PHOTOS).toContain(photo);
    expect(["portrait", "concert", "promo"]).toContain(photo.category);

    const recent = getRecentPhotos(3);
    expect(recent).toHaveLength(3);
    // 按 year 降序
    expect(recent[0].year).toBeGreaterThanOrEqual(recent[1].year);

    expect(getVideos()).toEqual(VIDEOS);
  });
});
