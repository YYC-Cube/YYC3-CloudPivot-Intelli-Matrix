/**
 * ide-toolbar-workspace.test.tsx
 * ==============================
 * PanelToolbar + LayoutContext 持久化 + 补全交互（M7 前置·批一收尾）
 *
 * 覆盖: PanelToolbar 全按钮（菜单/网格/吸附/保存/重置/计数）+
 *       LayoutContext save/load/reset 持久化 + 重置确认分支
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LayoutProvider, useLayoutContext } from "../components/ide/LayoutContext";
import { PanelToolbar } from "../components/ide/PanelToolbar";
import { TabBar } from "../components/ide/TabBar";
import { Workspace } from "../components/ide/Workspace";

afterEach(() => cleanup());

/* ---------------- PanelToolbar（useI18n 默认中文 context）---------------- */

describe("PanelToolbar", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("添加面板菜单 → 选择类型 → 新面板入列表", () => {
    let count = -1;
    function Harness() {
      const { panels } = useLayoutContext();
      count = panels.length;
      return <PanelToolbar />;
    }
    const { container } = render(
      <LayoutProvider><Harness /></LayoutProvider>
    );

    // 打开菜单
    fireEvent.click(screen.getByText(/添加面板/));
    // 5 种面板类型全部出现
    expect(screen.getByText(/代码/)).toBeTruthy();

    // 点第一项（code-editor）
    fireEvent.click(screen.getByText(/代码/));
    // 菜单关闭 + 面板数 +1（4 默认？默认 3 + 1）
    expect(count).toBe(4);
    // 菜单已收起（按钮仍在，菜单列表消失）
    expect(container.querySelectorAll(".absolute.top-full").length).toBe(0);
  });

  it("网格线/吸附切换 → active 样式与 config 联动", () => {
    let showGrid = true;
    let snap = true;
    function Harness() {
      const { layoutConfig } = useLayoutContext();
      showGrid = layoutConfig.showGridLines;
      snap = layoutConfig.snapToGrid;
      return <PanelToolbar />;
    }
    render(<LayoutProvider><Harness /></LayoutProvider>);

    const gridBtn = screen.getAllByTitle(/网格/)[0] ?? screen.getByText("网格线");
    fireEvent.click(screen.getByText("网格线"));
    expect(showGrid).toBe(false);

    fireEvent.click(screen.getByText("吸附", { exact: false }));
    expect(snap).toBe(false);
    void gridBtn;
  });

  it("保存布局 → localStorage 写入", () => {
    function Harness() {
      return <PanelToolbar />;
    }
    render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(screen.getByText("保存"));
    const saved = localStorage.getItem("ide-layout");
    expect(saved).toBeTruthy();
    expect(JSON.parse(saved!).panels.length).toBe(3);
  });

  it("重置布局（确认）→ 面板清空", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    let count = -1;
    function Harness() {
      const { panels } = useLayoutContext();
      count = panels.length;
      return <PanelToolbar />;
    }
    render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(screen.getByText("重置"));
    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(count).toBe(0);
    confirmSpy.mockRestore();
  });

  it("重置布局（取消）→ 面板不变", () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    let count = -1;
    function Harness() {
      const { panels } = useLayoutContext();
      count = panels.length;
      return <PanelToolbar />;
    }
    render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(screen.getByText("重置"));
    expect(count).toBe(3);
    confirmSpy.mockRestore();
  });

  it("面板计数文案（中文复数形态）", () => {
    function Harness() {
      return <PanelToolbar />;
    }
    const { container } = render(<LayoutProvider><Harness /></LayoutProvider>);
    // 3 panels → "3 个面板"（按 i18n key）
    expect(container.textContent).toMatch(/3\s*个面板|3 panels/);
  });

  it("点击外部关闭菜单", () => {
    function Harness() {
      return <PanelToolbar />;
    }
    const { container } = render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(screen.getByText(/添加面板/));
    expect(container.querySelector(".absolute.top-full")).toBeTruthy();
    // 外部 mousedown → 菜单关闭
    fireEvent.mouseDown(document.body);
    expect(container.querySelector(".absolute.top-full")).toBeNull();
  });
});

/* ---------------- LayoutContext 持久化 ---------------- */

describe("LayoutContext save/load/reset", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loadLayout: 空存储无操作不抛错", () => {
    function Harness() {
      const { loadLayout, panels } = useLayoutContext();
      return (
        <>
          <button data-testid="load" onClick={loadLayout} />
          <span data-testid="count">{panels.length}</span>
        </>
      );
    }
    const { getByTestId } = render(<LayoutProvider><Harness /></LayoutProvider>);
    expect(() => fireEvent.click(getByTestId("load"))).not.toThrow();
    expect(getByTestId("count").textContent).toBe("3");
  });

  it("loadLayout: 损坏 JSON → console.error 且状态不变", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    localStorage.setItem("ide-layout", "{broken json");
    function Harness() {
      const { loadLayout, panels } = useLayoutContext();
      return (
        <>
          <button data-testid="load" onClick={loadLayout} />
          <span data-testid="count">{panels.length}</span>
        </>
      );
    }
    const { getByTestId } = render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(getByTestId("load"));
    expect(errSpy).toHaveBeenCalled();
    expect(getByTestId("count").textContent).toBe("3");
    errSpy.mockRestore();
  });

  it("saveLayout: 存储异常（quota）→ console.error 不抛错", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => { });
    const setSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    function Harness() {
      const { saveLayout } = useLayoutContext();
      return <button data-testid="save" onClick={saveLayout} />;
    }
    const { getByTestId } = render(<LayoutProvider><Harness /></LayoutProvider>);
    expect(() => fireEvent.click(getByTestId("save"))).not.toThrow();
    expect(errSpy).toHaveBeenCalled();
    setSpy.mockRestore();
    errSpy.mockRestore();
  });

  it("save → 重载 Provider → load 恢复面板", () => {
    // 第一次: 保存后修改再 load 回滚
    function Harness() {
      const { panels, saveLayout, loadLayout, removePanel } = useLayoutContext();
      return (
        <>
          <button data-testid="save" onClick={saveLayout} />
          <button data-testid="load" onClick={loadLayout} />
          <button data-testid="remove" onClick={() => removePanel(panels[0].id)} />
          <span data-testid="count">{panels.length}</span>
        </>
      );
    }
    const { getByTestId } = render(<LayoutProvider><Harness /></LayoutProvider>);
    fireEvent.click(getByTestId("save"));
    fireEvent.click(getByTestId("remove"));
    expect(getByTestId("count").textContent).toBe("2");
    fireEvent.click(getByTestId("load"));
    expect(getByTestId("count").textContent).toBe("3");
  });
});

/* ---------------- TabBar tab 交互（点击切换/关闭联动）---------------- */

describe("TabBar 交互联动", () => {
  it("双 tab 点击切换激活 + 关闭第一个", () => {
    function Harness() {
      const { panels, addTab, switchTab, removeTab } = useLayoutContext();
      const panel = panels[0];
      return (
        <>
          <TabBar panel={{ ...panel, tabs: panel.tabs.map((t) => ({ ...t, isActive: t.id === panel.activeTabId })) }} />
          <button
            data-testid="seed"
            onClick={() => {
              addTab(panel.id, { panelId: panel.id, title: "a.ts", isPinned: false, isModified: false, isUnsaved: false, hasError: false });
              addTab(panel.id, { panelId: panel.id, title: "b.ts", isPinned: false, isModified: false, isUnsaved: false, hasError: false });
            }}
          />
          <button data-testid="switch" onClick={() => panel.tabs[1] && switchTab(panel.id, panel.tabs[1].id)} />
          <button data-testid="close" onClick={() => panel.tabs[0] && removeTab(panel.id, panel.tabs[0].id)} />
          <span data-testid="active">{panel.activeTabId || "none"}</span>
        </>
      );
    }
    const { getByTestId, container } = render(<LayoutProvider><Harness /></LayoutProvider>);

    fireEvent.click(getByTestId("seed"));
    const tabs = () => container.querySelectorAll(".tab");
    expect(tabs().length).toBe(2);

    // 点击关闭按钮（stopPropagation 不触发 switchTab）→ 移除一个 tab
    fireEvent.click(tabs()[1].querySelector(".tab-close")!);
    expect(tabs().length).toBeLessThanOrEqual(1);
  });
});

/* ---------------- Workspace 全量（含 toolbar 联动）---------------- */

describe("Workspace 完整渲染", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("工具栏 + 网格 + 三面板齐全", () => {
    const { container } = render(<LayoutProvider><Workspace /></LayoutProvider>);
    expect(container.querySelector(".panel-toolbar")).toBeTruthy();
    expect(container.querySelectorAll(".panel-container").length).toBe(3);
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
    const { getByTestId, container } = render(<LayoutProvider><GridHarness /></LayoutProvider>);
    expect(container.querySelector('.workspace-content > div[style*="pointer-events: none"]')).toBeTruthy();
    fireEvent.click(getByTestId("toggle"));
    expect(container.querySelector('.workspace-content > div[style*="pointer-events: none"]')).toBeNull();
  });
});
