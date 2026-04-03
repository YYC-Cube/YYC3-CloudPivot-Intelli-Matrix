/**
 * FamilyDataService.ts
 * ===================
 * AI Family 数据服务层
 * 负责数据同步、拉取、实时监听
 */

import { supabase } from '../../lib/supabaseClient';
import { useFamilyStore } from './store/FamilyStore';
import { FAMILY_MEMBERS } from './shared';
import type { FamilyMember, FamilyActivity, FamilyMessage } from './store/FamilyStore';

// ═══ 类型定义 ═══

export interface SyncResult {
  success: boolean;
  timestamp: number;
  synced: {
    members: number;
    activities: number;
    messages: number;
    learningProgress: number;
  };
  errors: string[];
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

export interface DatabaseMemberRow {
  id: string;
  name: string;
  short_name: string;
  en_title: string;
  quote: string | null;
  role: string;
  phone: string | null;
  personality: string | null;
  greeting: string | null;
  care_message: string | null;
  core_ability: string | null;
  color: string;
  icon: string;
  status: string;
  contribution: number;
  growth: number;
  streak: number;
  mood: string;
  metadata?: {
    hobbies?: string[];
    expertise?: string[];
    responsibilities?: string[];
  };
}

export interface DatabaseActivityRow {
  id: string;
  member_id: string;
  activity_type: string;
  title: string;
  description: string | null;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DatabaseMessageRow {
  id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  message_type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface DatabaseSyncActivityRow {
  id: string;
  type: string;
  member_id: string;
  member_name: string;
  member_color: string;
  title: string;
  description: string | null;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface DatabaseSyncMessageRow {
  id: string;
  from_member_id: string;
  to_member_id: string | null;
  channel_id: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: string;
}

export interface DatabaseSyncMemberRow {
  id: string;
  name: string;
  short_name: string;
  en_title: string;
  quote: string | null;
  role: string;
  phone: string | null;
  personality: string | null;
  greeting: string | null;
  care_message: string | null;
  core_ability: string | null;
  color: string;
  icon: string;
  status: string;
  contribution: number;
  growth: number;
  streak: number;
  mood: string;
  metadata?: {
    hobbies?: string[];
    expertise?: string[];
    responsibilities?: string[];
  };
}

// ═══ 数据服务类 ═══

class FamilyDataService {
  private subscriptions: Map<string, RealtimeSubscription> = new Map();
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  // ═══ 初始化 ═══

  async initialize(): Promise<void> {
    console.info('[FamilyDataService] Initializing...');

    // 初始化成员数据
    await this.syncMembers();

    // 初始化活动数据
    await this.syncActivities();

    // 初始化消息数据
    await this.syncMessages();

    // 设置实时监听
    this.setupRealtimeListeners();

    // 设置自动同步
    this.setupAutoSync();

    console.info('[FamilyDataService] Initialized successfully');
  }

  // ═══ 数据同步 ═══

  /**
   * 同步所有数据
   */
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      timestamp: Date.now(),
      synced: {
        members: 0,
        activities: 0,
        messages: 0,
        learningProgress: 0,
      },
      errors: [],
    };

    try {
      // 设置同步状态
      useFamilyStore.getState().setIsSyncing(true);

      // 同步成员
      const membersSynced = await this.syncMembers();
      result.synced.members = membersSynced;

      // 同步活动
      const activitiesSynced = await this.syncActivities();
      result.synced.activities = activitiesSynced;

      // 同步消息
      const messagesSynced = await this.syncMessages();
      result.synced.messages = messagesSynced;

      // 更新同步时间
      useFamilyStore.getState().setLastSyncTime(result.timestamp);

      console.info('[FamilyDataService] Sync completed:', result);
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : String(error));
      console.error('[FamilyDataService] Sync failed:', error);
    } finally {
      useFamilyStore.getState().setIsSyncing(false);
    }

    return result;
  }

  /**
   * 同步成员数据
   */
  async syncMembers(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { throw error; }

      if (!data || data.length === 0) {
        // 如果数据库中没有数据，使用默认数据
        await this.seedMembers();
        return FAMILY_MEMBERS.length;
      }

      // 更新 Store 中的成员数据
      const members: FamilyMember[] = data.map((row) => {
        const memberRow = row as DatabaseMemberRow;
        return {
          id: memberRow.id,
          name: memberRow.name,
          shortName: memberRow.short_name,
          enTitle: memberRow.en_title,
          quote: memberRow.quote || '',
          role: memberRow.role,
          phone: memberRow.phone || '',
          personality: memberRow.personality || '',
          hobbies: memberRow.metadata?.hobbies || [],
          expertise: memberRow.metadata?.expertise || [],
          greeting: memberRow.greeting || '',
          careMessage: memberRow.care_message || '',
          responsibilities: memberRow.metadata?.responsibilities || [],
          coreAbility: memberRow.core_ability || '',
          color: memberRow.color,
          icon: this.getIconComponent(memberRow.icon),
          status: (memberRow.status as "online" | "speaking" | "idle"),
          contribution: memberRow.contribution || 0,
          growth: memberRow.growth || 0,
          streak: memberRow.streak || 0,
          mood: memberRow.mood || 'happy',
        };
      });

      // 更新 Store
      useFamilyStore.setState({ members });

      return members.length;
    } catch (error) {
      console.error('[FamilyDataService] Failed to sync members:', error);
      throw error;
    }
  }

  /**
   * 同步活动数据
   */
  async syncActivities(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('family_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) { throw error; }

      if (!data) { return 0; }

      // 更新 Store 中的活动数据
      const activities: FamilyActivity[] = data.map((row: DatabaseSyncActivityRow) => ({
        id: row.id,
        type: row.type as FamilyActivity['type'],
        memberId: row.member_id,
        memberName: row.member_name,
        memberColor: row.member_color,
        title: row.title,
        description: row.description || '',
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      }));

      // 更新 Store
      useFamilyStore.setState({ activities });

      return activities.length;
    } catch (error) {
      console.error('[FamilyDataService] Failed to sync activities:', error);
      throw error;
    }
  }

  /**
   * 同步消息数据
   */
  async syncMessages(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('family_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) { throw error; }

      if (!data) { return 0; }

      // 更新 Store 中的消息数据
      const messages: FamilyMessage[] = data.map((row: DatabaseSyncMessageRow) => ({
        id: row.id,
        fromMemberId: row.from_member_id,
        toMemberId: row.to_member_id || undefined,
        channelId: row.channel_id,
        content: row.content,
        timestamp: row.timestamp,
        read: row.read,
        type: row.type as FamilyMessage['type'],
      }));

      // 更新 Store
      useFamilyStore.setState({ messages });

      return messages.length;
    } catch (error) {
      console.error('[FamilyDataService] Failed to sync messages:', error);
      throw error;
    }
  }

  // ═══ 数据拉取 ═══

  /**
   * 拉取成员数据
   */
  async fetchMembers(): Promise<FamilyMember[]> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) { throw error; }

      if (!data) { return []; }

      return data.map((row: DatabaseSyncMemberRow) => ({
        id: row.id,
        name: row.name,
        shortName: row.short_name,
        enTitle: row.en_title,
        quote: row.quote || '',
        role: row.role,
        phone: row.phone,
        personality: row.personality,
        hobbies: row.metadata?.hobbies || [],
        expertise: row.metadata?.expertise || [],
        greeting: row.greeting || '',
        careMessage: row.care_message || '',
        responsibilities: row.metadata?.responsibilities || [],
        coreAbility: row.core_ability || '',
        color: row.color,
        icon: this.getIconComponent(row.icon),
        status: row.status as FamilyMember['status'],
        contribution: row.contribution || 0,
        growth: row.growth || 0,
        streak: row.streak || 0,
        mood: row.mood || 'happy',
      }));
    } catch (error) {
      console.error('[FamilyDataService] Failed to fetch members:', error);
      throw error;
    }
  }

  /**
   * 拉取活动数据
   */
  async fetchActivities(limit: number = 50): Promise<FamilyActivity[]> {
    try {
      const { data, error } = await supabase
        .from('family_activities')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) { throw error; }

      if (!data) { return []; }

      return data.map((row: DatabaseSyncActivityRow) => ({
        id: row.id,
        type: row.type as FamilyActivity['type'],
        memberId: row.member_id,
        memberName: row.member_name,
        memberColor: row.member_color,
        title: row.title,
        description: row.description || '',
        timestamp: row.timestamp,
        metadata: row.metadata || {},
      }));
    } catch (error) {
      console.error('[FamilyDataService] Failed to fetch activities:', error);
      throw error;
    }
  }

  /**
   * 拉取消息数据
   */
  async fetchMessages(channelId?: string, limit: number = 50): Promise<FamilyMessage[]> {
    try {
      let query = supabase
        .from('family_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (channelId) {
        query = query.eq('channel_id', channelId);
      }

      const { data, error } = await query;

      if (error) { throw error; }

      if (!data) { return []; }

      return data.map((row: DatabaseSyncMessageRow) => ({
        id: row.id,
        fromMemberId: row.from_member_id,
        toMemberId: row.to_member_id || undefined,
        channelId: row.channel_id,
        content: row.content,
        timestamp: row.timestamp,
        read: row.read,
        type: row.type as FamilyMessage['type'],
      }));
    } catch (error) {
      console.error('[FamilyDataService] Failed to fetch messages:', error);
      throw error;
    }
  }

  // ═══ 数据写入 ═══

  /**
   * 添加活动
   */
  async addActivity(activity: Omit<FamilyActivity, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('family_activities')
        .insert({
          type: activity.type,
          member_id: activity.memberId,
          member_name: activity.memberName,
          member_color: activity.memberColor,
          title: activity.title,
          description: activity.description,
          timestamp: activity.timestamp,
          metadata: activity.metadata,
        })
        .select()
        .single();

      if (error) { throw error; }

      // 更新本地 Store
      const newActivity: FamilyActivity = {
        id: data[0].id,
        ...activity,
      };
      useFamilyStore.getState().addActivity(newActivity);

      return data[0].id;
    } catch (error) {
      console.error('[FamilyDataService] Failed to add activity:', error);
      throw error;
    }
  }

  /**
   * 添加消息
   */
  async addMessage(message: Omit<FamilyMessage, 'id'>): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('family_messages')
        .insert({
          from_member_id: message.fromMemberId,
          to_member_id: message.toMemberId,
          channel_id: message.channelId,
          content: message.content,
          timestamp: message.timestamp,
          read: message.read,
          type: message.type,
        })
        .select()
        .single();

      if (error) { throw error; }

      // 更新本地 Store
      const newMessage: FamilyMessage = {
        id: data[0].id,
        ...message,
      };
      useFamilyStore.getState().addMessage(newMessage);

      return data[0].id;
    } catch (error) {
      console.error('[FamilyDataService] Failed to add message:', error);
      throw error;
    }
  }

  /**
   * 更新成员状态
   */
  async updateMemberStatus(id: string, status: FamilyMember['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('family_members')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) { throw error; }

      // 更新本地 Store
      useFamilyStore.getState().updateMemberStatus(id, status);
    } catch (error) {
      console.error('[FamilyDataService] Failed to update member status:', error);
      throw error;
    }
  }

  /**
   * 标记消息为已读
   */
  async markMessageAsRead(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('family_messages')
        .update({ read: true })
        .eq('id', id)
        .select()
        .single();

      if (error) { throw error; }

      // 更新本地 Store
      useFamilyStore.getState().markMessageAsRead(id);
    } catch (error) {
      console.error('[FamilyDataService] Failed to mark message as read:', error);
      throw error;
    }
  }

  // ═══ 实时监听 ═══

  /**
   * 设置实时监听器
   */
  private setupRealtimeListeners(): void {
    // 监听成员变化
    this.subscribeToMembers();

    // 监听活动变化
    this.subscribeToActivities();

    // 监听消息变化
    this.subscribeToMessages();
  }

  /**
   * 监听成员变化
   */
  private subscribeToMembers(): void {
    const subscription = supabase
      .channel('family_members_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_members',
        },
        (_payload: unknown) => {
          console.info('[FamilyDataService] Member changed:', _payload);
          this.syncMembers();
        }
      )
      .subscribe();

    this.subscriptions.set('members', subscription);
  }

  /**
   * 监听活动变化
   */
  private subscribeToActivities(): void {
    const subscription = supabase
      .channel('family_activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_activities',
        },
        (_payload: unknown) => {
          console.info('[FamilyDataService] Activity changed:', _payload);
          this.syncActivities();
        }
      )
      .subscribe();

    this.subscriptions.set('activities', subscription);
  }

  /**
   * 监听消息变化
   */
  private subscribeToMessages(): void {
    const subscription = supabase
      .channel('family_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_messages',
        },
        (_payload: unknown) => {
          console.info('[FamilyDataService] Message changed:', _payload);
          this.syncMessages();
        }
      )
      .subscribe();

    this.subscriptions.set('messages', subscription);
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }

  // ═══ 自动同步 ═══

  /**
   * 设置自动同步
   */
  private setupAutoSync(): void {
    const settings = useFamilyStore.getState().settings;

    if (settings.autoSync) {
      this.syncInterval = setInterval(() => {
        this.syncAll();
      }, settings.syncInterval);
    }
  }

  /**
   * 更新自动同步间隔
   */
  updateSyncInterval(interval: number): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    const settings = useFamilyStore.getState().settings;
    if (settings.autoSync) {
      this.syncInterval = setInterval(() => {
        this.syncAll();
      }, interval);
    }
  }

  // ═══ 辅助方法 ═══

  /**
   * 初始化成员数据
   */
  private async seedMembers(): Promise<void> {
    try {
      const members = FAMILY_MEMBERS.map((member) => ({
        id: member.id,
        name: member.name,
        short_name: member.shortName,
        en_title: member.enTitle,
        quote: member.quote,
        role: member.role,
        phone: member.phone,
        personality: member.personality,
        greeting: member.greeting,
        care_message: member.careMessage,
        core_ability: member.coreAbility,
        status: member.status,
        mood: member.mood,
        contribution: member.contribution,
        growth: member.growth,
        streak: member.streak,
        color: member.color,
        icon: member.icon as string,
        metadata: {
          hobbies: member.hobbies,
          expertise: member.expertise,
          responsibilities: member.responsibilities,
        },
      }));

      const { error } = await supabase
        .from('family_members')
        .insert(members)
        .select()
        .single();

      if (error) { throw error; }

      console.info('[FamilyDataService] Members seeded successfully');
    } catch (error) {
      console.error('[FamilyDataService] Failed to seed members:', error);
      throw error;
    }
  }

  /**
   * 获取图标组件
   */
  private getIconComponent(_iconName: string): React.ComponentType {
    // 这里应该根据 iconName 返回对应的图标组件
    // 暂时返回一个占位符
    return () => null;
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.unsubscribeAll();

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// ═══ 导出单例 ═══

export const familyDataService = new FamilyDataService();

// ═══ 导出便捷函数 ═══

/**
 * 初始化数据服务
 */
export async function initializeFamilyDataService(): Promise<void> {
  return familyDataService.initialize();
}

/**
 * 同步所有数据
 */
export async function syncFamilyData(): Promise<SyncResult> {
  return familyDataService.syncAll();
}

/**
 * 拉取成员数据
 */
export async function fetchFamilyMembers(): Promise<FamilyMember[]> {
  return familyDataService.fetchMembers();
}

/**
 * 拉取活动数据
 */
export async function fetchFamilyActivities(limit?: number): Promise<FamilyActivity[]> {
  return familyDataService.fetchActivities(limit);
}

/**
 * 拉取消息数据
 */
export async function fetchFamilyMessages(channelId?: string, limit?: number): Promise<FamilyMessage[]> {
  return familyDataService.fetchMessages(channelId, limit);
}

/**
 * 添加活动
 */
export async function addFamilyActivity(activity: Omit<FamilyActivity, 'id'>): Promise<string> {
  return familyDataService.addActivity(activity);
}

/**
 * 添加消息
 */
export async function addFamilyMessage(message: Omit<FamilyMessage, 'id'>): Promise<string> {
  return familyDataService.addMessage(message);
}

/**
 * 更新成员状态
 */
export async function updateFamilyMemberStatus(id: string, status: FamilyMember['status']): Promise<void> {
  return familyDataService.updateMemberStatus(id, status);
}

/**
 * 标记消息为已读
 */
export async function markFamilyMessageAsRead(id: string): Promise<void> {
  return familyDataService.markMessageAsRead(id);
}
