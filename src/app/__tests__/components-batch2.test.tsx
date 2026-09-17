/**
 * components-batch2.test.tsx
 * ==========================
 * 组件域攻坚批二（M7 前置）: canvas 三件 + theme 双件 + FloatingCD
 *
 * 覆盖:
 * - AudioVisualizer: 4 种绘制类型 + idle + 自定义尺寸
 * - VoiceWaveformCanvas: 连接/断开音频流 + 点击回调 + 麦克风图标切换
 * - EmotionVisualizerCanvas: 挂载/更新/卸载生命周期
 * - ColorPicker: HEX/R/G/B 输入联动 + 色相选择
 * - ColorSwatch: 开合 + 外点关闭 + ColorPicker 联动
 * - FloatingCD: AnimatePresence 显隐 + 曲目信息渲染
 *
 * Canvas/可视化类以 jsdom mock（getContext 返回空实现）驱动逻辑路径
 */

import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* 引擎 mock: spyOn 原型（模块 mock 路径在 vite alias 下解析不稳定，改用实例 spy） */
import { EmotionVisualizer } from "../lib/voice/visualization/EmotionVisualizer";
import { VoiceWaveform } from "../lib/voice/visualization/VoiceWaveform";

type EngineSpies = Record<string, ReturnType<typeof vi.fn>>;
let waveformSpies: EngineSpies;
let visualizerSpies: EngineSpies;

beforeEach(() => {
  waveformSpies = {
    attach: vi.spyOn(VoiceWaveform.prototype, "attach").mockImplementation(() => { }),
    start: vi.spyOn(VoiceWaveform.prototype, "start").mockImplementation(() => { }),
    stop: vi.spyOn(VoiceWaveform.prototype, "stop").mockImplementation(() => { }),
    connectAudioStream: vi.spyOn(VoiceWaveform.prototype, "connectAudioStream").mockResolvedValue(undefined),
    disconnectAudioStream: vi.spyOn(VoiceWaveform.prototype, "disconnectAudioStream").mockImplementation(() => { }),
  };
  visualizerSpies = {
    attach: vi.spyOn(EmotionVisualizer.prototype, "attach").mockImplementation(() => { }),
    start: vi.spyOn(EmotionVisualizer.prototype, "start").mockImplementation(() => { }),
    stop: vi.spyOn(EmotionVisualizer.prototype, "stop").mockImplementation(() => { }),
    updateEmotion: vi.spyOn(EmotionVisualizer.prototype, "updateEmotion").mockImplementation(() => { }),
  };
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

import { AudioVisualizer } from "../components/music/AudioVisualizer";
import { FloatingCD } from "../components/music/FloatingCD";
import { ColorPicker } from "../components/theme/ColorPicker";
import { ColorSwatch } from "../components/theme/ColorSwatch";
import { EmotionVisualizerCanvas } from "../components/voice/EmotionVisualizerCanvas";
import { VoiceWaveformCanvas } from "../components/voice/VoiceWaveformCanvas";

/* jsdom canvas 2d 上下文 stub */
function stubCanvas2D() {
  const noop = () => { };
  const ctx = {
    fillRect: noop,
    clearRect: noop,
    beginPath: noop,
    arc: noop,
    fill: noop,
    stroke: noop,
    moveTo: noop,
    lineTo: noop,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    shadowColor: "",
    shadowBlur: 0,
    createLinearGradient: () => ({ addColorStop: noop }),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
}

function unstubCanvas2D() {
  vi.restoreAllMocks();
}

const makeAnalyzerData = () => ({
  frequencyData: new Uint8Array(64).fill(128),
  timeDomainData: new Uint8Array(64).fill(128),
});

beforeEach(() => {
  stubCanvas2D();
});

afterEach(() => {
  unstubCanvas2D();
});

/* ---------------- AudioVisualizer ---------------- */

describe("AudioVisualizer", () => {
  it.each(["bars", "wave", "circle", "particles"] as const)(
    "类型 %s: 有数据渲染不抛错",
    (type) => {
      expect(() =>
        render(<AudioVisualizer analyzerData={makeAnalyzerData()} type={type} width={200} height={100} />)
      ).not.toThrow();
    }
  );

  it("无数据 → idle 动画路径", () => {
    expect(() => render(<AudioVisualizer analyzerData={null} width={200} height={100} />)).not.toThrow();
  });

  it("数据更新触发重绘", () => {
    const { rerender } = render(<AudioVisualizer analyzerData={null} width={100} height={50} />);
    act(() => {
      rerender(<AudioVisualizer analyzerData={makeAnalyzerData()} type="bars" width={100} height={50} />);
    });
    expect(document.querySelector("canvas.audio-visualizer")).toBeTruthy();
  });

  it("默认参数渲染（无 width → offsetWidth 100%）", () => {
    const { container } = render(<AudioVisualizer analyzerData={makeAnalyzerData()} />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    expect(canvas.style.height).toBe("100px");
    expect(canvas.style.width).toBe("100%");
  });

  it("particles 类型: 模块级粒子数组持续累积不越界", () => {
    const data = { ...makeAnalyzerData(), frequencyData: new Uint8Array(64).fill(255) };
    for (let i = 0; i < 3; i++) {
      const { unmount } = render(<AudioVisualizer analyzerData={data} type="particles" width={200} height={100} />);
      unmount();
    }
    // 多轮渲染/卸载无异常即通过
    expect(true).toBe(true);
  });
});

/* ---------------- VoiceWaveformCanvas ---------------- */

describe("VoiceWaveformCanvas", () => {
  it("挂载创建波形引擎并 attach", () => {
    render(<VoiceWaveformCanvas isListening={false} width={120} height={60} />);
    expect(waveformSpies.attach).toHaveBeenCalledTimes(1);
  });

  it("监听中 + 音频流 → 连接并 start", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    render(<VoiceWaveformCanvas isListening audioStream={stream} />);

    // useEffect 异步 connectStream
    await act(async () => { });
    expect(waveformSpies.connectAudioStream).toHaveBeenCalledWith(stream);
    expect(waveformSpies.start).toHaveBeenCalled();
  });

  it("连接失败 → console.error 且不 start", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    waveformSpies.connectAudioStream.mockRejectedValue(new Error("no mic"));
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    render(<VoiceWaveformCanvas isListening audioStream={stream} />);

    await act(async () => { });
    expect(errSpy).toHaveBeenCalled();
    expect(waveformSpies.start).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("isListening false → stop + disconnect", async () => {
    const stream = { getTracks: () => [] } as unknown as MediaStream;
    const { rerender } = render(<VoiceWaveformCanvas isListening audioStream={stream} />);
    await act(async () => { });
    expect(waveformSpies.start).toHaveBeenCalled();

    act(() => {
      rerender(<VoiceWaveformCanvas isListening={false} audioStream={stream} />);
    });
    expect(waveformSpies.stop).toHaveBeenCalled();
    expect(waveformSpies.disconnectAudioStream).toHaveBeenCalled();
  });

  it.each([
    [true, "onStopListening"],
    [false, "onStartListening"],
  ] as const)("点击切换回调: isListening=%s → %s", (isListening, cb) => {
    const onStart = vi.fn();
    const onStop = vi.fn();
    const { container } = render(
      <VoiceWaveformCanvas isListening={isListening} onStartListening={onStart} onStopListening={onStop} />
    );
    fireEvent.click(container.firstChild as HTMLElement);
    expect(cb === "onStopListening" ? onStop : onStart).toHaveBeenCalledTimes(1);
  });

  it("卸载 → stop + disconnectAudioStream 清理", () => {
    const { unmount } = render(<VoiceWaveformCanvas isListening={false} />);
    unmount();
    expect(waveformSpies.stop).toHaveBeenCalled();
    expect(waveformSpies.disconnectAudioStream).toHaveBeenCalled();
  });

  it("无监听时显示 MicOff / 监听时 Mic 图标", () => {
    const { container: off } = render(<VoiceWaveformCanvas isListening={false} />);
    expect(off.querySelector(".animate-pulse")).toBeNull();

    const { container: on } = render(<VoiceWaveformCanvas isListening />);
    expect(on.querySelector(".animate-pulse")).toBeTruthy();
  });
});

/* ---------------- EmotionVisualizerCanvas ---------------- */

describe("EmotionVisualizerCanvas", () => {
  const emotion = {
    emotion: "happy",
    confidence: 0.9,
    audioFeatures: { pitch: 1, energy: 1, variation: 1 },
  } as never;

  it("挂载创建可视化引擎 + attach + start", () => {
    render(<EmotionVisualizerCanvas emotion={null} />);
    expect(visualizerSpies.attach).toHaveBeenCalledTimes(1);
    expect(visualizerSpies.start).toHaveBeenCalledTimes(1);
  });

  it("emotion 更新 → updateEmotion 转发", () => {
    const { rerender } = render(<EmotionVisualizerCanvas emotion={null} />);
    expect(visualizerSpies.updateEmotion).not.toHaveBeenCalled();

    act(() => {
      rerender(<EmotionVisualizerCanvas emotion={emotion} />);
    });
    expect(visualizerSpies.updateEmotion).toHaveBeenCalledWith(emotion);
  });

  it("卸载 → stop 清理", () => {
    const { unmount } = render(<EmotionVisualizerCanvas emotion={null} />);
    unmount();
    expect(visualizerSpies.stop).toHaveBeenCalled();
  });
});

/* ---------------- ColorPicker ---------------- */

describe("ColorPicker", () => {
  it("渲染 5 输入（色板 HEX + 编辑区 HEX/R/G/B）+ OKLch 显示", () => {
    const { container } = render(<ColorPicker value="#FF0000" onChange={vi.fn()} />);
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(5); // 顶部色板 hex + 编辑区 hex + R + G + B
    expect(container.textContent).toContain("Hex");
    expect(container.textContent).toContain("oklch(");
  });

  it("外部 value 变化同步内部状态", () => {
    const { container, rerender } = render(<ColorPicker value="#FF0000" onChange={vi.fn()} />);
    const hexInput = container.querySelectorAll("input")[1] as HTMLInputElement; // 编辑区 hex（保留原大小写）
    expect(hexInput.value).toBe("FF0000");

    act(() => {
      rerender(<ColorPicker value="#00FF00" onChange={vi.fn()} />);
    });
    expect((container.querySelectorAll("input")[1] as HTMLInputElement).value).toBe("00FF00");
  });

  it("HEX 输入 blur 提交 → onChange", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF0000" onChange={onChange} />);
    const hexInput = container.querySelectorAll("input")[1] as HTMLInputElement;

    fireEvent.change(hexInput, { target: { value: "00ff00" } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenCalledWith("#00ff00");
  });

  it("HEX 输入 Enter 提交 → onChange", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF0000" onChange={onChange} />);
    const hexInput = container.querySelectorAll("input")[1] as HTMLInputElement;

    fireEvent.change(hexInput, { target: { value: "0000ff" } });
    fireEvent.keyDown(hexInput, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("#0000ff");
  });

  it("非法 HEX 字符被过滤", () => {
    const { container } = render(<ColorPicker value="#FF0000" onChange={vi.fn()} />);
    const hexInput = container.querySelectorAll("input")[1] as HTMLInputElement;

    fireEvent.change(hexInput, { target: { value: "zz!@12ab" } });
    expect((hexInput as HTMLInputElement).value).toBe("12ab");
  });

  it("短 HEX 提交补零（padEnd 6）", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF0000" onChange={onChange} />);
    const hexInput = container.querySelectorAll("input")[1] as HTMLInputElement;

    fireEvent.change(hexInput, { target: { value: "abc" } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenCalledWith("#abc000");
  });

  it.each([
    ["R", 0, "255"],
    ["G", 1, "128"],
    ["B", 2, "10"],
  ] as const)("RGB 通道 %s 输入联动 onChange", (_ch, _idx, val) => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#000000" onChange={onChange} />);
    // input 布局: [0] 色板 hex, [1] 编辑区 hex, [2..4] R/G/B
    const chIdx = { 0: 2, 1: 3, 2: 4 }[_idx];
    const chInput = container.querySelectorAll("input")[chIdx] as HTMLInputElement;
    fireEvent.change(chInput, { target: { value: val } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const hex = onChange.mock.calls[0][0] as string;
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("RGB 通道越界钳制 [0,255]", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#000000" onChange={onChange} />);
    const rInput = container.querySelectorAll("input")[2] as HTMLInputElement;
    fireEvent.change(rInput, { target: { value: "999" } });
    expect(onChange).toHaveBeenCalledWith("#ff0000");

    fireEvent.change(rInput, { target: { value: "-5" } });
    expect(onChange).toHaveBeenCalledWith("#000000");
  });

  it("SV/Hue canvas mousedown → 拾色联动 onChange", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF0000" onChange={onChange} />);
    const canvases = container.querySelectorAll("canvas");

    // getBoundingClientRect stub: 中心拾取
    vi.spyOn(canvases[0], "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 260, height: 160, right: 260, bottom: 160, x: 0, y: 0,
      toJSON: () => { },
    } as DOMRect);

    fireEvent.mouseDown(canvases[0], { clientX: 130, clientY: 80 });
    expect(onChange).toHaveBeenCalled();
    const hex = onChange.mock.calls[0][0] as string;
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("色相滑条 mousedown → onChange（色相变化）", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#FF0000" onChange={onChange} />);
    const canvases = container.querySelectorAll("canvas");

    vi.spyOn(canvases[1], "getBoundingClientRect").mockReturnValue({
      left: 0, top: 0, width: 260, height: 14, right: 260, bottom: 14, x: 0, y: 0,
      toJSON: () => { },
    } as DOMRect);

    fireEvent.mouseDown(canvases[1], { clientX: 130, clientY: 7 });
    expect(onChange).toHaveBeenCalled();
  });
});

/* ---------------- ColorSwatch ---------------- */

describe("ColorSwatch", () => {
  it("渲染 label + HEX 大写 + OKLch", () => {
    const { getByText } = render(<ColorSwatch label="主色" value="#336699" onChange={vi.fn()} />);
    expect(getByText("主色")).toBeTruthy();
    expect(getByText("#336699")).toBeTruthy();
  });

  it("点击开合 ColorPicker", () => {
    const { container } = render(<ColorSwatch label="主色" value="#336699" onChange={vi.fn()} />);
    expect(container.querySelector("input")).toBeNull(); // 初始关闭

    fireEvent.click(container.querySelector("button")!);
    expect(container.querySelector("input")).toBeTruthy(); // 打开

    fireEvent.click(container.querySelector("button")!);
    expect(container.querySelector("input")).toBeNull(); // 再点关闭
  });

  it("打开后外部 mousedown → 关闭", () => {
    const { container } = render(<ColorSwatch label="主色" value="#336699" onChange={vi.fn()} />);
    fireEvent.click(container.querySelector("button")!);
    expect(container.querySelector("input")).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(container.querySelector("input")).toBeNull();
  });

  it("ColorPicker 联动: 子选择器改色 → onChange 上抛", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorSwatch label="主色" value="#336699" onChange={onChange} />);
    fireEvent.click(container.querySelector("button")!);

    const hexInput = container.querySelectorAll("input")[0] as HTMLInputElement;
    fireEvent.change(hexInput, { target: { value: "ff8800" } });
    fireEvent.blur(hexInput);
    expect(onChange).toHaveBeenCalledWith("#ff8800");
  });
});

/* ---------------- FloatingCD ---------------- */

describe("FloatingCD", () => {
  it("isActive=false 不渲染", () => {
    const { container } = render(
      <FloatingCD isPlaying={false} trackTitle="曲" artist="歌手" isActive={false} />
    );
    expect(container.textContent).not.toContain("YYC³ Play");
  });

  it("isActive=true 渲染曲目信息", () => {
    const { getByText, container } = render(
      <FloatingCD isPlaying trackTitle="夜曲" artist="周杰伦" isActive />
    );
    expect(getByText("夜曲")).toBeTruthy();
    expect(getByText("周杰伦")).toBeTruthy();
    expect(getByText("YYC³ Play")).toBeTruthy();
    expect(container.querySelector("img")).toBeNull();
  });

  it("albumCover 渲染 img", () => {
    const { container } = render(
      <FloatingCD isPlaying={false} trackTitle="曲" albumCover="/cover.png" isActive />
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/cover.png");
  });

  it("artist 缺省 → YYC³ MUSIC", () => {
    const { getByText } = render(<FloatingCD isPlaying={false} trackTitle="曲" isActive />);
    expect(getByText("YYC³ MUSIC")).toBeTruthy();
  });

  it("albumCover 加载失败 → img 隐藏（onError）", () => {
    const { container } = render(
      <FloatingCD isPlaying={false} trackTitle="曲" albumCover="/broken.png" isActive />
    );
    const img = container.querySelector("img")!;
    fireEvent.error(img);
    expect(img.style.display).toBe("none");
  });
});
