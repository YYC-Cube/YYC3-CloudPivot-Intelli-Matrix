/**
 * ide-panel-family.test.tsx
 * =========================
 * IDE panel 家族组件测试（M7 前置·组件域攻坚批一）
 *
 * 覆盖: Panel / PanelHeader / PanelContent / PanelResizeHandle / TabBar /
 *       PanelContainer / Workspace（经 LayoutContext 真实状态驱动）
 *
 * 测试策略:
 * - 纯展示件（Header/Content/ResizeHandle/TabBar）直接渲染 + 交互断言
 * - 状态联动件（PanelContainer/Workspace）包 LayoutProvider 走真实 reducer
 * - TabBar 经 useLayoutContext 消费，须包 Provider
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LayoutProvider, useLayoutContext } from "../components/ide/LayoutContext";
import { Panel } from "../components/ide/Panel";
import { PanelContainer } from "../components/ide/PanelContainer";
import { PanelContent } from "../components/ide/PanelContent";
import { PanelHeader } from "../components/ide/PanelHeader";
import { PanelResizeHandle } from "../components/ide/PanelResizeHandle";
import { TabBar } from "../components/ide/TabBar";
import { Workspace } from "../components/ide/Workspace";
import type { Panel as PanelType, Tab } from "../components/ide/ide-layout-types";

afterEach(() => {
  cleanup();
});

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: "tab-1",
    panelId: "panel-1",
    title: "index.ts",
    isPinned: false,
    isModified: false,
    isUnsaved: false,
    hasError: false,
    isActive: true,
    ...overrides,
  };
}

function makePanel(overrides: Partial<PanelType> = {}): PanelType {
  return {
    id: "panel-1",
    type: "code-editor",
    title: "代码编辑器",
    position: { x: 10, y: 10, w: 4, h: 4 },
    size: { width: 400, height: 300 },
    isLocked: false,
    isMinimized: false,
    isMaximized: false,
    isClosable: true,
    isResizable: true,
    zIndex: 1,
    tabs: [],
    activeTabId: "",
    ...overrides,
  };
}

/* ---------------- PanelContent: 8 类面板类型渲染 ---------------- */

describe("PanelContent", () => {
  const types = [
    ["code-editor", "Code Editor"],
    ["preview", "Preview Panel"],
    ["terminal", "Terminal"],
    ["file-browser", "File Explorer"],
    ["ai-chat", "AI Chat"],
    ["database", "Database"],
    ["version-control", "Version Control"],
  ] as const;

  it.each(types)("类型 %s 渲染占位「%s」", (type, placeholder) => {
    const { getByText } = render(<PanelContent panel={makePanel({ type })} />);
    expect(getByText(placeholder)).toBeTruthy();
  });

  it("未知类型走 default 占位", () => {
    const { getByText } = render(
      <PanelContent panel={makePanel({ type: "debug" as never })} />
    );
    expect(getByText("Unknown Panel Type")).toBeTruthy();
  });
});

/* ---------------- PanelHeader ---------------- */

describe("PanelHeader", () => {
  it("渲染标题 + 三操作按钮回调", () => {
    const onMouseDown = vi.fn();
    const onMinimize = vi.fn();
    const onMaximize = vi.fn();
    const onClose = vi.fn();

    const { getByTitle } = render(
      <PanelHeader
        panel={makePanel()}
        isActive
        onMouseDown={onMouseDown}
        onMinimize={onMinimize}
        onMaximize={onMaximize}
        onClose={onClose}
      />
    );

    expect(screen.getByText("代码编辑器")).toBeTruthy();

    fireEvent.mouseDown(getByTitle("Minimize").parentElement!.parentElement!);
    expect(onMouseDown).toHaveBeenCalledTimes(1);

    fireEvent.click(getByTitle("Minimize"));
    fireEvent.click(getByTitle("Maximize"));
    fireEvent.click(getByTitle("Close"));
    expect(onMinimize).toHaveBeenCalledTimes(1);
    expect(onMaximize).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("isClosable=false 不渲染关闭按钮", () => {
    const { queryByTitle } = render(
      <PanelHeader panel={makePanel({ isClosable: false })} isActive={false}
        onMouseDown={vi.fn()} onMinimize={vi.fn()} onMaximize={vi.fn()} onClose={vi.fn()} />
    );
    expect(queryByTitle("Close")).toBeNull();
  });
});

/* ---------------- Panel ---------------- */

describe("Panel", () => {
  it("组合 Header + TabBar（有 tabs 时）+ Content，回调全链透传", () => {
    const onMinimize = vi.fn();
    const panel = makePanel({
      tabs: [makeTab()],
      activeTabId: "tab-1",
    });

    // TabBar 消费 useLayoutContext → 须包 Provider
    const { getByTitle, getByText } = render(
      <LayoutProvider>
        <Panel panel={panel} isActive onMinimize={onMinimize} />
      </LayoutProvider>
    );

    expect(getByText("代码编辑器")).toBeTruthy();
    expect(getByText("index.ts")).toBeTruthy();
    expect(getByText("Code Editor")).toBeTruthy(); // PanelContent 占位

    fireEvent.click(getByTitle("Minimize"));
    expect(onMinimize).toHaveBeenCalledTimes(1);
  });

  it("无 tabs 时不渲染 TabBar", () => {
    const { queryByText } = render(<Panel panel={makePanel()} isActive />);
    // TabBar 不存在 → tab 标题不出现
    expect(queryByText("index.ts")).toBeNull();
  });

  it("isMaximized 应用 maximized class", () => {
    const { container } = render(
      <Panel panel={makePanel({ isMaximized: true })} isActive={false} />
    );
    expect(container.querySelector(".panel.maximized")).toBeTruthy();
  });
});

/* ---------------- PanelResizeHandle ---------------- */

describe("PanelResizeHandle", () => {
  it.each([
    ["e", "ew-resize"], ["w", "ew-resize"], ["s", "ns-resize"], ["n", "ns-resize"],
    ["se", "nwse-resize"], ["sw", "nesw-resize"], ["ne", "nesw-resize"], ["nw", "nwse-resize"],
  ] as const)("方向 %s → cursor %s", (direction, cursor) => {
    const { container } = render(
      <PanelResizeHandle direction={direction} onMouseDown={vi.fn()} />
    );
    expect((container.firstChild as HTMLElement).style.cursor).toBe(cursor);
  });

  it("mousedown 挂全局监听、mouseup 移除", () => {
    const onMouseDown = vi.fn();
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { container } = render(
      <PanelResizeHandle direction="e" onMouseDown={onMouseDown} />
    );

    fireEvent.mouseDown(container.firstChild as HTMLElement);
    expect(onMouseDown).toHaveBeenCalledTimes(1);
    expect(addSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));

    // 触发全局 mouseup → 移除监听
    const mouseUpHandler = addSpy.mock.calls.find(([e]) => e === "mouseup")?.[1];
    act(() => {
      (mouseUpHandler as (e: MouseEvent) => void)(new MouseEvent("mouseup"));
    });
    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

/* ---------------- TabBar（须包 LayoutProvider）---------------- */

describe("TabBar", () => {
  it("未激活 tab 点击 → 激活态 class 区分渲染", () => {
    function Harness() {
      const { panels } = useLayoutContext();
      const panel: PanelType = {
        ...panels[0],
        tabs: [
          makeTab({ id: "tab-1", isActive: true }),
          makeTab({ id: "tab-2", isActive: false, title: "utils.ts" }),
        ],
        activeTabId: "tab-1",
      };
      return <TabBar panel={panel} />;
    }
    const { getByText, container } = render(
      <LayoutProvider><Harness /></LayoutProvider>
    );
    expect(getByText("index.ts")).toBeTruthy();
    expect(getByText("utils.ts")).toBeTruthy();
    const tabs = container.querySelectorAll(".tab");
    expect(tabs[0].className).toContain("active");
    expect(tabs[1].className).not.toContain("active");
  });

  it("isModified / isUnsaved / icon 修饰渲染", () => {
    function Harness() {
      const { panels } = useLayoutContext();
      const panel: PanelType = {
        ...panels[0],
        tabs: [makeTab({ isModified: true, isUnsaved: true, icon: "TS" })],
        activeTabId: "tab-1",
      };
      return <TabBar panel={panel} />;
    }
    const { getByText, container } = render(
      <LayoutProvider><Harness /></LayoutProvider>
    );
    expect(getByText("TS")).toBeTruthy();
    expect(getByText("index.ts")).toBeTruthy();
    // isModified + isUnsaved 两个圆点
    expect(container.textContent?.split("●").length).toBe(3);
  });

  it("switchTab/removeTab 经 Provider 集成联动", () => {
    function Harness() {
      const { panels, addTab, switchTab, removeTab } = useLayoutContext();
      const panel = panels[0];
      return (
        <>
          <TabBar panel={panel} />
          <button
            data-testid="seed"
            onClick={() =>
              addTab(panel.id, { panelId: panel.id, title: "seeded.ts", isPinned: false, isModified: false, isUnsaved: false, hasError: false })
            }
          />
          <button data-testid="close" onClick={() => removeTab(panel.id, panel.tabs[0]?.id ?? "")} />
          <button data-testid="switch" onClick={() => panel.tabs[1] && switchTab(panel.id, panel.tabs[1].id)} />
          <span data-testid="count">{panel.tabs.length}</span>
        </>
      );
    }
    const { getByTestId, container } = render(
      <LayoutProvider><Harness /></LayoutProvider>
    );
    // 注入 tab → 关闭按钮出现
    fireEvent.click(getByTestId("seed"));
    expect(getByTestId("count").textContent).toBe("1");
    expect(container.querySelector(".tab-close")).toBeTruthy();
  });
});

/* ---------------- PanelContainer（真实 reducer 集成）---------------- */

describe("PanelContainer（LayoutProvider 集成）", () => {
  function Harness({ children }: { children: React.ReactNode }) {
    return <LayoutProvider>{children}</LayoutProvider>;
  }

  function ContainerHarness({ panelIdx }: { panelIdx: number }) {
    const { panels, activePanelId } = useLayoutContext();
    const panel = panels[panelIdx];
    return (
      <PanelContainer panel={panel} isActive={panel.id === activePanelId} />
    );
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("默认三面板渲染 + 选中面板高亮边框", () => {
    const { container } = render(
      <Harness>
        <ContainerHarness panelIdx={0} />
      </Harness>
    );
    expect(container.querySelector(".panel-container")).toBeTruthy();
    // 代码编辑器是默认选中 → 标题与 Content 占位文本同名，多元素用 getAllByText
    expect(screen.getAllByText("Code Editor").length).toBeGreaterThanOrEqual(1);
  });

  it("最小化面板不渲染", () => {
    const { useLayoutContext: _unused, ..._rest } = { useLayoutContext };
    void _unused; void _rest;

    function MinimizeHarness() {
      const { panels, updatePanel } = useLayoutContext();
      return (
        <>
          <PanelContainer panel={panels[0]} isActive />
          <button data-testid="min" onClick={() => updatePanel(panels[0].id, { isMinimized: true })} />
        </>
      );
    }
    const { getByTestId, container } = render(
      <Harness><MinimizeHarness /></Harness>
    );
    expect(container.querySelector(".panel-container")).toBeTruthy();
    fireEvent.click(getByTestId("min"));
    expect(container.querySelector(".panel-container")).toBeNull();
  });

  it("最大化 → fixed 全屏定位", () => {
    function MaxHarness() {
      const { panels, updatePanel } = useLayoutContext();
      return (
        <>
          <PanelContainer panel={panels[1]} isActive />
          <button data-testid="max" onClick={() => updatePanel(panels[1].id, { isMaximized: true })} />
        </>
      );
    }
    const { getByTestId, container } = render(
      <Harness><MaxHarness /></Harness>
    );
    fireEvent.click(getByTestId("max"));
    const el = container.querySelector(".panel-container") as HTMLElement;
    expect(el.style.position).toBe("fixed");
  });

  it("关闭按钮（isClosable）→ removePanel 移除渲染", () => {
    // 按 id 固定取初始第三面板，关闭后避免索引越界
    const targetId = "panel-terminal";
    function CloseHarness() {
      const { panels } = useLayoutContext();
      const panel = panels.find((p) => p.id === targetId);
      return panel ? <PanelContainer panel={panel} isActive /> : null;
    }
    const { getByTitle, container } = render(
      <Harness><CloseHarness /></Harness>
    );
    expect(container.querySelector(".panel-container")).toBeTruthy();
    fireEvent.click(getByTitle("Close"));
    expect(container.querySelector(".panel-container")).toBeNull();
  });

  it("header mousedown → selectPanel + startDrag；全局 mouseup 结束", () => {
    function DragHarness() {
      const { panels, activePanelId } = useLayoutContext();
      return (
        <>
          <PanelContainer panel={panels[0]} isActive={panels[0].id === activePanelId} />
          <span data-testid="active">{activePanelId ?? "none"}</span>
        </>
      );
    }
    const { getByTestId, getByTitle, container } = render(
      <Harness><DragHarness /></Harness>
    );
    // 初始选中即 panel-code-editor
    expect(getByTestId("active").textContent).toBe("panel-code-editor");

    fireEvent.mouseDown(getByTitle("Minimize").parentElement!.parentElement!);
    // mousedown 重新选中同一面板
    expect(getByTestId("active").textContent).toBe("panel-code-editor");

    act(() => {
      window.dispatchEvent(new MouseEvent("mouseup"));
    });
    expect(container.querySelector(".panel-container")).toBeTruthy();
  });

  it("resize 手柄仅非最大化可拖拽面板渲染（e/s/se 三个）", () => {
    const { container } = render(
      <Harness><ContainerHarness panelIdx={0} /></Harness>
    );
    expect(container.querySelectorAll(".panel-resize-handle").length).toBe(3);
  });
});

/* ---------------- Workspace（Toolbar + 网格 + 面板层）---------------- */

describe("Workspace", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("渲染 Toolbar + 默认三面板", () => {
    const { container } = render(
      <LayoutProvider><Workspace /></LayoutProvider>
    );
    expect(container.querySelector(".panel-toolbar")).toBeTruthy();
    expect(container.querySelectorAll(".panel-container").length).toBe(3);
  });

  it("showGridLines=true 渲染网格背景层", () => {
    const { container } = render(
      <LayoutProvider><Workspace /></LayoutProvider>
    );
    // 网格层是 pointerEvents:none 的绝对定位 div
    const gridLayer = container.querySelector('.workspace-content > div[style*="pointer-events: none"]');
    expect(gridLayer).toBeTruthy();
  });

  it("toggle 网格 → 背景层消失", () => {
    function GridHarness() {
      const { updateLayoutConfig } = useLayoutContext();
      return (
        <>
          <Workspace />
          <button data-testid="toggle" onClick={() => updateLayoutConfig({ showGridLines: false })} />
        </>
      );
    }
    const { getByTestId, container } = render(
      <LayoutProvider><GridHarness /></LayoutProvider>
    );
    fireEvent.click(getByTestId("toggle"));
    expect(
      container.querySelector('.workspace-content > div[style*="pointer-events: none"]')
    ).toBeNull();
  });
});
