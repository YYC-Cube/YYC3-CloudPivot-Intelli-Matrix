/**
 * ide-layout-panelmanager.test.tsx
 * ================================
 * 组件域攻坚批七（M7 · IDELayout + PanelManager）:
 *
 * - PanelManager: 布局操作全链（split/拆分指定面板/close/float/maximize/reset/持久化恢复/损坏回退）
 *   + 上下文方法探针（swapPanels/replacePanel/openPanel/mergePanel/非 leaf no-op）
 *   + SplitContainer 拖拽调宽（含 10% 最小钳制）
 * - PanelHeader: pin/lock/pinned 态/无 ctx 兜底
 * - 双 store: usePanelPinStore（pin/lock/持久化）+ useFloatingPanelStore（detach/attach/move/resize/minimize/zIndex/closeAll）
 * - IDELayout 补充: edit 模式文件选择开 tab → 关 tab 恢复空态 + TopBar 回调（通知/Repo/分享/返回/全屏/切换布局）+ preview 面板占位
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));
const navigateMock = vi.fn();

const clipboardWrite = vi.fn().mockResolvedValue(undefined);
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: clipboardWrite },
  configurable: true,
  writable: true,
});

import { IDELayout } from "../components/ide/IDELayout";
import {
  LayoutResetButton,
  PanelHeader,
  PanelLayoutArea,
  PanelManagerProvider,
  usePanelManager,
  type LayoutNode,
  type PanelId,
} from "../components/ide/panel-manager/PanelManager";
import { useFloatingPanelStore } from "../components/ide/panel-manager/stores/useFloatingPanelStore";
import { usePanelPinStore } from "../components/ide/panel-manager/stores/usePanelPinStore";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
  navigateMock.mockClear();
  clipboardWrite.mockClear();
  usePanelPinStore.getState().clearAll();
  useFloatingPanelStore.getState().closeAll();
  vi.restoreAllMocks();
});

/* ---------- 测试工具 ---------- */

const markerPanel = (pid: PanelId, nodeId: string) => (
  <div>{`${pid}#${nodeId}`}</div>
);

const twoLeaf: LayoutNode = {
  id: "root",
  type: "split",
  direction: "horizontal",
  children: [
    { id: "l1", type: "leaf", panelId: "ai", size: 50 },
    { id: "l2", type: "leaf", panelId: "code", size: 50 },
  ],
};

function Harness({
  children,
  initialLayout,
  renderPanel = markerPanel,
}: {
  children: ReactNode;
  initialLayout?: LayoutNode;
  renderPanel?: (pid: PanelId, nodeId: string) => ReactNode;
}) {
  return (
    <DndProvider backend={HTML5Backend}>
      <PanelManagerProvider renderPanel={renderPanel} initialLayout={initialLayout}>
        {children}
      </PanelManagerProvider>
    </DndProvider>
  );
}

const renderHeader = (nodeId = "l1", panelId: PanelId = "ai") =>
  render(
    <Harness initialLayout={twoLeaf}>
      <PanelHeader nodeId={nodeId} panelId={panelId} title="AI 对话" icon={<span>AI</span>} />
      <PanelLayoutArea />
      <LayoutResetButton />
    </Harness>
  );

/* ================= PanelManager 布局操作 ================= */

describe("PanelManager 布局操作", () => {
  it("初始渲染: 默认布局双面板标记 + 面板头部动作按钮", () => {
    const { container } = renderHeader();
    expect(container.textContent).toContain("ai#l1");
    expect(container.textContent).toContain("code#l2");
    expect(container.querySelector('[title="固定面板"]')).toBeTruthy();
    expect(container.querySelector('[title="锁定面板"]')).toBeTruthy();
    expect(container.querySelector('[title="拆分面板"]')).toBeTruthy();
    expect(container.querySelector('[title="最大化"]')).toBeTruthy();
    expect(container.querySelector('[title="关闭面板"]')).toBeTruthy();
    expect(container.querySelector('[title="重置布局"]')).toBeTruthy();
  });

  it("水平拆分 → 面板数 +1 + localStorage 持久化", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="拆分面板"]')!);
    fireEvent.click(screen.getByText("水平拆分"));
    expect(container.textContent).toContain("ai#");
    expect(container.textContent).toContain("preview#");
    expect(localStorage.getItem("yyc3_panel_layout")).toContain('"panelId"');
  });

  it("拆分为指定面板: 选择「终端」→ terminal leaf 渲染", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="拆分面板"]')!);
    fireEvent.click(screen.getByText("拆分为"));
    fireEvent.click(screen.getByText("终端"));
    expect(container.textContent).toContain("terminal#");
  });

  it("关闭面板: 树塌缩（root 只剩单 leaf 时折叠且按钮消失）", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="关闭面板"]')!); // 关 l1(ai)
    expect(container.textContent).not.toContain("ai#l1");
    // 塌缩后 root 吸收 l2 的 leaf 属性（id 变 root）
    expect(container.textContent).toContain("code#root");
    // 单 leaf → canRemove=false → 关闭/浮动按钮消失（防误关保护）
    expect(container.querySelector('[title="关闭面板"]')).toBeNull();
    expect(container.querySelector('[title="浮动窗口"]')).toBeNull();
  });

  it("浮动窗口: detachPanel + removePanel → floating store 收录", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="浮动窗口"]')!);
    expect(container.textContent).not.toContain("ai#l1");
    expect(useFloatingPanelStore.getState().floatingPanels).toHaveLength(1);
    expect(useFloatingPanelStore.getState().floatingPanels[0].panelId).toBe("ai");
  });

  it("pinned 面板: 拖拽把手提示固定 + 无浮动按钮", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="固定面板"]')!);
    expect(container.querySelector('[title="面板已固定"]')).toBeTruthy();
    expect(container.querySelector('[title="浮动窗口"]')).toBeNull();
    expect(container.querySelector('[title="取消固定"]')).toBeTruthy();
  });

  it("最大化/还原: MaximizedView 独占渲染", () => {
    const { container } = renderHeader();
    expect(container.textContent).toContain("code#l2");

    fireEvent.click(container.querySelector('[title="最大化"]')!);
    expect(container.textContent).not.toContain("code#l2");
    expect(container.textContent).toContain("ai#l1");
    expect(container.querySelector('[title="还原"]')).toBeTruthy();

    fireEvent.click(container.querySelector('[title="还原"]')!);
    expect(container.textContent).toContain("code#l2");
  });

  it("LayoutResetButton: 拆分后重置回 initialLayout 并清持久化", () => {
    const { container } = renderHeader();
    fireEvent.click(container.querySelector('[title="拆分面板"]')!);
    fireEvent.click(screen.getByText("水平拆分"));
    expect(container.textContent).toContain("preview#");
    expect(localStorage.getItem("yyc3_panel_layout")).toBeTruthy();

    fireEvent.click(container.querySelector('[title="重置布局"]')!);
    expect(container.textContent).not.toContain("preview#");
    expect(container.textContent).toContain("ai#l1");
    expect(localStorage.getItem("yyc3_panel_layout")).toBeNull();
  });

  it("持久化恢复: localStorage 合法布局 JSON → 恢复渲染", () => {
    localStorage.setItem(
      "yyc3_panel_layout",
      JSON.stringify({
        id: "root",
        type: "split",
        direction: "horizontal",
        children: [
          { id: "p1", type: "leaf", panelId: "git", size: 60 },
          { id: "p2", type: "leaf", panelId: "terminal", size: 40 },
        ],
      })
    );
    const { container } = render(
      <Harness initialLayout={twoLeaf}>
        <PanelLayoutArea />
      </Harness>
    );
    expect(container.textContent).toContain("git#p1");
    expect(container.textContent).toContain("terminal#p2");
    expect(container.textContent).not.toContain("ai#l1");
  });

  it("损坏 JSON → 回退 initialLayout 不抛错", () => {
    localStorage.setItem("yyc3_panel_layout", "{broken json");
    const { container } = render(
      <Harness initialLayout={twoLeaf}>
        <PanelLayoutArea />
      </Harness>
    );
    expect(container.textContent).toContain("ai#l1");
    expect(container.textContent).toContain("code#l2");
  });
});

/* ================= 上下文方法探针 ================= */

describe("PanelManager 上下文方法（usePanelManager 探针）", () => {
  function Probe({
    actions,
  }: {
    actions: (ctx: NonNullable<ReturnType<typeof usePanelManager>>) => void;
  }) {
    const ctx = usePanelManager();
    useEffect(() => {
      if (ctx) { actions(ctx); }

    }, []);
    return null;
  }

  const renderProbe = (
    actions: (ctx: NonNullable<ReturnType<typeof usePanelManager>>) => void
  ) =>
    render(
      <Harness initialLayout={twoLeaf}>
        <Probe actions={actions} />
        <PanelLayoutArea />
      </Harness>
    );

  it("swapPanels: 双 leaf 面板互换", () => {
    const { container } = renderProbe((ctx) => ctx.swapPanels("l1", "l2"));
    expect(container.textContent).toContain("code#l1");
    expect(container.textContent).toContain("ai#l2");
  });

  it("replacePanel: 单 leaf 面板替换", () => {
    const { container } = renderProbe((ctx) => ctx.replacePanel("l2", "terminal"));
    expect(container.textContent).toContain("terminal#l2");
  });

  it("openPanel: 新面板追加到末尾 leaf / 已开面板 no-op", () => {
    const { container } = renderProbe((ctx) => {
      ctx.openPanel("git");
      ctx.openPanel("git"); // 已开 → 不变
    });
    expect(container.textContent).toContain("git#");
    expect(container.textContent.match(/git#/g)).toHaveLength(1);
  });

  it("mergePanel: 指定方向合并 → vertical split", () => {
    const { container } = renderProbe((ctx) => ctx.mergePanel("l1", "terminal", "bottom"));
    expect(container.textContent).toContain("terminal#");
    expect(container.textContent).toContain("ai#");
  });

  it("splitPanel 非 leaf / 不存在 id → no-op 不抛错", () => {
    const { container } = renderProbe((ctx) => {
      ctx.splitPanel("root", "horizontal", "git"); // root 是 split
      ctx.splitPanel("ghost", "horizontal", "git");
    });
    expect(container.textContent).toContain("ai#l1");
    expect(container.textContent).toContain("code#l2");
    expect(container.textContent).not.toContain("git#");
  });

  it("setLayout 函数式更新 + removePanel 同步清理最大化态", () => {
    const { container } = renderProbe((ctx) => {
      ctx.setMaximizedPanel("l2");
      ctx.removePanel("l2"); // maximized 同 id → 自动复位
    });
    expect(container.textContent).not.toContain("code#l2");
  });
});

/* ================= SplitContainer 拖拽调宽 ================= */

describe("SplitContainer 拖拽调宽", () => {
  it("水平拖拽: mousemove 推移尺寸 + 最小 10% 钳制 + mouseup 清理", () => {
    const { container } = render(
      <Harness initialLayout={twoLeaf}>
        <PanelLayoutArea />
      </Harness>
    );
    const handle = container.querySelector(".w-\\[3px\\]") as HTMLElement;
    expect(handle).toBeTruthy();

    // 向左猛拖 → 首栏钳制 10%
    fireEvent.mouseDown(handle, { clientX: 100, preventDefault: () => { } });
    fireEvent.mouseMove(window, { clientX: -5000 });
    const firstPane = handle.previousElementSibling as HTMLElement;
    expect(firstPane.style.width).toBe("10%");

    fireEvent.mouseUp(window);
    // 再次 move 无监听 → 尺寸保持
    fireEvent.mouseMove(window, { clientX: 100 });
    expect(firstPane.style.width).toBe("10%");
  });

  it("垂直拖拽: 高度方向钳制", () => {
    const verticalLayout: LayoutNode = {
      id: "root",
      type: "split",
      direction: "vertical",
      children: [
        { id: "t1", type: "leaf", panelId: "ai", size: 50 },
        { id: "t2", type: "leaf", panelId: "code", size: 50 },
      ],
    };
    const { container } = render(
      <Harness initialLayout={verticalLayout}>
        <PanelLayoutArea />
      </Harness>
    );
    const handle = container.querySelector(".h-\\[3px\\]") as HTMLElement;
    expect(handle).toBeTruthy();

    fireEvent.mouseDown(handle, { clientY: 100, preventDefault: () => { } });
    fireEvent.mouseMove(window, { clientY: -5000 });
    const firstPane = handle.previousElementSibling as HTMLElement;
    expect(firstPane.style.height).toBe("10%");

    fireEvent.mouseUp(window);
  });
});

/* ================= 双 store ================= */

describe("usePanelPinStore", () => {
  it("pin/unpin/lock/unlock 全链 + isPinned/isLocked", () => {
    const s = usePanelPinStore.getState();
    s.pinPanel("n1");
    expect(usePanelPinStore.getState().isPinned("n1")).toBe(true);
    usePanelPinStore.getState().unpinPanel("n1");
    expect(usePanelPinStore.getState().isPinned("n1")).toBe(false);

    usePanelPinStore.getState().lockPanel("n1");
    expect(usePanelPinStore.getState().isLocked("n1")).toBe(true);
    usePanelPinStore.getState().unlockPanel("n1");
    expect(usePanelPinStore.getState().isLocked("n1")).toBe(false);
  });

  it("togglePin/toggleLock 双态翻转 + clearAll", () => {
    const s = usePanelPinStore.getState();
    s.togglePin("n2");
    s.togglePin("n2");
    expect(usePanelPinStore.getState().isPinned("n2")).toBe(false);

    s.toggleLock("n2");
    expect(usePanelPinStore.getState().isLocked("n2")).toBe(true);
    usePanelPinStore.getState().clearAll();
    expect(usePanelPinStore.getState().isLocked("n2")).toBe(false);
  });

  it("持久化: pin 后 localStorage 出现序列化数组", () => {
    usePanelPinStore.getState().pinPanel("persist-node");
    const raw = localStorage.getItem("yyc3_panel_pins");
    expect(raw).toContain("persist-node");
  });
});

describe("useFloatingPanelStore", () => {
  it("detachPanel: 自动瀑布位置 / 显式坐标", () => {
    const id1 = useFloatingPanelStore.getState().detachPanel("ai");
    const id2 = useFloatingPanelStore.getState().detachPanel("git", 200, 300);
    const panels = useFloatingPanelStore.getState().floatingPanels;
    expect(panels).toHaveLength(2);
    expect(panels[0].x).toBe(100);
    expect(panels[1].x).toBe(200);
    expect(panels[1].y).toBe(300);
    expect(id1).toContain("float_");
    expect(id2).not.toBe(id1);
  });

  it("attachPanel: 取回 panelId 并移除 / 不存在返回 null", () => {
    const id = useFloatingPanelStore.getState().detachPanel("terminal");
    expect(useFloatingPanelStore.getState().attachPanel(id)).toBe("terminal");
    expect(useFloatingPanelStore.getState().attachPanel("ghost")).toBeNull();
    expect(useFloatingPanelStore.getState().floatingPanels).toHaveLength(0);
  });

  it("movePanel/resizePanel（min 钳制）/toggleMinimize", () => {
    const id = useFloatingPanelStore.getState().detachPanel("ai");
    useFloatingPanelStore.getState().movePanel(id, 42, 84);
    useFloatingPanelStore.getState().resizePanel(id, 10, 10); // 钳制 240x180
    useFloatingPanelStore.getState().toggleMinimize(id);
    const p = useFloatingPanelStore.getState().getFloatingPanel(id)!;
    expect(p.x).toBe(42);
    expect(p.y).toBe(84);
    expect(p.width).toBe(240);
    expect(p.height).toBe(180);
    expect(p.minimized).toBe(true);
    expect(useFloatingPanelStore.getState().isFloating("ai")).toBe(true);
    expect(useFloatingPanelStore.getState().isFloating("git")).toBe(false);
  });

  it("bringToFront: zIndex 递增 + closeAll 复位", () => {
    const id = useFloatingPanelStore.getState().detachPanel("ai");
    const before = useFloatingPanelStore.getState().getFloatingPanel(id)!.zIndex;
    useFloatingPanelStore.getState().bringToFront(id);
    const after = useFloatingPanelStore.getState().getFloatingPanel(id)!.zIndex;
    expect(after).toBeGreaterThan(before);
    useFloatingPanelStore.getState().closeAll();
    expect(useFloatingPanelStore.getState().floatingPanels).toHaveLength(0);
    expect(useFloatingPanelStore.getState().nextZIndex).toBe(1000);
  });
});

/* ================= IDELayout 补充分支 ================= */

describe("IDELayout 补充分支", () => {
  const toEditMode = (container: HTMLElement) => {
    fireEvent.keyDown(window, { key: "3", ctrlKey: true }); // preview → free
    fireEvent.keyDown(window, { key: "3", ctrlKey: true }); // free → edit
    expect(container.textContent).toContain("终端仅在右栏显示");
  };

  it("edit 模式文件选择 → code 面板打开 tab（面包屑渲染）", () => {
    const { container } = render(<IDELayout />);
    toEditMode(container);
    fireEvent.click(screen.getByText("App.tsx").closest("button")!);
    expect(container.textContent).toContain("src/App.tsx");
  });

  it("关闭 tab → code 面板恢复空态", () => {
    const { container } = render(<IDELayout />);
    toEditMode(container);
    fireEvent.click(screen.getAllByText("App.tsx")[0].closest("button")!);
    expect(container.textContent).toContain("src/App.tsx");

    // CodePreviewPanel 内 tab 的 X 关闭钮（面包屑里的 App.tsx 是最后一个匹配）
    const tabSpan = screen.getAllByText("App.tsx").at(-1)!;
    const closeBtn = tabSpan.closest("button")!.querySelector("span.p-0\\.5") as HTMLElement;
    fireEvent.click(closeBtn);
    expect(container.textContent).toContain("选择文件开始编辑");
  });

  it("preview 面板占位: renderPanel default 分支渲染「面板: preview」", () => {
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("面板: preview");
  });

  it("TopBar 资源管理器按钮 → 布局模式翻转", () => {
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("终端跨越中栏+右栏");
    fireEvent.click(container.querySelector('[title="资源管理器"]')!);
    expect(container.textContent).toContain("终端仅在右栏显示");
  });

  it("TopBar 通知按钮: Notification granted → 构造通知", () => {
    const notifMock = vi.fn();
    class FakeNotification {
      static permission = "granted";
      constructor(public title: string, public options?: Record<string, unknown>) {
        notifMock(title, options);
      }
    }
    vi.stubGlobal("Notification", FakeNotification);
    const { container } = render(<IDELayout />);
    fireEvent.click(container.querySelector('[title="通知"]')!);
    expect(notifMock).toHaveBeenCalledWith("智能 AI 编程工作台", expect.anything());
    vi.unstubAllGlobals();
  });

  it("TopBar 通知按钮: default → requestPermission 授权后构造通知", async () => {
    const notifMock = vi.fn();
    const reqPerm = vi.fn().mockResolvedValue("granted");
    class FakeNotification {
      static permission = "default";
      static requestPermission = reqPerm;
      constructor(public title: string, public options?: Record<string, unknown>) {
        notifMock(title, options);
      }
    }
    vi.stubGlobal("Notification", FakeNotification);
    const { container } = render(<IDELayout />);
    fireEvent.click(container.querySelector('[title="通知"]')!);
    await vi.waitFor(() => expect(reqPerm).toHaveBeenCalled());
    await vi.waitFor(() => expect(notifMock).toHaveBeenCalled());
    vi.unstubAllGlobals();
  });

  it("TopBar GitHub 按钮 → window.open 新窗口", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    const { container } = render(<IDELayout />);
    fireEvent.click(container.querySelector('[title="GitHub"]')!);
    expect(openSpy).toHaveBeenCalledWith("https://github.com", "_blank", "noopener,noreferrer");
  });

  it("TopBar 分享按钮 → clipboard 写入当前 URL", () => {
    const { container } = render(<IDELayout />);
    fireEvent.click(container.querySelector('[title="分享"]')!);
    expect(clipboardWrite).toHaveBeenCalledWith(window.location.href);
  });

  it("TopBar 返回按钮 → navigate(-1)", () => {
    const { container } = render(<IDELayout />);
    fireEvent.click(container.querySelector("button")!); // 首个按钮 = Logo/onBack
    expect(navigateMock).toHaveBeenCalledWith(-1);
  });

  it("全屏切换: requestFullscreen / exitFullscreen 双分支", () => {
    const reqFs = vi.fn().mockResolvedValue(undefined);
    const exitFs = vi.fn().mockResolvedValue(undefined);
    document.documentElement.requestFullscreen = reqFs;
    document.exitFullscreen = exitFs;

    const { container } = render(<IDELayout />);
    const fsBtn = container.querySelector('[title="全屏"]')!;

    fireEvent.click(fsBtn); // 无 fullscreenElement → request
    expect(reqFs).toHaveBeenCalled();

    Object.defineProperty(document, "fullscreenElement", {
      value: document.documentElement,
      configurable: true,
    });
    fireEvent.click(fsBtn); // 已全屏 → exit
    expect(exitFs).toHaveBeenCalled();

    delete (document as unknown as Record<string, unknown>).fullscreenElement;
  });
});
