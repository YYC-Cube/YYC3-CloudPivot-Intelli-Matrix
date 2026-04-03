/**
 * FamilyStore.ts
 * ==============
 * AI Family 统一状态管理
 * 使用 Zustand + persist 实现状态持久化
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FamilyMember } from '../shared';

// ═══ 重新导出类型 ═══
export type { FamilyMember } from '../shared';

// ═══ 数据类型定义 ═══

export interface FamilyActivity {
  id: string;
  type: 'game' | 'learning' | 'music' | 'chat' | 'achievement';
  memberId: string;
  memberName: string;
  memberColor: string;
  title: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface FamilyMessage {
  id: string;
  fromMemberId: string;
  toMemberId?: string;
  channelId: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: 'text' | 'image' | 'voice' | 'file';
}

export interface FamilySettings {
  theme: 'dark' | 'light';
  language: 'zh-CN' | 'en-US';
  notifications: boolean;
  soundEnabled: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface LearningCourse {
  id: string;
  title: string;
  description: string;
  color: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  skill: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export interface GrowthRecord {
  id: string;
  memberId: string;
  date: string;
  contribution: number;
  mood: string;
  activities: number;
}

export interface FamilyState {
  // 成员状态
  members: FamilyMember[];
  updateMemberStatus: (id: string, status: FamilyMember['status']) => void;
  updateMemberMood: (id: string, mood: string) => void;
  updateMemberContribution: (id: string, contribution: number) => void;
  updateMemberGrowth: (id: string, growth: number) => void;

  // 活动数据
  activities: FamilyActivity[];
  addActivity: (activity: FamilyActivity) => void;
  removeActivity: (id: string) => void;
  clearActivities: () => void;

  // 消息数据
  messages: FamilyMessage[];
  addMessage: (message: FamilyMessage) => void;
  markMessageAsRead: (id: string) => void;
  markAllMessagesAsRead: () => void;
  clearMessages: () => void;

  // 学习进度
  learningProgress: Record<string, number>;
  updateProgress: (courseId: string, progress: number) => void;
  resetProgress: (courseId: string) => void;

  // 系统设置
  settings: FamilySettings;
  updateSettings: (settings: Partial<FamilySettings>) => void;

  // 同步状态
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  lastSyncTime: number | null;
  setLastSyncTime: (time: number | null) => void;
}

// ═══ 初始状态 ═══

const initialSettings: FamilySettings = {
  theme: 'dark',
  language: 'zh-CN',
  notifications: true,
  soundEnabled: true,
  autoSync: true,
  syncInterval: 5 * 60 * 1000, // 5 分钟
};

// ═══ 创建 Store ═══

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set, _get) => ({
      // 初始成员数据（从 shared.ts 导入）
      members: [],

      // 成员操作
      updateMemberStatus: (id, status) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, status } : m
          ),
        })),

      updateMemberMood: (id, mood) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, mood } : m
          ),
        })),

      updateMemberContribution: (id, contribution) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, contribution } : m
          ),
        })),

      updateMemberGrowth: (id, growth) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === id ? { ...m, growth } : m
          ),
        })),

      // 初始活动数据
      activities: [],

      // 活动操作
      addActivity: (activity) =>
        set((state) => ({
          activities: [activity, ...state.activities],
        })),

      removeActivity: (id) =>
        set((state) => ({
          activities: state.activities.filter((a) => a.id !== id),
        })),

      clearActivities: () =>
        set({ activities: [] }),

      // 初始消息数据
      messages: [],

      // 消息操作
      addMessage: (message) =>
        set((state) => ({
          messages: [message, ...state.messages],
        })),

      markMessageAsRead: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, read: true } : m
          ),
        })),

      markAllMessagesAsRead: () =>
        set((state) => ({
          messages: state.messages.map((m) => ({ ...m, read: true })),
        })),

      clearMessages: () =>
        set({ messages: [] }),

      // 初始学习进度
      learningProgress: {},

      // 学习进度操作
      updateProgress: (courseId, progress) =>
        set((state) => ({
          learningProgress: {
            ...state.learningProgress,
            [courseId]: progress,
          },
        })),

      resetProgress: (courseId) =>
        set((state) => {
          const newProgress = { ...state.learningProgress };
          delete newProgress[courseId];
          return { learningProgress: newProgress };
        }),

      // 初始设置
      settings: initialSettings,

      // 设置操作
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // 初始同步状态
      isSyncing: false,
      lastSyncTime: null,

      // 同步操作
      setIsSyncing: (syncing) =>
        set({ isSyncing: syncing }),

      setLastSyncTime: (time) =>
        set({ lastSyncTime: time }),
    }),
    {
      name: 'yyc3-family-storage',
      version: 1,
      // 只持久化必要的数据，减少存储空间
      partialize: (state) => ({
        members: state.members,
        activities: state.activities,
        messages: state.messages,
        learningProgress: state.learningProgress,
        settings: state.settings,
      }),
    }
  )
);

// ═══ 辅助函数 ═══

/**
 * 获取在线成员
 */
export function getOnlineMembers(): FamilyMember[] {
  return useFamilyStore.getState().members.filter(m => m.status !== 'idle');
}

/**
 * 获取未读消息数量
 */
export function getUnreadMessageCount(): number {
  return useFamilyStore.getState().messages.filter(m => !m.read).length;
}

/**
 * 获取最近活动
 */
export function getRecentActivities(limit: number = 10): FamilyActivity[] {
  return useFamilyStore.getState().activities.slice(0, limit);
}

/**
 * 获取成员
 */
export function getMember(id: string): FamilyMember | undefined {
  return useFamilyStore.getState().members.find(m => m.id === id);
}

/**
 * 计算总贡献度
 */
export function getTotalContribution(): number {
  return useFamilyStore.getState().members.reduce((sum, m) => sum + m.contribution, 0);
}

/**
 * 计算平均成长值
 */
export function getAverageGrowth(): number {
  const members = useFamilyStore.getState().members;
  if (members.length === 0) { return 0; }
  const total = members.reduce((sum, m) => sum + m.growth, 0);
  return Math.round(total / members.length);
}
