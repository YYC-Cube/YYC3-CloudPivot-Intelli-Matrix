/**
 * FamilyContext.tsx
 * ================
 * AI Family 统一上下文
 * 提供便捷的数据访问方法和业务逻辑
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useFamilyStore } from './store/FamilyStore';
import type { FamilyActivity, FamilyMessage } from './store/FamilyStore';
import type { FamilyMember } from './shared';

// ═══ 上下文类型定义 ═══

export interface FamilyContextType {
  // 成员相关
  getMember: (id: string) => FamilyMember | undefined;
  getOnlineMembers: () => FamilyMember[];
  getMemberCount: () => number;
  getOnlineCount: () => number;

  // 活动相关
  getRecentActivities: (limit?: number) => FamilyActivity[];
  getActivityCount: () => number;

  // 消息相关
  getUnreadMessages: () => FamilyMessage[];
  getUnreadMessageCount: () => number;
  getMessageCount: () => number;

  // 学习相关
  getCourseProgress: (courseId: string) => number;
  getCompletedCourses: () => number;

  // 统计相关
  getTotalContribution: () => number;
  getAverageGrowth: () => number;

  // 状态相关
  isOnline: () => boolean;
  isSyncing: () => boolean;
}

// ═══ 创建上下文 ═══

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

// ═══ Provider 组件 ═══

export interface FamilyProviderProps {
  children: ReactNode;
}

export function FamilyProvider({ children }: FamilyProviderProps) {
  const store = useFamilyStore();

  // 成员相关方法
  const getMember = (id: string): FamilyMember | undefined => {
    return store.members.find(m => m.id === id);
  };

  const getOnlineMembers = (): FamilyMember[] => {
    return store.members.filter(m => m.status !== 'idle');
  };

  const getMemberCount = (): number => {
    return store.members.length;
  };

  const getOnlineCount = (): number => {
    return store.members.filter(m => m.status !== 'idle').length;
  };

  // 活动相关方法
  const getRecentActivities = (limit: number = 10): FamilyActivity[] => {
    return store.activities.slice(0, limit);
  };

  const getActivityCount = (): number => {
    return store.activities.length;
  };

  // 消息相关方法
  const getUnreadMessages = (): FamilyMessage[] => {
    return store.messages.filter(m => !m.read);
  };

  const getUnreadMessageCount = (): number => {
    return store.messages.filter(m => !m.read).length;
  };

  const getMessageCount = (): number => {
    return store.messages.length;
  };

  // 学习相关方法
  const getCourseProgress = (courseId: string): number => {
    return store.learningProgress[courseId] || 0;
  };

  const getCompletedCourses = (): number => {
    return Object.values(store.learningProgress).filter(p => p === 100).length;
  };

  // 统计相关方法
  const getTotalContribution = (): number => {
    return store.members.reduce((sum, m) => sum + m.contribution, 0);
  };

  const getAverageGrowth = (): number => {
    if (store.members.length === 0) { return 0; }
    const total = store.members.reduce((sum, m) => sum + m.growth, 0);
    return Math.round(total / store.members.length);
  };

  // 状态相关方法
  const isOnline = (): boolean => {
    return store.members.some(m => m.status !== 'idle');
  };

  const isSyncing = (): boolean => {
    return store.isSyncing;
  };

  // 使用 useMemo 优化性能
  const contextValue = useMemo<FamilyContextType>(
    () => ({
      // 成员相关
      getMember,
      getOnlineMembers,
      getMemberCount,
      getOnlineCount,
      // 活动相关
      getRecentActivities,
      getActivityCount,
      // 消息相关
      getUnreadMessages,
      getUnreadMessageCount,
      getMessageCount,
      // 学习相关
      getCourseProgress,
      getCompletedCourses,
      // 统计相关
      getTotalContribution,
      getAverageGrowth,
      // 状态相关
      isOnline,
      isSyncing,
    }),
    [
      store.members,
      store.activities,
      store.messages,
      store.learningProgress,
      store.isSyncing,
    ]
  );

  return (
    <FamilyContext.Provider value={contextValue}>
      {children}
    </FamilyContext.Provider>
  );
}

// ═══ Hook ═══

/**
 * useFamily Hook
 * 
 * 提供便捷的 AI Family 数据访问方法
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getOnlineMembers, getUnreadMessageCount } = useFamily();
 *   
 *   const onlineMembers = getOnlineMembers();
 *   const unreadCount = getUnreadMessageCount();
 *   
 *   return (
 *     <div>
 *       <p>在线成员: {onlineMembers.length}</p>
 *       <p>未读消息: {unreadCount}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFamily(): FamilyContextType {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within FamilyProvider');
  }
  return context;
}

// ═══ 便捷 Hook ═══

/**
 * useOnlineMembers Hook
 * 
 * 快速获取在线成员列表
 */
export function useOnlineMembers(): FamilyMember[] {
  const { getOnlineMembers } = useFamily();
  return useMemo(() => getOnlineMembers(), []);
}

/**
 * useUnreadMessages Hook
 * 
 * 快速获取未读消息列表
 */
export function useUnreadMessages(): FamilyMessage[] {
  const { getUnreadMessages } = useFamily();
  return useMemo(() => getUnreadMessages(), []);
}

/**
 * useRecentActivities Hook
 * 
 * 快速获取最近活动列表
 */
export function useRecentActivities(limit: number = 10): FamilyActivity[] {
  const { getRecentActivities } = useFamily();
  return useMemo(() => getRecentActivities(limit), [limit]);
}

/**
 * useFamilyStats Hook
 * 
 * 快速获取家庭统计数据
 */
export function useFamilyStats() {
  const { getMemberCount, getOnlineCount, getActivityCount, getMessageCount, getTotalContribution, getAverageGrowth } = useFamily();

  return useMemo(
    () => ({
      memberCount: getMemberCount(),
      onlineCount: getOnlineCount(),
      activityCount: getActivityCount(),
      messageCount: getMessageCount(),
      totalContribution: getTotalContribution(),
      averageGrowth: getAverageGrowth(),
    }),
    []
  );
}
