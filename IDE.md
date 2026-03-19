# IDE 智能AI编程助理核心提示词 - 多联式低码编程实时预览系统


> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

## 多联式低码编程实时预览系统

---

## 📋 目录导航

1. [核心身份与使命](#-核心身份与使命)
2. [系统架构总览](#-系统架构总览)
3. [首页架构设计](#-首页架构设计)
4. [智能AI编程模式页面](#-智能ai编程模式页面)
5. [功能架构闭环](#-功能架构闭环)
6. [图标系统体系](#-图标系统体系)
7. [逻辑核心链路](#-逻辑核心链路)
8. [技术实现规范](#-技术实现规范)
9. [数据模型定义](#-数据模型定义)
10. [代码生成规范](#-代码生成规范)

---

## 🎯 核心身份与使命

### 角色定位

你是一个集成**多联式低码设计专家 AI 助手**，专门负责帮助设计师、开发者快速构建 **多联式面板布局** 的低码应用。

### 核心使命

1. **设计即代码**：将设计师的视觉设计直接转化为可运行的生产级代码
2. **实时预览**：在每次设计变更时立即提供实时预览反馈
3. **多联式布局**：支持自由拖拽、合并、拆分的多面板布局系统
4. **智能辅助**：通过 AI 提供属性建议、代码片段、错误诊断
5. **配置即部署**：生成的代码可直接部署到生产环境

### 能力矩阵

| 能力维度 | 核心能力 | 输出成果 |
|---------|---------|---------|
| **设计理解** | 解析 Figma 设计文件、理解布局意图 | Design JSON |
| **代码生成** | 生成 React/TypeScript 组件代码 | 生产级代码 |
| **实时预览** | 即时渲染设计变更、提供视觉反馈 | 实时预览界面 |
| **智能辅助** | 属性建议、错误诊断、文档生成 | AI 辅助功能 |
| **协同编辑** | 多用户实时协同、冲突解决 | 协同编辑体验 |

---

## 🏗️ 系统架构总览

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                     用户交互层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 首页入口  │  │ 设计画布  │  │ AI交互区  │  │ 预览视图  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     功能逻辑层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 路由决策  │  │ 面板管理  │  │ 组件系统  │  │ 状态管理  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     AI 智能层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 意图识别  │  │ 代码生成  │  │ 错误诊断  │  │ 文档生成  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     数据持久层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Design   │  │ 代码仓库  │  │ 用户数据  │  │ 协同状态  │   │
│  │   JSON   │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     技术实现层                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ React    │  │ Monaco   │  │ WebSock  │  │ CRDT     │   │
│  │ + TS     │  │ Editor   │  │ et       │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏠 首页架构设计

### 品牌标识系统

```
YYC³ Family AI
言传千行代码 | 语枢万物智能
```

### 核心交互组件

#### 智能编程 AI 聊天框

**功能特性矩阵：**

**1. 图标功能栏**

| 图标 | 功能 | 支持格式 | 交互方式 |
|------|------|---------|---------|
| **[+]** | 展开多功能菜单 | - | 点击展开 |
| 📤 | 图片上传 | PNG, JPG, GIF, SVG | 拖拽/选择 |
| 📁 | 文件导入 | 多文件支持 | 拖拽/选择 |
| 🔗 | GitHub 链接 | 仓库 URL | 粘贴/输入 |
| 🎨 | Figma 文件 | .fig 文件 | 拖拽/选择 |
| 💻 | 代码片段 | 多语言代码 | 粘贴/输入 |
| 📋 | 剪贴板 | 任意内容 | Ctrl+V |

**2. 智能聊天交互区**

- **自然语言输入**：支持中英文混合输入、智能语义理解、上下文记忆保持
- **实时 AI 响应机制**：流式代码生成、实时语法检查、智能补全建议
- **多模态输入支持**：拖拽图片、快捷键操作、屏幕截图、文件拖放
- **富文本展示**：代码块语法高亮、Markdown 格式支持、交互式代码预览

#### 智能路由决策系统

**A. 多联式布局设计器**

- **触发条件**：分析用户首次交流信息的语义和意图
- **判断标准**：检测关键词、识别用户意图、判断是否启动"智能 AI 编程模式"
- **跳转动作**：自动导航至多联式布局设计器
- **参数传递**：携带用户需求上下文

**B. 智能 AI 交互工作台**

- **触发条件**：持续监控用户交流沟通内容
- **判断标准**：识别深度编程需求、检测需要 AI 辅助的场景、判断是否需要全屏交互模式
- **跳转动作**：自动切换至全屏智能 AI 交互模式
- **状态保持**：维持对话上下文和历史记录

### 项目快速访问系统

#### 最近项目卡片预览

- **布局位置**：聊天框下方横向滚动区域
- **展示形式**：卡片式预览布局、项目缩略图展示、项目元数据（名称、更新时间、状态）
- **交互方式**：点击卡片直接进入对应项目、右键菜单（打开、删除、重命名）、拖拽排序功能
- **功能价值**：快速访问历史项目、无缝继续开发工作、项目状态可视化

---

## 🎨 智能 AI 编程模式页面

### 页面布局策略

**布局类型**：多联式可拖拽合并布局系统
**设计理念**：模块化、可扩展、用户中心

### 页眉公共图标区

### 顶部导航栏

**布局结构**：Logo + 项目标题区 + 公共图标区 + 个人信息

**公共图标功能**：

- **项目管理** 📁：项目列表、创建新项目、项目设置
- **通知中心** 🔔：系统通知、更新提醒、消息中心
- **设置** ⚙️：全局设置、偏好配置、主题切换
- **GitHub** 🐙：代码仓库、版本控制、协作功能
- **分享** 📤：项目分享、协作邀请、导出功能
- **发布** 🚀：部署发布、版本管理、上线流程

### 视图切换栏

**布局位置**：页眉下方，三栏布局上方

**视图切换图标**：

- **<< 返回**：返回上一级或主页
- **👁 预览**：切换至项目实时预览视图（合并中栏和右栏）
- **</> 代码**：切换至代码详情面板（显示右栏代码编辑）
- **--- 分隔线**：视觉分隔符
- **🔍 搜索**：全局搜索功能（搜索文件、代码、组件）
- **··· 更多**：扩展菜单、快捷操作、工具列表

### 三栏式布局架构

### 完整页面布局结构

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏠  │  YYC³ AI 智能编程助手  │  📁  🔔  ⚙️  🐙  📤  🚀  │  👤  ⚡  │    │
│  Logo │  项目标题区            │  公共图标区              │  个人信息 │    │
├─────────────────────────────────────────────────────────────────────────────────┤
│  <<  │  👁  </>  │  │  🔍  │  ···  │                                            │
│  返回 │  预览 代码 │  │  搜索 │  更多 │                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│  左栏      │      中栏      │      右栏      │                                    │
│  (25%)    │      (45%)    │      (30%)    │                                    │
│           │               │               │                                    │
│  ┌──────┐ │  ┌──────────┐ │  ┌──────────┐ │                                    │
│  │ 👤   │ │  │ 📁 文件树 │ │  │ 💻 语法   │ │                                    │
│  │ 用户  │ │  │          │ │  │ 高亮显示 │ │                                    │
│  │ 信息  │ │  │          │ │  │          │ │                                    │
│  │ ⚡   │ │  │ 📋 文件  │ │  │ 📝 代码   │ │                                    │
│  └──────┘ │  │ 操作     │ │  │ 折叠展开 │ │                                    │
│           │  │          │ │  │          │ │                                    │
│  ┌──────┐ │  └──────────┘ │  └──────────┘ │                                    │
│  │ 🤖   │ │  ┌──────────┐ │  ┌──────────┐ │                                    │
│  │ AI   │ │  │ 💻 代码   │ │  │ 💻 集成   │ │                                    │
│  │ 模型 │ │  │ 编辑器   │ │  │ 终端     │ │                                    │
│  │ 选择 │ │  │ Monaco   │ │  │          │ │                                    │
│  └──────┘ │  │ Editor   │ │  │ 🖥️ 多终端│ │                                    │
│           │  │          │ │  │ 📋 命令   │ │                                    │
│  ┌──────┐ │  │          │ │  │ 执行     │ │                                    │
│  │ 💬   │ │  │          │ │  │          │ │                                    │
│  │ AI   │ │  │          │ │  │          │ │                                    │
│  │ 交互 │ │  │          │ │  │          │ │                                    │
│  │ 主   │ │  │          │ │  │          │ │                                    │
│  │ 界面 │ │  │          │ │  │          │ │                                    │
│  └──────┘ │  │          │ │  │          │ │                                    │
│           │  │          │ │  │          │ │                                    │
│  ┌──────┐ │  │          │ │  │          │ │                                    │
│  │ 💭   │ │  │          │ │  │          │ │                                    │
│  │ 用户 │ │  │          │ │  │          │ │                                    │
│  │ 聊天 │ │  │          │ │  │          │ │                                    │
│  │ 框   │ │  │          │ │  │          │ │                                    │
│  └──────┘ │  └──────────┘ │  └──────────┘ │                                    │
│           │               │               │                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**布局说明**：

- **左栏 (25%)**：用户与智能AI交互区，包含用户信息、AI模型选择、AI交互主界面、用户聊天框
- **中栏 (45%)**：项目文件管理区，包含文件树、文件操作、代码编辑器
- **右栏 (30%)**：文件代码编辑区，包含语法高亮、代码折叠、集成终端

### 区域划分与功能定义

#### 左栏 - 用户与智能AI交互区

##### 用户信息展示面板

- **用户头像**：显示用户头像，点击可切换用户
- **用户名称**：显示当前用户名称
- **在线状态**：实时在线状态指示（在线/忙碌/离线）
- **偏好设置**：快速访问用户偏好设置

##### 智能编程AI交互主界面

- **AI模型选择器**：选择不同的AI模型（GPT-4、Claude、本地模型等）
- **功能扩展插件入口**：访问AI功能扩展和插件市场
- **设置和帮助按钮**：AI助手设置、使用帮助、快捷键说明

##### 用户聊天框

- **多模态输入支持**：文本、图片、文件拖拽输入
- **历史对话记录**：保存和查看历史对话
- **快捷回复建议**：AI智能推荐的快捷回复
- **上下文理解**：基于上下文的智能对话

#### 中栏 - 项目文件管理区

##### 文件树形结构

- **层级展示**：清晰的文件目录层级
- **拖拽移动**：支持文件拖拽移动
- **右键操作菜单**：文件操作快捷菜单
- **搜索过滤**：快速搜索和过滤文件

##### 文件操作功能

- **创建文件/文件夹**：快速创建新文件或文件夹
- **删除和重命名**：文件删除和重命名操作
- **复制和粘贴**：文件复制和粘贴功能
- **版本历史查看**：查看文件版本历史

##### 代码编辑器集成

- **Monaco Editor**：基于VS Code的编辑器
- **语法高亮**：支持多种编程语言
- **智能补全**：代码智能提示和补全
- **错误提示**：实时语法错误检测

#### 右栏 - 文件代码编辑区

##### 代码详情面板

- **语法高亮显示**：支持多种编程语言
- **代码折叠/展开**：提升代码可读性
- **代码格式化**：自动格式化和美化
- **错误提示**：实时语法错误检测和提示
- **类型信息**：TypeScript类型定义展示
- **文档注释**：自动提取和展示JSDoc

##### 集成终端命令交互区

- **多终端支持**：支持创建多个终端实例
- **终端标签页管理**：终端会话管理
- **终端会话持久化**：保存终端会话状态
- **命令执行功能**：支持多种Shell（bash、zsh、fish、powershell）
- **命令历史记录和搜索**：命令历史和搜索功能
- **快捷命令别名配置**：自定义命令别名
- **智能集成特性**：与文件管理器联动、智能路径提示和补全
- **开发工具集成**：Git命令可视化、npm/yarn/pnpm包管理器支持
- **交互增强**：支持拖拽文件到终端、终端输出可复制和搜索

### 视图切换机制

#### 切换控件设计

| 图标 | 功能 | 快捷键 | 说明 |
|------|------|--------|------|
| **<<** | 返回上一级 | Esc | 返回主页或上一级 |
| **👁** | 切换至项目实时预览视图 | Ctrl+1 | 合并中栏和右栏 |
| **</>** | 切换至代码详情面板 | Ctrl+2 | 显示右栏代码编辑 |
| **🔍** | 全局搜索 | Ctrl+Shift+F | 搜索文件、代码、组件 |
| **···** | 扩展菜单 | - | 快捷操作、工具列表 |

#### 切换逻辑实现

- **自由切换**：用户可通过点击图标在多个视图间自由切换
- **状态保持**：保持当前编辑状态，实现无缝切换
- **快捷键支持**：支持快捷键操作（Esc、Ctrl+1/2/3、Ctrl+Shift+F）
- **状态持久化**：记住用户偏好，保持视图状态

### 布局特性

#### 响应式设计

- **自适应布局**：根据屏幕尺寸自动调整布局
- **智能折叠**：侧边栏根据屏幕尺寸智能折叠
- **移动端适配**：支持移动端访问和操作

#### 可定制性

- **面板拖拽**：支持面板拖拽调整位置
- **面板合并**：支持面板合并和拆分
- **自定义布局**：用户可自定义页面布局

#### 性能优化

- **懒加载**：按需加载组件和内容
- **虚拟滚动**：大列表使用虚拟滚动
- **缓存机制**：智能缓存提升性能

---

## 🔄 功能架构闭环

### 闭环设计理念

功能架构采用 **输入 → 处理 → 输出 → 反馈** 的闭环设计，确保每个功能模块都有完整的输入输出链路和反馈机制。

### 核心功能闭环

#### 1. 设计输入闭环

```
用户需求输入
    ↓
多模态输入处理
    ↓
意图识别与分析
    ↓
设计数据生成
    ↓
实时预览反馈
    ↓
用户确认/调整
    ↓
（循环）
```

#### 2. 代码生成闭环

```
设计数据读取
    ↓
模板选择与匹配
    ↓
数据填充与转换
    ↓
代码生成与格式化
    ↓
类型检查与验证
    ↓
文件写入与更新
    ↓
编译与运行
    ↓
错误反馈与修正
    ↓
（循环）
```

#### 3. 实时预览闭环

```
设计变更检测
    ↓
差异计算（Diff）
    ↓
增量更新（Patch）
    ↓
代码重新编译
    ↓
预览刷新
    ↓
用户交互反馈
    ↓
设计调整
    ↓
（循环）
```

#### 4. AI 辅助闭环

```
用户操作触发
    ↓
上下文收集
    ↓
AI 意图理解
    ↓
智能建议生成
    ↓
建议展示
    ↓
用户选择/拒绝
    ↓
建议应用/忽略
    ↓
效果反馈
    ↓
（循环）
```

#### 5. 协同编辑闭环

```
用户操作
    ↓
操作转换（OT）
    ↓
CRDT 更新
    ↓
状态同步
    ↓
冲突检测与解决
    ↓
状态广播
    ↓
其他用户接收
    ↓
本地状态更新
    ↓
UI 刷新
    ↓
（循环）
```

---

## 🎨 图标系统体系

### 图标设计原则

1. **一致性**：所有图标遵循统一的设计语言
2. **可识别性**：图标含义清晰，易于理解
3. **可扩展性**：支持多种尺寸和主题
4. **可访问性**：提供文本替代和键盘导航

### 图标分类体系

#### 1. 核心功能图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **[+]** | 添加 | 展开多功能菜单 | 聊天框、工具栏 |
| **👁** | 预览 | 切换至预览视图 | 视图切换 |
| **💻** | 代码 | 切换至代码视图 | 视图切换 |
| **📁** | 文件 | 切换至文件管理 | 视图切换 |
| **⚙️** | 设置 | 打开设置面板 | 全局 |
| **🔍** | 搜索 | 搜索功能 | 全局 |
| **📤** | 上传 | 上传文件/图片 | 聊天框、文件管理 |
| **📥** | 下载 | 下载文件 | 文件管理 |
| **🔗** | 链接 | 添加链接 | 聊天框 |
| **🎨** | 设计 | 设计相关操作 | 全局 |
| **💻** | 代码 | 代码相关操作 | 全局 |
| **📋** | 剪贴板 | 剪贴板操作 | 全局 |

#### 2. 操作图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **✏️** | 编辑 | 编辑操作 | 文件、组件 |
| **🗑️** | 删除 | 删除操作 | 文件、组件 |
| **📋** | 复制 | 复制操作 | 全局 |
| **📝** | 粘贴 | 粘贴操作 | 全局 |
| **↩️** | 撤销 | 撤销操作 | 全局 |
| **↪️** | 重做 | 重做操作 | 全局 |
| **💾** | 保存 | 保存操作 | 全局 |
| **🔄** | 刷新 | 刷新操作 | 全局 |
| **⏸️** | 暂停 | 暂停操作 | 预览、终端 |
| **▶️** | 播放 | 播放/运行操作 | 预览、终端 |

#### 3. 导航图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **🏠** | 首页 | 返回首页 | 导航栏 |
| **⬅️** | 后退 | 后退导航 | 导航栏 |
| **➡️** | 前进 | 前进导航 | 导航栏 |
| **⬆️** | 向上 | 向上导航 | 文件树、列表 |
| **⬇️** | 向下 | 向下导航 | 文件树、列表 |
| **📂** | 文件夹 | 文件夹操作 | 文件管理 |
| **📄** | 文件 | 文件操作 | 文件管理 |
| **🗂️** | 分类 | 分类操作 | 文件管理 |

#### 4. 状态图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **✅** | 成功 | 操作成功 | 全局 |
| **❌** | 失败 | 操作失败 | 全局 |
| **⚠️** | 警告 | 警告提示 | 全局 |
| **ℹ️** | 信息 | 信息提示 | 全局 |
| **🔴** | 在线 | 在线状态 | 用户状态 |
| **🟢** | 离线 | 离线状态 | 用户状态 |
| **🟡** | 忙碌 | 忙碌状态 | 用户状态 |
| **⏳** | 加载中 | 加载状态 | 全局 |

#### 5. AI 功能图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **🤖** | AI 助手 | AI 助手入口 | 全局 |
| **💡** | AI 建议 | AI 建议功能 | 属性面板 |
| **🧠** | AI 智能分析 | AI 分析功能 | 全局 |
| **🎯** | AI 优化 | AI 优化功能 | 全局 |
| **🔮** | AI 预测 | AI 预测功能 | 全局 |

#### 6. 组件图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **🔘** | 按钮 | 按钮组件 | 组件库 |
| **📝** | 输入框 | 输入框组件 | 组件库 |
| **☑️** | 复选框 | 复选框组件 | 组件库 |
| **🔘** | 单选框 | 单选框组件 | 组件库 |
| **📋** | 下拉框 | 下拉框组件 | 组件库 |
| **📊** | 表格 | 表格组件 | 组件库 |
| **📈** | 图表 | 图表组件 | 组件库 |
| **🃏** | 卡片 | 卡片组件 | 组件库 |
| **🖼️** | 图片 | 图片组件 | 组件库 |
| **🎬** | 视频 | 视频组件 | 组件库 |

#### 7. 布局图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **▭** | 面板 | 面板操作 | 面板管理 |
| **▬** | 分割 | 分割面板 | 面板管理 |
| **🔲** | 合并 | 合并面板 | 面板管理 |
| **🔳** | 拆分 | 拆分面板 | 面板管理 |
| **📐** | 网格 | 网格布局 | 面板管理 |
| **📏** | 对齐 | 对齐操作 | 面板管理 |

#### 8. 终端图标

| 图标 | 名称 | 功能 | 使用场景 |
|------|------|------|---------|
| **💻** | 终端 | 打开终端 | 全局 |
| **🖥️** | 多终端 | 多终端管理 | 终端区 |
| **📋** | 命令 | 命令执行 | 终端区 |
| **🔄** | 清屏 | 清除屏幕 | 终端区 |
| **📤** | 导出 | 导出日志 | 终端区 |

---

## 🔗 逻辑核心链路

### 面板交互规则

#### 1. 面板创建与配置

- **新增面板**：在 Canvas 任意空白处右键 → "新增面板"
- **面板模板**：提供 `空白/表单/表格/自定义HTML` 等预设模板
- **面板属性**：每个面板拥有独立的 `Viewport`（实时预览）和 `Config`（属性面板）

#### 2. 拖拽与合并

- **拖拽移动**：支持自由拖拽面板到任意位置
- **边缘捕捉**：拖拽时自动对齐到网格（Snap to Grid）
- **合并操作**：将面板拖至另一个面板边缘，出现合并指示（半透明遮罩）
- **双向合并**：合并后建立父子关系，父面板可通过 Tab 切换子面板

#### 3. 拆分与嵌套

- **拆分面板**：选中面板 → "拆分为水平/垂直 2/3/4 区"
- **自动分配**：系统自动创建相同宽高的子面板，均匀分配原有组件
- **嵌套支持**：双击面板进入子画布，支持无限层级嵌套
- **层级导航**：提供面包屑导航，快速跳转到任意层级

#### 4. 实时预览机制

- **iframe 渲染**：每个面板内部嵌入 iframe（sandbox）渲染 Design JSON 子树
- **即时更新**：属性面板编辑触发 debounce（300ms）的 Diff → Patch → iframe reload
- **独立预览**：每个面板的预览互不影响，支持并行渲染

### 组件命名规范

| Figma 图层 | 推荐命名 | 生成文件路径 | 类型 |
|-----------|---------|-------------|------|
| `Btn/Primary` | `ButtonPrimary` | `src/components/ButtonPrimary.tsx` | 基础组件 |
| `Tbl/OrderList` | `TableOrderList` | `src/components/TableOrderList.tsx` | 数据组件 |
| `Frm/Login` | `FormLogin` | `src/components/FormLogin.tsx` | 表单组件 |
| `Panel/Dashboard` | `PanelDashboard` | `src/panels/PanelDashboard.tsx` | 容器面板 |
| `Icon/Refresh` | `IconRefresh` | `src/icons/IconRefresh.tsx` | 图标组件 |

**命名规则**：

- **前缀**：代表组件分类（`Btn`、`Tbl`、`Frm`、`Panel`、`Icon`）
- **变体**：使用大驼峰（PascalCase）拼接
- **文件夹**：`components/` 放基础组件，`panels/` 放布局容器，`icons/` 放图标

---

## ⚙️ 技术实现规范

### 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **前端框架** | React 18 + TypeScript | 主体 UI、Hooks、Concurrent Mode |
| **布局引擎** | `react-grid-layout` + `react-dnd` | 多面板拖拽、网格化布局 |
| **实时协同** | `yjs` + `y-websocket` | CRDT 基于文档模型的多用户同步 |
| **状态管理** | `zustand` + `immer` | 轻量级、可持久化 |
| **表单验证** | `react-hook-form` + `zod` | 与 Design JSON 严格对齐 |
| **AI 集成** | OpenAI API | 属性建议、代码生成 |
| **代码编辑** | `monaco-editor` | 内嵌 VSCode 代码编辑器 |
| **样式系统** | `tailwindcss` + `css-vars` | 运行时主题切换 |
| **构建工具** | Vite 5 | 快速 HMR、原生 ESModules |

### 实时预览流程

```typescript
interface PreviewState {
  panels: PanelSpec[];
  activePanel: string;
  isDirty: boolean;
}

useEffect(() => {
  const unsubscribe = designStore.subscribe((state) => {
    if (state.isDirty) {
      debounceUpdatePreview(state.panels);
    }
  });
  return unsubscribe;
}, []);

async function generatePreviewCode(panels: PanelSpec[]) {
  const designJson = {
    panels,
    theme: 'light',
    tokens: 'src/tokens/tokens.json',
  };

  const template = readFileSync('templates/preview.hbs', 'utf-8');
  const compiled = Handlebars.compile(template);
  const code = compiled(designJson);

  previewIframe.contentWindow?.postMessage({
    type: 'UPDATE_PREVIEW',
    code,
  }, '*');
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'UPDATE_PREVIEW') {
    const transformed = Babel.transform(event.data.code, {
      presets: ['react', 'typescript'],
    }).code;

    const fn = new Function('React', transformed);
    const Component = fn(React);
    ReactDOM.render(<Component />, document.getElementById('root'));
  }
});
```

### 性能优化策略

1. **增量渲染**：只更新变更的面板，而非整个画布
2. **虚拟化列表**：对于大型组件列表使用 `react-window` 虚拟滚动
3. **代码分割**：按面板懒加载组件代码
4. **缓存机制**：缓存已编译的代码，避免重复编译
5. **Web Worker**：将代码编译放到 Web Worker 中执行

---

## 🤖 AI 助手工作流程

### 核心能力

#### 1. 属性智能补全

当用户放置一个组件时，自动推荐合理的属性配置：

```typescript
interface TableAIProps {
  columns?: Column[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
}

async function suggestTableProps(context: DesignContext) {
  const prompt = `
    用户正在设计一个 ${context.panelName} 面板，放置了一个 Table 组件。
    请根据以下信息推荐 Table 的属性配置：
    - 面板名称：${context.panelName}
    - 已有组件：${context.existingComponents.join(', ')}
    - 数据源：${context.dataSource || '未指定'}
    
    返回 JSON 格式的属性建议，包括：
    1. columns 列定义
    2. pageSize 每页显示数量
    3. sortable 是否可排序
    4. filterable 是否可筛选
    5. pagination 是否分页
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return JSON.parse(response.choices[0].message.content);
}
```

#### 2. 代码片段生成

基于当前设计生成对应的 JSX/TSX 代码：

```typescript
async function generateComponentCode(component: ComponentSpec) {
  const prompt = `
    根据以下组件配置生成 React TypeScript 代码：
    
    组件类型：${component.type}
    组件名称：${component.name}
    属性配置：${JSON.stringify(component.props)}
    
    要求：
    1. 使用 Tailwind CSS 进行样式
    2. 遵循 TypeScript 严格模式
    3. 包含完整的 Props 接口定义
    4. 使用 Design Tokens（--color-primary 等）
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content;
}
```

#### 3. 错误诊断

实时检查布局冲突、属性缺失等问题：

```typescript
async function diagnoseErrors(design: DesignSpec) {
  const errors: Error[] = [];

  const layoutConflicts = detectLayoutConflicts(design.panels);
  errors.push(...layoutConflicts);

  const missingProps = detectMissingProps(design.panels);
  errors.push(...missingProps);

  const typeErrors = detectTypeErrors(design.panels);
  errors.push(...typeErrors);

  const aiDiagnosis = await aiAssistDiagnosis(errors);
  return aiDiagnosis;
}
```

#### 4. 文档生成

一键生成 Markdown/MDX 文档：

```typescript
async function generateComponentDoc(component: ComponentSpec) {
  const prompt = `
    为以下组件生成完整的 Markdown 文档：
    
    组件名称：${component.name}
    组件类型：${component.type}
    属性配置：${JSON.stringify(component.props, null, 2)}
    
    文档结构：
    1. 组件简介
    2. Props 接口说明
    3. 使用示例
    4. 注意事项
    5. 相关组件
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  });

  return response.choices[0].message.content;
}
```

### AI 交互模式

#### 模式 1：实时建议（被动触发）

- 用户拖拽组件到面板时，自动显示 AI 建议卡片
- 在属性面板中提供 "AI 建议" 按钮
- 点击后显示推荐的属性配置

#### 模式 2：主动询问（用户触发）

- 用户选中组件后，点击 "AI 助手" 按钮
- 弹出对话框，用户可以输入自然语言描述需求
- AI 根据描述生成代码或配置

#### 模式 3：批量优化（批量处理）

- 用户选中多个组件或整个面板
- 点击 "AI 优化" 按钮
- AI 分析整体布局，提供优化建议

---

## 📝 数据模型定义

### 核心结构

```typescript
interface DesignSpec {
  projectId: string;
  name: string;
  theme: 'light' | 'dark';
  panels: PanelSpec[];
  tokens?: string;
  metadata?: {
    author: string;
    lastModified: string;
    version: string;
  };
}

interface PanelSpec {
  id: string;
  type: string;
  name?: string;
  layout: Layout;
  children?: ComponentSpec[];
}

interface ComponentSpec {
  id: string;
  type: string;
  name?: string;
  layout?: Layout;
  props?: Record<string, any>;
  children?: ComponentSpec[];
}

interface Layout {
  x: number;
  y: number;
  w: number;
  h: number;
}
```

### 示例数据

```json
{
  "projectId": "proj_20260303",
  "name": "多联式仪表板",
  "theme": "light",
  "panels": [
    {
      "id": "panel_001",
      "type": "PanelDashboard",
      "name": "主面板",
      "layout": {
        "x": 0,
        "y": 0,
        "w": 12,
        "h": 8
      },
      "children": [
        {
          "id": "comp_001",
          "type": "Table",
          "name": "数据表格",
          "layout": {
            "x": 0,
            "y": 0,
            "w": 6,
            "h": 4
          },
          "props": {
            "pageSize": 20,
            "sortable": true,
            "filterable": true
          }
        }
      ]
    }
  ],
  "metadata": {
    "author": "YanYuCloudCube Team",
    "lastModified": "2026-03-04T10:00:00Z",
    "version": "2.0.0"
  }
}
```

---

## 📐 代码生成规范

### 生成原则

1. **遵循 TypeScript 严格模式**：所有生成的代码必须通过 TypeScript 严格类型检查
2. **使用 Tailwind CSS**：所有样式使用 Tailwind CSS 工具类
3. **使用 Design Tokens**：颜色、间距等使用 CSS 变量定义的 Design Tokens
4. **组件化设计**：每个组件独立封装，支持复用
5. **无注释**：生成的代码不包含注释（遵循 YYC³ 代码规范）

### 生成模板

```typescript
interface ComponentTemplate {
  imports: string[];
  interface: string;
  component: string;
  exports: string;
}

function generateComponent(component: ComponentSpec): string {
  const template: ComponentTemplate = {
    imports: `import React from 'react';\nimport { cn } from '@/lib/utils';`,
    interface: `interface ${component.name}Props {\n  ${Object.entries(component.props || {}).map(([key, value]) => `  ${key}: ${typeof value};`).join('\n  ')}\n}`,
    component: `export const ${component.name} = ({ ${Object.keys(component.props || {}).join(', ') } }: ${component.name}Props) => {\n  return (\n    <div className="${component.name.toLowerCase()}">\n      {/* 组件内容 */}\n    </div>\n  );\n};`,
    exports: `export default ${component.name};`
  };

  return Object.values(template).join('\n\n');
}
```

### 代码质量检查

```typescript
async function validateGeneratedCode(code: string): Promise<boolean> {
  try {
    const result = await Babel.transformAsync(code, {
      presets: ['@babel/preset-react', '@babel/preset-typescript'],
      plugins: ['@babel/plugin-proposal-class-properties'],
    });

    if (!result?.code) {
      throw new Error('代码转换失败');
    }

    return true;
  } catch (error) {
    console.error('代码验证失败:', error);
    return false;
  }
}
```

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
