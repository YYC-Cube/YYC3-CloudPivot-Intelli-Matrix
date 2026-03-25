# A-ide/IDE 组件目录

## 📋 概述

本目录包含 IDE（集成开发环境）界面的核心组件，实现了多联式可调面板系统。基于 `react-resizable-panels v2.1.0` 构建，支持灵活的面板布局和拖拽交互。

## 🏗️ 组件架构

### 核心布局组件

#### `IDELayout.tsx`
**主布局组件** - IDE 的根布局容器

**功能特性：**
- 三栏布局系统（左栏 25% / 中栏 45% / 右栏 30%）
- 支持三种布局模式：
  - `edit`（编辑模式）：终端仅在右栏显示
  - `preview`（预览模式）：终端跨越中栏+右栏
  - `free`（自由模式）：完全自定义拖拽面板
- 底部集成终端（智能切换位置）
- 响应式面板调整

**依赖：**
```typescript
import { Panel, Group, Separator } from "react-resizable-panels";
```

**关键 API：**
- `<Group direction="horizontal">` - 水平面板组
- `<Panel defaultSize={25} minSize={15} maxSize={40}>` - 可调面板
- `<Separator />` - 拖拽分隔条

---

### 面板组件

#### `AIChatPanel.tsx`
**AI 对话面板** - AI 编程助手交互界面

**功能：**
- 多轮对话历史管理
- AI 模型选择器（GLM-4 Flash, GPT-4o, LLaMA-3 8B, DeepSeek-V3, Qwen-72B）
- 代码生成与错误诊断
- 消息时间戳显示

**数据来源：**
```typescript
import { MOCK_CHAT_HISTORY, AI_MODELS } from "./ide-mock-data";
```

---

#### `FileExplorer.tsx`
**文件资源管理器** - 项目文件树导航

**功能：**
- 递归文件树展示
- 文件类型图标与语言标签
- 文件大小与修改时间
- 文件夹折叠/展开
- 文件内容预览

**数据来源：**
```typescript
import { MOCK_FILE_TREE, MOCK_FILE_CONTENTS } from "./ide-mock-data";
```

---

#### `CodePreviewPanel.tsx`
**代码预览面板** - 多语言代码编辑器

**功能：**
- CodeMirror 集成
- 支持 TSX/TypeScript/JSX/JavaScript/CSS/JSON/Python/SQL/XML/YAML/Markdown
- 语法高亮
- 行号显示
- 代码格式化

**依赖：**
```typescript
import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@codemirror/lang-*";
```

---

#### `GitPanel.tsx`
**Git 版本控制面板** - Git 操作与状态查看

**功能：**
- 分支切换与查看
- 未暂存变更列表
- 提交历史记录
- 快速 Git 命令执行

**数据来源：**
```typescript
import {
  MOCK_GIT_BRANCHES,
  MOCK_GIT_CHANGES,
  MOCK_GIT_COMMITS,
} from "./ide-mock-data";
```

---

### UI 组件

#### `IDETopBar.tsx`
**IDE 顶部工具栏** - 导航与操作按钮

**功能：**
- 面板模式切换（编辑/预览/自由）
- AI 模型选择器
- 文件操作（保存/重命名/删除）
- 布局重置按钮
- 快捷键提示

---

#### `IDEViewSwitcher.tsx`
**视图切换器** - 布局模式选择

**支持模式：**
- 📝 Edit（编辑模式）
- 👁️ Preview（预览模式）
- 🎨 Free（自由模式）

---

#### `IDETerminal.tsx`
**集成终端** - 命令行交互界面

**功能：**
- 模拟终端输出
- 支持 Git 命令显示
- 命令历史记录
- 带颜色高亮的输出

**Mock 数据：**
```typescript
const mockCommands = [
  "git status",
  "git add .",
  "git commit -m 'feat: update'",
  "npm run dev"
];
```

---

#### `IDEStatusBar.tsx`
**IDE 状态栏** - 底部信息显示

**功能：**
- 当前文件路径
- 光标位置（行/列）
- Git 分支信息
- 文件编码
- 服务器连接状态

---

## 📦 数据结构

### `ide-types.ts`
**IDE 类型定义**

```typescript
export type IDEViewMode = "edit" | "preview" | "free";
export type IDELayoutMode = "horizontal" | "vertical";

export interface OpenTab {
  id: string;
  name: string;
  language: string;
  content: string;
  modified: boolean;
}

export interface ChatMessage {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  lastCommit: string;
  behind: number;
  ahead: number;
}

// ... 更多类型定义
```

---

### `ide-layout-types.ts`
**面板布局类型定义**

```typescript
export type PanelType = "ai" | "files" | "editor" | "terminal" | "git";

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isResizable: boolean;
  isClosable: boolean;
}

// ... 更多布局相关类型
```

---

### `ide-mock-data.ts`
**Mock 数据源**

提供完整的 IDE 演示数据：
- `MOCK_FILE_TREE` - 完整的项目文件树
- `MOCK_FILE_CONTENTS` - 各文件的真实代码内容
- `MOCK_CHAT_HISTORY` - AI 对话历史
- `MOCK_GIT_BRANCHES` - Git 分支列表
- `MOCK_GIT_CHANGES` - 文件变更记录
- `MOCK_GIT_COMMITS` - 提交历史
- `AI_MODELS` - AI 模型列表
- `MOCK_RECENT_PROJECTS` - 最近项目

---

## 🎯 技术栈

### 核心依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| `react` | ^19.2.4 | UI 框架 |
| `react-resizable-panels` | **2.1.0** | 面板拖拽与调整（⚠️ 锁定版本） |
| `react-router` | ^7.13.1 | 路由管理 |
| `@uiw/react-codemirror` | ^4.25.8 | 代码编辑器 |
| `@codemirror/lang-*` | ^6.x.x | CodeMirror 语言支持 |
| `lucide-react` | ^0.576.0 | 图标库 |

### 样式方案
- Tailwind CSS v4.2.1
- 自定义 CSS 变量（赛博朋克主题）

---

## ⚠️ 重要说明

### 版本锁定原因

`react-resizable-panels` 版本锁定在 **2.1.0**，原因如下：

1. **API 兼容性**：
   - v2.1.0: `Panel`, `Group`, `Separator` 直接导出
   - v4.7.0: 命名空间导出 `R.Panel`, `R.Group`, `R.Separator`

2. **代码一致性**：
   - 整个项目统一使用 v2.1.0 API
   - 避免因版本差异导致的 TypeScript 错误

3. **降级命令**（如需重置）：
   ```bash
   pnpm install react-resizable-panels@2.1.0
   ```

### React 19 兼容性警告

```
✕ unmet peer react@"^16.14.0 || ^17.0.0 || ^18.0.0": found 19.2.4
```

**说明：** react-resizable-panels 2.1.0 官方支持 React 16-18，但在 React 19 中依然可以正常工作（向后兼容）。实际使用中未发现问题。

---

## 🔄 组件依赖关系

```
IDELayout.tsx (根容器)
├── IDETopBar.tsx
├── IDEViewSwitcher.tsx
├── AIChatPanel.tsx
│   └── ide-mock-data.ts (AI_MODELS, MOCK_CHAT_HISTORY)
├── FileExplorer.tsx
│   └── ide-mock-data.ts (MOCK_FILE_TREE, MOCK_FILE_CONTENTS)
├── CodePreviewPanel.tsx
│   └── @codemirror/lang-*
├── GitPanel.tsx
│   └── ide-mock-data.ts (MOCK_GIT_*)
├── IDETerminal.tsx
└── IDEStatusBar.tsx
```

---

## 🚀 使用示例

### 基础用法

```tsx
import { IDELayout } from "./ide/IDELayout";

function App() {
  return <IDELayout defaultMode="edit" />;
}
```

### 切换布局模式

```tsx
import { useLayoutContext } from "./LayoutContext";

function MyComponent() {
  const { setLayoutMode } = useLayoutContext();

  return (
    <button onClick={() => setLayoutMode("free")}>
      切换到自由模式
    </button>
  );
}
```

---

## 📝 维护指南

### 添加新面板

1. 在 `ide-layout-types.ts` 中定义面板类型
2. 在 `ide-mock-data.ts` 中添加 Mock 数据
3. 创建新面板组件（如 `MyPanel.tsx`）
4. 在 `IDELayout.tsx` 中集成新面板

### 修改面板尺寸

在 `IDELayout.tsx` 中调整 `defaultSize` / `minSize` / `maxSize`：

```tsx
<Panel defaultSize={30} minSize={20} maxSize={50}>
  {/* 面板内容 */}
</Panel>
```

---

## 📚 相关文档

- [react-resizable-panels v2.1.0 文档](https://github.com/bvaughn/react-resizable-panels/tree/v2.1.0)
- [CodeMirror 文档](https://codemirror.net/)
- [React Router 文档](https://reactrouter.com/)

---

**最后更新：** 2026-03-24
**维护者：** YanYuCloudCube Team
**版本：** v1.0.0
