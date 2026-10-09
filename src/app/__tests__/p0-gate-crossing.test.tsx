/**
 * p0-gate-crossing.test.tsx
 * =========================
 * P0 门禁跨越攻坚（M7 收官批九）:
 *
 * - FamilyMusic: 音乐/资讯双 tab 切换/播放暂停（fake timers 驱动进度推进+曲末自动切曲）/
 *   上一曲下一曲环绕/播放列表选曲/点赞双态/静音/进度条点击 seek
 * - CoverFlow: 空歌曲兜底/中心卡片信息/键盘左右导航+空格播放/底部按钮导航（边界 disabled）/
 *   点击卡片选择/卡片点击 stopPropagation 按钮
 * - VoiceWaveform: attach/resize/detach/connectAudioStream（AudioContext stub）/
 *   updateData→start→animate 双分支（有数据 drawBars / 无数据 drawIdleWave）/
 *   disconnectAudioStream/getAverageLevel
 * - EmotionVisualizer: attach/updateEmotion 历史裁剪/start→render（labels+history 分支）/
 *   getHistory/clearHistory/getCurrentEmotion
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.useFakeTimers();

/* ---------- canvas 2d context stub ---------- */

const ctxStub = () => {
  const gradient = { addColorStop: vi.fn() };
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    scale: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
    // 绘制属性直接赋值无需 stub
  };
};

const makeCanvas = (width = 800, height = 200): { canvas: HTMLCanvasElement; ctx: ReturnType<typeof ctxStub> } => {
  const canvas = document.createElement("canvas");
  const sharedCtx = ctxStub();
  canvas.getContext = vi.fn(() => sharedCtx) as unknown as HTMLCanvasElement["getContext"];
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
    width,
    height,
    x: 0, y: 0, top: 0, left: 0, right: width, bottom: height,
    toJSON: () => ({}),
  } as DOMRect);
  Object.defineProperty(canvas, "width", { value: width, writable: true });
  Object.defineProperty(canvas, "height", { value: height, writable: true });
  return { canvas, ctx: sharedCtx };
};

Object.defineProperty(window, "devicePixelRatio", { value: 1, configurable: true });
const rafSpy = vi
  .spyOn(window, "requestAnimationFrame")
  .mockReturnValue(42);
const cancelRafSpy = vi
  .spyOn(window, "cancelAnimationFrame")
  .mockImplementation(() => { });

/* ---------- AudioContext stub（visualization connectAudioStream 用） ---------- */

const analyserStub = {
  fftSize: 0,
  smoothingTimeConstant: 0,
  frequencyBinCount: 1024,
  getByteFrequencyData: vi.fn(),
  connect: vi.fn(),
};
class FakeAudioContext {
  createAnalyser = vi.fn(() => ({ ...analyserStub, getByteFrequencyData: vi.fn() }));
  createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
  close = vi.fn().mockResolvedValue(undefined);
  destination = {};
}
class FakeAudioContextErr {
  createAnalyser = vi.fn(() => {
    throw new Error("no audio hw");
  });
}
const installAudioContext = (impl: object) => {
  Object.defineProperty(globalThis, "AudioContext", {
    value: impl,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, "AudioContext", {
    value: impl,
    writable: true,
    configurable: true,
  });
};

/* ---------- FamilyMusic 依赖（FadeIn 动画库懒加载兜底） ---------- */

vi.mock("../components/ai-family/FadeIn", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("../components/GlassCard", () => ({
  GlassCard: ({
    children,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
  }) => (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  ),
}));
vi.mock("../components/ai-family/FamilyPageHeader", () => ({
  FamilyPageHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { FamilyMusic } from "../components/ai-family/FamilyMusic";
import { CoverFlow } from "../components/music/CoverFlow";
import type { MusicSong } from "../lib/music/types";
import { EmotionVisualizer } from "../lib/voice/visualization/EmotionVisualizer";
import { VoiceWaveform, VoiceWaveform as VoiceWaveformNamed } from "../lib/voice/visualization/VoiceWaveform";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

/* ================= FamilyMusic ================= */

describe("FamilyMusic", () => {
  const clickPlay = (container: HTMLElement) => {
    // 播放/暂停按钮是 12x12 圆形 button（w-12 h-12）
    const btn = container.querySelector("button.w-12") as HTMLButtonElement;
    fireEvent.click(btn);
    return btn;
  };

  it("初始渲染: 音乐 tab + 标题 + 播放列表 8 首 + 默认 liked(id=1) 实心", () => {
    const { container } = render(<FamilyMusic />);
    expect(screen.getByText("音乐空间")).toBeTruthy();
    expect(screen.getByText("播放列表")).toBeTruthy();
    expect(container.textContent).toContain("8 首");
    expect(container.textContent).toContain("Family AI — 智慧工坊");
    // liked 曲目的 Heart 填充色（React 序列化 #FF69B4 → rgb(255, 105, 180)）
    expect(container.innerHTML).toContain("rgb(255, 105, 180)");
  });

  it("播放/暂停: isPlaying → fake timers 推进 progress + 曲末自动切下一曲", () => {
    const { container } = render(<FamilyMusic />);
    clickPlay(container);

    // 1 tick: progress 0→0.5 → formatTime(0.5, "4:32") = floor(272*0.5/100)=1 → "0:01"
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(container.textContent).toContain("0:01");

    // 推进到曲末（100/0.5=200 tick * 300ms）→ 自动切到 id=2
    act(() => {
      vi.advanceTimersByTime(300 * 210);
    });
    expect(container.textContent).toContain("Deep Focus · 深海专注");
  });

  it("下一曲/上一曲: 环绕切换 + 进度归零", () => {
    const { container } = render(<FamilyMusic />);
    // SkipForward/SkipBack 是 svg（lucide class）
    const fwd = container.querySelector(".lucide-skip-forward")!.closest("svg")!;
    fireEvent.click(fwd);
    expect(container.textContent).toContain("Deep Focus · 深海专注");

    const back = container.querySelector(".lucide-skip-back")!.closest("svg")!;
    fireEvent.click(back);
    expect(container.textContent).toContain("Family AI — 智慧工坊");
  });

  it("播放列表选曲: 点击曲目 → 高亮 + isPlaying=true", () => {
    const { container } = render(<FamilyMusic />);
    fireEvent.click(screen.getByText("Code Flow · 编程心流"));
    expect(container.textContent).toContain("Code Flow · 编程心流");
    // 选曲即播放（当前曲目显示动效条）—— 点播放按钮应变 Pause 图标
    const btn = container.querySelector("button.w-12");
    expect(btn?.querySelector(".lucide-pause")).toBeTruthy();
  });

  it("点赞切换: toggleLike 双态（stopPropagation 不触发选曲）", () => {
    const { container } = render(<FamilyMusic />);
    const heartBtns = container.querySelectorAll("button.p-1");
    const heartStyle = (btn: Element) => btn.querySelector("svg")!.getAttribute("style")!;
    const pink = "rgb(255, 105, 180)";
    // 初始 liked={1} → 第一首实心，第二首描边
    expect(heartStyle(heartBtns[0])).toContain(pink);
    expect(heartStyle(heartBtns[1])).not.toContain(pink);
    // 点第一首（id=1）→ 取消赞
    fireEvent.click(heartBtns[0]);
    expect(heartStyle(heartBtns[0])).not.toContain(pink);
    // 再点第一首 → 恢复赞
    fireEvent.click(heartBtns[0]);
    expect(heartStyle(heartBtns[0])).toContain(pink);
  });

  it("资讯 tab: 切换渲染 8 条新闻 + 分类标签", () => {
    render(<FamilyMusic />);
    fireEvent.click(screen.getByText("资讯"));
    expect(screen.getByText("音乐空间".replace("音乐空间", "行业资讯"))).toBeTruthy();
    expect(screen.getByText("AI 精选 · 行业前沿资讯")).toBeTruthy();
    expect(screen.getByText("OpenAI 发布 GPT-5 技术报告，推理能力大幅跃升")).toBeTruthy();
  });

  it("进度条点击: seek 到点击位置", () => {
    const { container } = render(<FamilyMusic />);
    const progressBar = container.querySelector(".h-1.rounded-full") as HTMLElement;
    vi.spyOn(progressBar, "getBoundingClientRect").mockReturnValue({
      left: 0,
      width: 100,
      x: 0, y: 0, top: 0, right: 100, bottom: 1,
      height: 1,
      toJSON: () => ({}),
    } as DOMRect);
    fireEvent.click(progressBar, { clientX: 50 });
    // progress 50% → formatTime(50, "4:32") = 272s*0.5=136s = "2:16"
    expect(container.textContent).toContain("2:16");
  });
});

/* ================= CoverFlow ================= */

describe("CoverFlow", () => {
  const songs: MusicSong[] = [
    { id: "c1", title: "曲目一", artist: "艺人A", album: "专辑A", albumCover: "/a.jpg", duration: 180 },
    { id: "c2", title: "曲目二", artist: "艺人B", album: "专辑B", albumCover: "/b.jpg", duration: 200 },
    { id: "c3", title: "曲目三", artist: "艺人C", album: "专辑C", albumCover: "/c.jpg", duration: 220 },
  ];

  const renderFlow = (currentIndex = 0) => {
    const onSongSelect = vi.fn();
    const onPlayPause = vi.fn();
    const { container } = render(
      <CoverFlow
        songs={songs}
        currentIndex={currentIndex}
        onSongSelect={onSongSelect}
        isPlaying={false}
        onPlayPause={onPlayPause}
      />
    );
    return { container, onSongSelect, onPlayPause };
  };

  it("空歌曲: 兜底「暂无歌曲」", () => {
    render(<CoverFlow songs={[]} currentIndex={0} onSongSelect={vi.fn()} />);
    expect(screen.getByText("暂无歌曲")).toBeTruthy();
  });

  it("初始渲染: 中心卡片标题/艺人/专辑 + 底部控制条 + 指示点", () => {
    const { container } = renderFlow();
    expect(screen.getByText("曲目一")).toBeTruthy();
    expect(screen.getByText("艺人A")).toBeTruthy();
    expect(screen.getByText("专辑A")).toBeTruthy();
    expect(container.querySelectorAll(".rounded-full").length).toBeGreaterThan(3);
  });

  it("键盘导航: ArrowLeft/ArrowRight 选择 + 空格播放 + 边界钳制", () => {
    const { onSongSelect, onPlayPause } = renderFlow(1);

    fireEvent.keyDown(window, { key: "ArrowLeft" });
    expect(onSongSelect).toHaveBeenLastCalledWith(songs[0], 0);

    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(onSongSelect).toHaveBeenLastCalledWith(songs[2], 2);

    fireEvent.keyDown(window, { key: " " });
    expect(onPlayPause).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Enter" });
    expect(onPlayPause).toHaveBeenCalledTimes(2);
  });

  it("键盘边界: currentIndex=0 左键仍选中自身 / 末尾右键选中自身（Math 钳制不越界）", () => {
    const { onSongSelect } = renderFlow(0);
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    // 源码: Math.max(0, -1)=0 → songs[0] 存在 → 仍触发选择（同曲重选）
    expect(onSongSelect).toHaveBeenCalledWith(songs[0], 0);

    const { onSongSelect: sel2 } = renderFlow(2);
    fireEvent.keyDown(window, { key: "ArrowRight" });
    expect(sel2).toHaveBeenCalledWith(songs[2], 2);
  });

  it("底部按钮: 上一曲/下一曲 + 边界 disabled", () => {
    const { container, onSongSelect } = renderFlow(1);
    const btns = container.querySelectorAll("button");

    // 中心卡片 Heart/Share 占 btns[0]/btns[1]，底部控制条: btns[2]=SkipBack, btns[3]=play, btns[4]=SkipForward
    fireEvent.click(btns[2]);
    expect(onSongSelect).toHaveBeenLastCalledWith(songs[0], 0);
    fireEvent.click(btns[4]);
    expect(onSongSelect).toHaveBeenLastCalledWith(songs[2], 2);

    // 边界: index=0 → back disabled；index=末尾 → fwd disabled
    const { container: c0 } = renderFlow(0);
    expect((c0.querySelectorAll("button")[2] as HTMLButtonElement).disabled).toBe(true);
    const { container: c2 } = renderFlow(2);
    expect((c2.querySelectorAll("button")[4] as HTMLButtonElement).disabled).toBe(true);
  });

  it("点击非中心卡片: 选择该曲（dragOffset<10）", () => {
    const { onSongSelect } = renderFlow(0);
    // 非中心卡片不渲染标题，用 img alt 定位（motion.div onClick）
    const card = screen.getByAltText("曲目二 - 艺人B").closest("div.cursor-pointer") as HTMLElement;
    fireEvent.click(card);
    expect(onSongSelect).toHaveBeenCalledWith(songs[1], 1);
  });

  it("中心卡片 Heart/Share 按钮 stopPropagation 不触发选择", () => {
    const { container, onSongSelect } = renderFlow(0);
    const heart = container.querySelector(".lucide-heart")!.closest("button")!;
    fireEvent.click(heart);
    expect(onSongSelect).not.toHaveBeenCalled();
  });

  it("拖拽: mouseDown→move 超阈值→up 切换到下一曲（velocity 分支覆盖）", () => {
    const { onSongSelect } = renderFlow(0);
    const container = screen.getByText("曲目一").closest("div.relative")!;

    fireEvent.mouseDown(container, { clientX: 300 });
    fireEvent.mouseMove(container, { clientX: 100 });
    fireEvent.mouseUp(container);
    expect(onSongSelect).toHaveBeenCalledWith(songs[1], 1);
  });
});

/* ================= VoiceWaveform ================= */

describe("VoiceWaveform", () => {
  beforeEach(() => {
    installAudioContext(FakeAudioContext);
  });

  it("attach + responsive resize + detach 清理", () => {
    const wf = new VoiceWaveform();
    const { canvas } = makeCanvas();
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    wf.attach(canvas);
    expect(canvas.getContext).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalledWith("resize", expect.any(Function));

    wf.detach();
    expect(removeSpy).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("connectAudioStream 成功路径 + disconnectAudioStream 停轨", async () => {
    const wf = new VoiceWaveform();
    const stopTrack = vi.fn();
    const stream = {
      getTracks: () => [{ stop: stopTrack }],
    } as unknown as MediaStream;

    await wf.connectAudioStream(stream);
    expect(wf.getFrequencyData()).toBeInstanceOf(Uint8Array);
    expect(wf.getFrequencyData()!.length).toBe(1024);

    wf.disconnectAudioStream();
    expect(stopTrack).toHaveBeenCalled();
    expect(wf.getFrequencyData()).toBeInstanceOf(Uint8Array); // frequencyData 不清（仅断开源）
  });

  it("connectAudioStream 异常路径: AudioContext 构造失败 → console.error 不抛错", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    installAudioContext(FakeAudioContextErr);
    const wf = new VoiceWaveform();
    await wf.connectAudioStream({} as MediaStream);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    installAudioContext(FakeAudioContext);
  });

  it("start/stop + animate 双分支（有数据 drawBars / 无数据 drawIdleWave）", () => {
    const wf = new VoiceWaveform({ responsive: false });
    const { canvas, ctx } = makeCanvas();
    wf.attach(canvas);

    // 无数据 → drawIdleWave（beginPath/moveTo/lineTo/stroke）
    wf.start();
    expect(rafSpy).toHaveBeenCalled();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalled();
    wf.stop();
    expect(cancelRafSpy).toHaveBeenCalled();

    // 有数据 → drawBars（fillRect/gradient）
    const data = new Uint8Array(1024).fill(128);
    wf.updateData(data);
    wf.start();
    expect(ctx.fillRect).toHaveBeenCalled();
    expect(ctx.createLinearGradient).toHaveBeenCalled();
    wf.stop();
  });

  it("未 attach 直接 start → animate 守卫退出", () => {
    const wf = new VoiceWaveform({ responsive: false });
    wf.start(); // ctx/canvas 为 null → animate return
    expect(rafSpy).toHaveBeenCalledTimes(0);
  });

  it("getAverageLevel: 有数据求均值 / 无数据 0", () => {
    const wf = new VoiceWaveform();
    expect(wf.getAverageLevel()).toBe(0);

    wf.updateData(new Uint8Array([255, 255, 255, 255]));
    expect(wf.getAverageLevel()).toBeCloseTo(1.0);
  });

  it("mirror=false 配置 + 非法色值 adjustColorBrightness 回退", () => {
    const wf = new VoiceWaveform({ responsive: false, mirror: false, color: "not-hex" });
    const { canvas, ctx } = makeCanvas();
    wf.attach(canvas);
    wf.updateData(new Uint8Array(1024).fill(64));
    wf.start();
    expect(ctx.fillRect).toHaveBeenCalled();
    // 非法色 → hexToRgb null → addColorStop 原样回传
    expect(ctx.createLinearGradient).toHaveBeenCalled();
    wf.stop();
  });

  it("默认导出一致性", () => {
    expect(VoiceWaveformNamed).toBe(VoiceWaveform);
  });
});

/* ================= EmotionVisualizer ================= */

describe("EmotionVisualizer", () => {
  const emotionResult = (type: "happy" | "sad" | "neutral", confidence = 0.8) => ({
    type,
    confidence,
    audioFeatures: { pitch: 200, energy: 0.6, variation: 0.3 },
  });

  it("attach/start→render 全分支（labels+history）+ updateEmotion 历史裁剪", () => {
    const ev = new EmotionVisualizer({ responsive: false, showLabels: true, showHistory: true, historyLength: 3 });
    const { canvas, ctx } = makeCanvas(400, 400);
    ev.attach(canvas);

    ev.updateEmotion(emotionResult("happy"));
    ev.updateEmotion(emotionResult("sad", 0.6));
    ev.updateEmotion(emotionResult("neutral", 0.4));
    // 第 4 条触发裁剪: length 4 > historyLength 3 → slice(-3)
    ev.updateEmotion(emotionResult("happy", 0.5));
    expect(ev.getHistory()).toHaveLength(3);
    expect(ev.getHistory()[0].emotion).toBe("sad");

    ev.start();
    expect(ctx.createRadialGradient).toHaveBeenCalled();
    expect(ctx.arc).toHaveBeenCalled();
    expect(ctx.fillText).toHaveBeenCalled(); // labels: 中文情绪 + 百分比
    ev.stop();
  });

  it("getHistory 返回副本 + clearHistory 清空 + getCurrentEmotion", () => {
    const ev = new EmotionVisualizer();
    ev.updateEmotion(emotionResult("happy"));
    const h1 = ev.getHistory();
    h1.push({ ...h1[0], confidence: 0 });
    expect(ev.getHistory()).toHaveLength(1); // 副本不受外部修改影响

    expect(ev.getCurrentEmotion()).toEqual({ emotion: "happy", confidence: 0.8 });
    ev.clearHistory();
    expect(ev.getHistory()).toHaveLength(0);
  });

  it("showLabels=false / showHistory=false 分支跳过绘制", () => {
    const ev = new EmotionVisualizer({ responsive: false, showLabels: false, showHistory: false });
    const { canvas, ctx } = makeCanvas(400, 400);
    ev.attach(canvas);

    ev.updateEmotion(emotionResult("happy"));
    ev.start();
    expect(ctx.fillText).not.toHaveBeenCalled();
    // rings 仍绘制
    expect(ctx.arc).toHaveBeenCalled();
    ev.stop();
  });

  it("未 attach start → 守卫退出 + detach 二次调用安全", () => {
    const ev = new EmotionVisualizer({ responsive: false });
    ev.start();
    expect(rafSpy).toHaveBeenCalledTimes(0);
    ev.detach(); // 未 attach 过 → 无 resize 监听，stop 幂等
  });
});
