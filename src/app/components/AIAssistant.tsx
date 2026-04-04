/**
 * AIAssistant.tsx
 * =================================
 * YYC³ CloudPivot Intelli-Matrix · AI 集成控制中心
 *
 * 此文件为兼容层，实际实现已迁移至 ai-assistant/ 目录
 * 采用模块化架构：
 * - 使用 Radix UI 组件替换内联实现
 * - Hooks 抽取：useChat, useAIConfig, useFloatingPanel
 * - 组件拆分：ChatPanel, CommandsPanel, PromptsPanel, SettingsPanel
 */

export { AIAssistant } from "./ai-assistant";
export type { AIAssistantProps, AITab, ChatMessage } from "./ai-assistant";
