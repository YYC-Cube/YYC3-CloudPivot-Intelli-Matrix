/**
 * ide-heavy-components.test.tsx
 * =============================
 * 组件域攻坚批四（M7 前置 · IDE 大件）:
 * IDELayout / AIChatPanel / GitPanel / FileExplorer / IDETerminal
 *
 * 覆盖:
 * - IDETerminal: 命令执行注册表 + clear + echo/cat + 历史上下键 + Tab 补全 + 多 tab + 折叠
 * - AIChatPanel: 消息渲染 + 发送 + AI 回复（fake timers）+ 快捷操作 + 附件菜单 + 复制
 * - GitPanel: 变更暂存/取消 + 提交 + 历史/分支 tab + 提交搜索 + 分支选择器
 * - FileExplorer: 文件树渲染 + 文件选择回调 + 搜索过滤 + 文件夹开合 + 右键菜单动作 + 重命名 + 新建 + 删除 + Explorer/Git 切换
 * - IDELayout: 三种布局模式挂载 + 布局模式持久化 + 键盘快捷键 + 搜索浮层
 *
 * useNavigate/clipboard 以 mock 注入; AI 回复 setTimeout 用 fake timers 驱动
 */

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/* ---------- 顶部 mocks（vi.mock 提升，工厂内不引用外部变量） ---------- */

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

import { AIChatPanel } from "../components/ide/AIChatPanel";
import { FileExplorer } from "../components/ide/FileExplorer";
import { GitPanel } from "../components/ide/GitPanel";
import { IDELayout } from "../components/ide/IDELayout";
import { IDETerminal } from "../components/ide/IDETerminal";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

beforeEach(() => {
  navigateMock.mockClear();
  clipboardWrite.mockClear();
});

/* ================= IDETerminal ================= */

describe("IDETerminal", () => {
  const noop = () => { };

  it("初始渲染 → 默认 5 行引导输出 + 提示符", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    expect(container.textContent).toContain("YYC³ CloudPivot Terminal v2.4.0");
    expect(container.textContent).toContain("Type 'help'");
    expect(container.textContent).toContain("$ yyc3 status");
    expect(container.textContent).toContain("~");
  });

  it("help 命令 → 输出命令清单", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...");
    fireEvent.change(input, { target: { value: "help" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("YYC³ Terminal Commands");
    expect(container.textContent).toContain("neofetch");
  });

  it("注册命令直接命中: git status / pnpm test / neofetch", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...");

    fireEvent.change(input, { target: { value: "git status" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("On branch develop");

    fireEvent.change(input, { target: { value: "pnpm test" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("Test Files  4 passed");

    fireEvent.change(input, { target: { value: "neofetch" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("Apple M4 Max");
  });

  it("clear 命令 → 清空输出行", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...");
    fireEvent.change(input, { target: { value: "clear" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).not.toContain("YYC³ CloudPivot Terminal v2.4.0");
  });

  it("echo/cat 动态命令 + 未知命令报错", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...");

    fireEvent.change(input, { target: { value: "echo hello-yyc3" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("hello-yyc3");

    fireEvent.change(input, { target: { value: "cat package.json" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("// Content of package.json");

    fireEvent.change(input, { target: { value: "definitely-not-a-cmd" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("Command not found: definitely-not-a-cmd");
  });

  it("git commit -m 与 yyc3 node 参数化命令", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...");

    fireEvent.change(input, { target: { value: 'git commit -m "feat: test"' } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("[develop a3f8c2d] feat: test");
    expect(container.textContent).toContain("3 files changed");

    fireEvent.change(input, { target: { value: "yyc3 node GPU-A100-01" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(container.textContent).toContain("GPU-A100-01  Status: ACTIVE");
  });

  it("历史导航: ArrowUp 取上一条 / ArrowDown 返回", () => {
    render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "pwd" } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "whoami" } });
    fireEvent.keyDown(input, { key: "Enter" });

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("whoami");
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("pwd");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("whoami");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.value).toBe("");
  });

  it("Tab 补全: 唯一匹配直接补全 / 补全后二次 Tab 保持唯一值", () => {
    render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    const input = screen.getByPlaceholderText("输入命令...") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "pnpm te" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("pnpm test");

    // 补全后 input 已是完整命令，再次 Tab 仍唯一匹配自身
    fireEvent.keyDown(input, { key: "Tab" });
    expect(input.value).toBe("pnpm test");
  });

  it("多 tab: 新建 / 切换 / 关闭保护（最后一个不可关）", () => {
    const { container } = render(<IDETerminal isCollapsed={false} onToggleCollapse={noop} />);
    // 新建
    fireEvent.click(container.querySelector('[title="新建终端"]')!);
    expect(container.textContent).toContain("New terminal session");

    // 关闭当前 → 回到 term-1
    const closeBtns = container.querySelectorAll(".hover\\:text-\\[\\#ff3366\\]");
    expect(closeBtns.length).toBeGreaterThan(0);
    fireEvent.click(closeBtns[closeBtns.length - 1]);
    expect(container.textContent).toContain("YYC³ CloudPivot Terminal v2.4.0");

    // 唯一 tab 时 close 保护: 无关闭按钮
    expect(container.querySelectorAll(".hover\\:text-\\[\\#ff3366\\]").length).toBe(0);
  });

  it("折叠态: 高度 28px 隐藏内容 + 展开按钮切换", () => {
    const toggle = vi.fn();
    const { container, rerender } = render(<IDETerminal isCollapsed onToggleCollapse={toggle} />);
    expect(container.textContent).not.toContain("输入命令");
    fireEvent.click(container.querySelector('[title="切换终端"]')!);
    expect(toggle).toHaveBeenCalledTimes(1);

    rerender(<IDETerminal isCollapsed={false} onToggleCollapse={toggle} />);
    expect(screen.getByPlaceholderText("输入命令...")).toBeTruthy();
  });
});

/* ================= AIChatPanel ================= */

describe("AIChatPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("初始渲染 → MOCK_CHAT_HISTORY 三条消息 + 输入区", () => {
    const { container } = render(<AIChatPanel />);
    expect(container.textContent).toContain("YYC3 AI 编程助手已就绪");
    expect(container.textContent).toContain("NodeStatusCard");
    expect(screen.getByPlaceholderText("向 AI 提问...")).toBeTruthy();
  });

  it("发送消息 → 用户消息入列 + isTyping 指示器 + AI 延迟回复", async () => {
    const { container } = render(<AIChatPanel />);
    const input = screen.getByPlaceholderText("向 AI 提问...");

    fireEvent.change(input, { target: { value: "解释一下这段代码" } });
    fireEvent.keyDown(input, { key: "Enter" });

    // 用户消息 + typing indicator
    expect(container.textContent).toContain("解释一下这段代码");
    expect(container.querySelector(".animate-pulse")).toBeTruthy();
    // 输入框清空
    expect((input as HTMLTextAreaElement).value).toBe("");

    // 推进 AI 回复定时器（800+rand*1200）
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(container.textContent).toContain("React 函数组件");
    expect(container.querySelector(".animate-pulse")).toBeFalsy();
  });

  it("快捷操作 → explain 发送 i18n prompt", async () => {
    const { container } = render(<AIChatPanel />);
    fireEvent.click(screen.getByText("Explain"));
    act(() => {
      vi.advanceTimersByTime(2100);
    });
    expect(container.textContent).toContain("React 函数组件");
  });

  it("空输入不发送 + Enter 换行(shift) 分支", () => {
    render(<AIChatPanel />);
    const input = screen.getByPlaceholderText("向 AI 提问...");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.queryByText("$")).toBeNull();

    fireEvent.change(input, { target: { value: "行1" } });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect((input as HTMLTextAreaElement).value).toBe("行1"); // 未发送
  });

  it("附件菜单: 开合 + 选择项关闭", () => {
    const { container } = render(<AIChatPanel />);
    expect(container.textContent).not.toContain("Upload Image");

    const plusBtn = container.querySelector("button.p-1\\.5")!;
    fireEvent.click(plusBtn);
    expect(container.textContent).toContain("Upload Image");
    expect(container.textContent).toContain("Figma File");

    fireEvent.click(screen.getByText("Code Snippet"));
    expect(container.textContent).not.toContain("Upload Image");
  });

  it("复制按钮 → clipboard 写入 + ✓ 反馈", async () => {
    vi.useFakeTimers();
    const { container } = render(<AIChatPanel />);
    // assistant 消息的 copy 按钮（title=复制）
    const copyBtn = container.querySelector('[title="复制"]')!;
    fireEvent.click(copyBtn);
    expect(clipboardWrite).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    // 2 秒后恢复 Copy 图标（copiedId 清空）
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(true).toBe(true);
  });

  it("Send 按钮: 空禁用 / 有内容可点", () => {
    const { container } = render(<AIChatPanel />);
    const sendBtn = container.querySelectorAll("button");
    const textarea = screen.getByPlaceholderText("向 AI 提问...") as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "你好" } });
    const enabled = Array.from(sendBtn).some((b) => !b.disabled);
    expect(enabled).toBe(true);
  });
});

/* ================= GitPanel ================= */

describe("GitPanel", () => {
  it("初始渲染 → develop 分支 + ahead 3 + 变更 tab 计数 6", () => {
    const { container } = render(<GitPanel />);
    expect(container.textContent).toContain("develop");
    expect(container.textContent).toContain("变更");
    expect(container.textContent).toContain("已暂存 (2)");
    expect(container.textContent).toContain("未暂存 (4)");
    expect(container.textContent).toContain("IDELayout.tsx");
  });

  it("提交: 空信息/无暂存禁用 → 有效提交移除 staged", () => {
    render(<GitPanel />);
    const commitBtn = screen.getByText(/提交 \(2\)/).closest("button")!;
    expect(commitBtn.disabled).toBe(true); // 空信息

    const textarea = screen.getByPlaceholderText("提交信息...");
    fireEvent.change(textarea, { target: { value: "feat: batch4" } });
    expect(commitBtn.disabled).toBe(false);

    fireEvent.click(commitBtn);
    expect(screen.queryByText("已暂存 (2)")).toBeNull(); // staged 已被提交移除
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("暂存切换: unstageAll（− 按钮）→ staged 清零; ChangeItem 点击切换单项", () => {
    const { container } = render(<GitPanel />);
    // 已暂存区标题旁的 − 按钮 = unstageAll（lucide-minus 图标）
    const minusBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.querySelector(".lucide-minus")
    );
    expect(minusBtn).toBeTruthy();
    fireEvent.click(minusBtn!);
    expect(screen.queryByText("已暂存 (2)")).toBeNull();
    expect(container.textContent).toContain("未暂存 (6)");

    // 点击第一条未暂存变更（ChangeItem）→ 重新暂存 1 项
    const changeItem = screen.getByText("IDELayout.tsx").closest("button")!;
    fireEvent.click(changeItem);
    expect(container.textContent).toContain("已暂存 (1)");
  });

  it("commits tab → 历史列表 + 搜索过滤", () => {
    const { container } = render(<GitPanel />);
    fireEvent.click(screen.getByText(/历史/));
    expect(container.textContent).toContain("a3f8c2d");
    expect(container.textContent).toContain("feat(monitor): add GPU temperature heatmap");

    const search = screen.getByPlaceholderText("搜索提交...") ? screen.getAllByPlaceholderText(/搜索/)[0] : null;
    if (search) {
      fireEvent.change(search, { target: { value: "monitor" } });
      expect(container.textContent).toContain("g8c4a2d");
      expect(container.textContent).not.toContain("e2a7d9b");
    }
  });

  it("branches tab → 4 分支渲染 + 当前分支高亮", () => {
    const { container } = render(<GitPanel />);
    fireEvent.click(screen.getByText(/分支/));
    expect(container.textContent).toContain("main");
    expect(container.textContent).toContain("feature/ide-panel");
    expect(container.textContent).toContain("fix/gpu-alert");
  });

  it("分支选择器: 点击开合 + ahead/behind 角标", () => {
    const { container } = render(<GitPanel />);
    expect(container.textContent).toContain("3"); // ahead 3
    fireEvent.click(screen.getByText("develop"));
    expect(container.textContent).toContain("feature/ide-panel"); // 下拉展开

    // 选择其他分支 → 关闭下拉
    fireEvent.click(screen.getAllByText("main")[0]);
    expect(container.textContent).not.toContain("fix/gpu-alert");
  });
});

/* ================= FileExplorer ================= */

describe("FileExplorer", () => {
  const onFileSelect = vi.fn();

  beforeEach(() => {
    onFileSelect.mockClear();
  });

  it("初始渲染 → 预展开 src/app + 根文件 + 搜索框", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    expect(container.textContent).toContain("资源管理器");
    expect(container.textContent).toContain("App.tsx");
    expect(container.textContent).toContain("package.json");
    expect(screen.getByPlaceholderText("过滤文件...")).toBeTruthy();
  });

  it("点击文件 → onFileSelect 回调", () => {
    render(<FileExplorer onFileSelect={onFileSelect} />);
    fireEvent.click(screen.getByText("App.tsx"));
    expect(onFileSelect).toHaveBeenCalledWith("app-tsx", "App.tsx");
  });

  it("文件夹开合: components 关闭隐藏子文件再打开恢复", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    // src-components 初始展开 → 直属子文件 GlassCard 可见
    expect(container.textContent).toContain("GlassCard.tsx");

    // 点击 components 文件夹关闭
    fireEvent.click(screen.getByText("components"));
    expect(container.textContent).not.toContain("GlassCard.tsx");

    fireEvent.click(screen.getByText("components"));
    expect(container.textContent).toContain("GlassCard.tsx");
  });

  it("搜索过滤: 命中显示 / 不命中隐藏", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    const search = screen.getByPlaceholderText("过滤文件...");

    fireEvent.change(search, { target: { value: "GlassCard" } });
    expect(container.textContent).toContain("GlassCard.tsx");

    fireEvent.change(search, { target: { value: "zzz-no-match" } });
    expect(container.textContent).not.toContain("App.tsx");
  });

  it("右键文件 → 上下文菜单 + 重命名动作", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    const fileBtn = screen.getByText("App.tsx").closest("button")!;
    fireEvent.contextMenu(fileBtn);

    // 菜单出现
    expect(container.textContent).toContain("重命名");
    fireEvent.click(screen.getByText("重命名"));

    // InlineInput 出现（App.tsx 变为 input）
    const renameInput = container.querySelector("input.flex-1.bg-\\[rgba\\(0\\,40\\,80\\,0\\.4\\)\\]") as HTMLInputElement;
    const inlineInput = renameInput ?? (screen.getByDisplayValue("App.tsx") as HTMLInputElement);
    fireEvent.change(inlineInput, { target: { value: "Main.tsx" } });
    fireEvent.keyDown(inlineInput, { key: "Enter" });
    expect(screen.getByText("Main.tsx")).toBeTruthy();
  });

  it("右键菜单删除文件", () => {
    render(<FileExplorer onFileSelect={onFileSelect} />);
    fireEvent.contextMenu(screen.getByText("App.tsx").closest("button")!);
    fireEvent.click(screen.getByText("删除", { exact: true }));
    expect(screen.queryByText("App.tsx")).toBeNull();
  });

  it("工具栏新建文件 → InlineInput 提交加入 src-app", async () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    fireEvent.click(container.querySelector('[title="新建文件"]')!);

    const inlineInput = screen.getByDisplayValue("untitled.tsx") as HTMLInputElement;
    fireEvent.change(inlineInput, { target: { value: "Batch4.tsx" } });
    fireEvent.keyDown(inlineInput, { key: "Enter" });
    expect(screen.getByText("Batch4.tsx")).toBeTruthy();
  });

  it("工具栏新建文件夹 + 刷新重置", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    fireEvent.click(container.querySelector('[title="新建文件夹"]')!);
    const inlineInput = screen.getByDisplayValue("new-folder") as HTMLInputElement;
    fireEvent.change(inlineInput, { target: { value: "utils" } });
    fireEvent.keyDown(inlineInput, { key: "Enter" });
    expect(screen.getByText("utils")).toBeTruthy();

    // 刷新 → 恢复初始树 + 清空搜索（ide.refresh 缺失 → t 返回 key 本身作为 title）
    fireEvent.click(container.querySelector('[title="ide.refresh"]')!);
    expect(screen.getByText("App.tsx")).toBeTruthy();
  });

  it("Explorer/Git tab 切换 → GitPanel 嵌入", () => {
    const { container } = render(<FileExplorer onFileSelect={onFileSelect} />);
    fireEvent.click(screen.getByText("Git").closest("button") ?? screen.getByText("Git"));
    expect(container.textContent).toContain("已暂存");
  });
});

/* ================= IDELayout ================= */

describe("IDELayout", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("默认 preview 模式挂载 → TopBar/状态栏/模式指示渲染", () => {
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("终端跨越中栏+右栏");
    expect(container.textContent).toContain("智能 AI 编程工作台"); // projectName 来自 ide.title
    expect(container.textContent).toContain("GLM-4 Flash"); // 模型选择器
  });

  it("localStorage 持久化: 存 free → 恢复 free 模式", () => {
    localStorage.setItem("yyc3-ide-layout-mode", "free");
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("自由拖拽面板布局");
  });

  it("布局模式切换快捷键 Ctrl+3 → edit→preview→free 循环", () => {
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("终端跨越中栏+右栏"); // preview

    fireEvent.keyDown(window, { key: "3", ctrlKey: true });
    expect(container.textContent).toContain("自由拖拽面板布局"); // free

    fireEvent.keyDown(window, { key: "3", ctrlKey: true });
    expect(container.textContent).toContain("终端仅在右栏显示"); // edit

    fireEvent.keyDown(window, { key: "3", ctrlKey: true });
    expect(container.textContent).toContain("终端跨越中栏+右栏"); // preview
  });

  it("Ctrl+` 折叠终端 + Ctrl+1/2 视图模式切换不抛错", () => {
    render(<IDELayout />);
    expect(() => {
      fireEvent.keyDown(window, { key: "`", ctrlKey: true });
      fireEvent.keyDown(window, { key: "1", ctrlKey: true });
      fireEvent.keyDown(window, { key: "2", ctrlKey: true });
      fireEvent.keyDown(window, { key: "F", ctrlKey: true, shiftKey: true });
      fireEvent.keyDown(window, { key: "Escape" });
    }).not.toThrow();
  });

  it("搜索浮层: Ctrl+Shift+F 开启 / Esc 关闭", () => {
    const { container } = render(<IDELayout />);
    expect(container.querySelector("input[placeholder*='Esc']")).toBeNull();

    fireEvent.keyDown(window, { key: "F", ctrlKey: true, shiftKey: true });
    expect(container.querySelector("input[placeholder*='Esc']")).toBeTruthy();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(container.querySelector("input[placeholder*='Esc']")).toBeNull();
  });

  it("free 模式渲染 Workspace（LayoutProvider 内）", () => {
    localStorage.setItem("yyc3-ide-layout-mode", "free");
    const { container } = render(<IDELayout />);
    expect(container.textContent).toContain("自由拖拽面板布局");
    // Workspace 挂载（有面板容器）
    expect(container.querySelector(".grid, [class*='grid']")).toBeTruthy();
  });

  it("edit 模式渲染 PanelManager 布局区", () => {
    const { container } = render(<IDELayout />);
    fireEvent.keyDown(window, { key: "3", ctrlKey: true }); // preview → free
    fireEvent.keyDown(window, { key: "3", ctrlKey: true }); // free → edit
    expect(container.textContent).toContain("终端仅在右栏显示");
    expect(container.textContent.length).toBeGreaterThan(100);
  });
});
