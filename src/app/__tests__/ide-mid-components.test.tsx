/**
 * ide-mid-components.test.tsx
 * ===========================
 * 组件域攻坚批五（M7 · IDE 中件）: CodePreviewPanel / IDETopBar / IDEViewSwitcher
 *
 * 覆盖:
 * - CodePreviewPanel: 空态/多 tab 渲染/切换/关闭/修改标记/面包屑/语言标签
 * - IDETopBar: Logo/模型选择器开合/切换模型/右上角动作按钮回调
 * - IDEViewSwitcher: 视图切换/布局模式切换/全屏/搜索/更多菜单（含缺键回退）
 */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
}));
const navigateMock = vi.fn();

import { CodePreviewPanel } from "../components/ide/CodePreviewPanel";
import { IDETopBar } from "../components/ide/IDETopBar";
import { IDEViewSwitcher } from "../components/ide/IDEViewSwitcher";
import type { OpenTab } from "../components/ide/ide-types";

afterEach(() => {
  cleanup();
  navigateMock.mockClear();
});

const makeTab = (overrides: Partial<OpenTab> = {}): OpenTab => ({
  id: "tab-1",
  filename: "App.tsx",
  filepath: "src/App.tsx",
  content: "const a = 1;\nconst b = 2;",
  isModified: false,
  ...overrides,
});

/* ================= CodePreviewPanel ================= */

describe("CodePreviewPanel", () => {
  const noop = () => { };

  it("空 tab → 空态提示", () => {
    const { container } = render(
      <CodePreviewPanel openTabs={[]} activeTabId="" onTabSelect={noop} onTabClose={noop} onContentChange={noop} />
    );
    expect(container.textContent).toContain("选择文件开始编辑");
    expect(container.textContent).toContain("从资源管理器打开文件");
  });

  it("tab 渲染 → 文件名 + 面包屑 + 语言标签", () => {
    const { container } = render(
      <CodePreviewPanel
        openTabs={[makeTab()]}
        activeTabId="tab-1"
        onTabSelect={noop}
        onTabClose={noop}
        onContentChange={noop}
      />
    );
    expect(container.textContent).toContain("App.tsx");
    expect(container.textContent).toContain("src/App.tsx");
    expect(container.textContent).toContain("TSX");
  });

  it("isModified → 修改圆点标记", () => {
    const { container } = render(
      <CodePreviewPanel
        openTabs={[makeTab({ isModified: true })]}
        activeTabId="tab-1"
        onTabSelect={noop}
        onTabClose={noop}
        onContentChange={noop}
      />
    );
    expect(container.querySelector(".fill-\\[\\#00d4ff\\]")).toBeTruthy();
  });

  it("多 tab: 点击切换 onTabSelect / 点击 X 关闭 onTabClose（stopPropagation）", () => {
    const onTabSelect = vi.fn();
    const onTabClose = vi.fn();
    render(
      <CodePreviewPanel
        openTabs={[makeTab(), makeTab({ id: "tab-2", filename: "routes.ts" })]}
        activeTabId="tab-1"
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onContentChange={noop}
      />
    );

    fireEvent.click(screen.getByText("routes.ts"));
    expect(onTabSelect).toHaveBeenCalledWith("tab-2");

    // 关闭按钮（X 图标 span）: 定位 tab-2 按钮内部的 span
    const tab2Btn = screen.getByText("routes.ts").closest("button")!;
    const closeBtn = tab2Btn.querySelector("span.p-0\\.5") as HTMLElement;
    expect(closeBtn).toBeTruthy();
    fireEvent.click(closeBtn);
    expect(onTabClose).toHaveBeenCalledWith("tab-2");
  });

  it("activeTabId 不存在 → No active file 兜底", () => {
    const { container } = render(
      <CodePreviewPanel
        openTabs={[makeTab()]}
        activeTabId="ghost"
        onTabSelect={noop}
        onTabClose={noop}
        onContentChange={noop}
      />
    );
    expect(container.textContent).toContain("No active file");
  });
});

/* ================= IDETopBar ================= */

describe("IDETopBar", () => {
  const baseProps = {
    projectName: "测试项目",
    onBack: vi.fn(),
    selectedModel: "glm-4-flash",
    onModelChange: vi.fn(),
  };

  beforeEach(() => {
    baseProps.onBack.mockClear();
    baseProps.onModelChange.mockClear();
  });

  it("渲染 → Logo + 项目名 + 当前模型（在线状态）", () => {
    const { container } = render(<IDETopBar {...baseProps} />);
    expect(container.textContent).toContain("CloudPivot AI");
    expect(container.textContent).toContain("测试项目");
    expect(container.textContent).toContain("GLM-4 Flash");
    expect(container.textContent).toContain("Z.ai");
  });

  it("返回按钮回调", () => {
    const { container } = render(<IDETopBar {...baseProps} />);
    fireEvent.click(container.querySelector("button")!); // 首个按钮 = Logo/onBack
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("模型选择器: 开合 + 选择切换 + 当前项高亮", () => {
    const { container } = render(<IDETopBar {...baseProps} />);
    // 打开
    fireEvent.click(screen.getByText("GLM-4 Flash").closest("button")!);
    expect(container.textContent).toContain("GPT-4o");
    expect(container.textContent).toContain("LLaMA-3 8B");
    expect(container.textContent).toContain("DeepSeek-V3");

    // 选择 GPT-4o
    fireEvent.click(screen.getByText("GPT-4o"));
    expect(baseProps.onModelChange).toHaveBeenCalledWith("gpt-4o");
    // 菜单关闭
    expect(container.textContent).not.toContain("LLaMA-3 8B");
  });

  it("右上角动作按钮: 探索器/通知/设置/Repo/分享/部署回调", () => {
    const onToggleExplorer = vi.fn();
    const onToggleNotifications = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenRepo = vi.fn();
    const onShare = vi.fn();
    const onDeploy = vi.fn();
    const { container } = render(
      <IDETopBar
        {...baseProps}
        onToggleExplorer={onToggleExplorer}
        onToggleNotifications={onToggleNotifications}
        onOpenSettings={onOpenSettings}
        onOpenRepo={onOpenRepo}
        onShare={onShare}
        onDeploy={onDeploy}
      />
    );

    fireEvent.click(container.querySelector('[title="资源管理器"]')!);
    fireEvent.click(container.querySelector('[title="通知"]')!);
    fireEvent.click(container.querySelector('[title="设置"]')!);
    fireEvent.click(container.querySelector('[title="GitHub"]')!);
    fireEvent.click(container.querySelector('[title="分享"]')!);
    fireEvent.click(container.querySelector('[title="部署"]')!);

    expect(onToggleExplorer).toHaveBeenCalledTimes(1);
    expect(onToggleNotifications).toHaveBeenCalledTimes(1);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);
    expect(onOpenRepo).toHaveBeenCalledTimes(1);
    expect(onShare).toHaveBeenCalledTimes(1);
    expect(onDeploy).toHaveBeenCalledTimes(1);
  });
});

/* ================= IDEViewSwitcher ================= */

describe("IDEViewSwitcher", () => {
  const baseProps = {
    viewMode: "default" as const,
    onViewChange: vi.fn(),
    layoutMode: "preview" as const,
    onLayoutModeChange: vi.fn(),
    onSearch: vi.fn(),
    onFullscreen: vi.fn(),
  };

  beforeEach(() => {
    baseProps.onViewChange.mockClear();
    baseProps.onLayoutModeChange.mockClear();
    baseProps.onSearch.mockClear();
    baseProps.onFullscreen.mockClear();
  });

  it("渲染 → 全屏/视图按钮/布局模式按钮/搜索", () => {
    const { container } = render(<IDEViewSwitcher {...baseProps} />);
    expect(container.textContent).toContain("全屏");
    expect(container.textContent).toContain("预览");
    expect(container.textContent).toContain("代码");
    expect(container.textContent).toContain("编辑模式");
    expect(container.textContent).toContain("自由模式");
    expect(container.textContent).toContain("搜索");
  });

  it("视图切换: 激活传 mode / 再点传 default", () => {
    const { container, rerender } = render(<IDEViewSwitcher {...baseProps} />);
    fireEvent.click(container.querySelector('[title*="Ctrl+1"]')!);
    expect(baseProps.onViewChange).toHaveBeenLastCalledWith("preview");

    rerender(<IDEViewSwitcher {...baseProps} viewMode="preview" />);
    fireEvent.click(container.querySelector('[title*="Ctrl+1"]')!);
    expect(baseProps.onViewChange).toHaveBeenLastCalledWith("default");
  });

  it("布局模式切换 → onLayoutModeChange(mode)", () => {
    const { container } = render(<IDEViewSwitcher {...baseProps} />);
    fireEvent.click(container.querySelector('[title*="编辑模式"]')!);
    expect(baseProps.onLayoutModeChange).toHaveBeenCalledWith("edit");
    fireEvent.click(container.querySelector('[title*="自由模式"]')!);
    expect(baseProps.onLayoutModeChange).toHaveBeenCalledWith("free");
  });

  it("全屏 + 搜索回调", () => {
    const { container } = render(<IDEViewSwitcher {...baseProps} />);
    fireEvent.click(container.querySelector('[title="全屏"]')!);
    expect(baseProps.onFullscreen).toHaveBeenCalledTimes(1);

    fireEvent.click(container.querySelector('[title*="Ctrl+Shift+F"]')!);
    expect(baseProps.onSearch).toHaveBeenCalledTimes(1);
  });

  it("更多菜单: 开合 + 设置跳转 + 快捷键/关于（缺键回退显示 key）", () => {
    const { container } = render(<IDEViewSwitcher {...baseProps} />);
    expect(container.textContent).not.toContain("系统设置");

    fireEvent.click(container.querySelector('[title="更多"]')!);
    expect(container.textContent).toContain("设置");

    // ide.shortcuts / ide.about 缺键 → t() 回退返回 key 字面量
    expect(container.textContent).toContain("ide.shortcuts");
    expect(container.textContent).toContain("ide.about");

    // 点击设置 → navigate
    fireEvent.click(screen.getByText("设置"));
    expect(navigateMock).toHaveBeenCalledWith("/settings");
  });
});
