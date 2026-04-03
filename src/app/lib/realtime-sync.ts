/**
 * realtime-sync.ts
 * =================
 * 实时数据同步服务
 *
 * 功能:
 * - Supabase 实时订阅
 * - 数据变更事件分发
 * - 订阅状态管理
 */

import { getNativeSupabaseClient } from "./native-supabase-client";
import { queryCache } from "./query-cache";

export type RealtimeEventType =
  | "INSERT"
  | "UPDATE"
  | "DELETE"
  | "*";

export interface RealtimeEvent<T = unknown> {
  eventType: RealtimeEventType;
  table: string;
  oldRecord: T | null;
  record: T;
  timestamp: number;
}

export type RealtimeSubscriptionCallback<T = unknown> = (
  event: RealtimeEvent<T>
) => void;

export interface RealtimeSubscription {
  id: string;
  table: string;
  eventType: RealtimeEventType;
  unsubscribe: () => void;
}

export class RealtimeSync {
  private static subscriptions: Map<string, RealtimeSubscription> = new Map();
  private static isConnected = false;

  static async subscribe<T = unknown>(
    table: string,
    callback: RealtimeSubscriptionCallback<T>,
    eventType: RealtimeEventType = "*"
  ): Promise<RealtimeSubscription> {
    const supabase = getNativeSupabaseClient();
    
    if (!supabase) {
      console.warn(`[RealtimeSync] Supabase not available, skipping subscription for ${table}`);
      return {
        id: `fallback-${Date.now()}`,
        table,
        eventType,
        unsubscribe: () => {},
      };
    }

    const subscriptionId = `${table}-${eventType}-${Date.now()}`;
    
    try {
      const channel = supabase.channel(`realtime:${table}`);

      const typedCallback = callback as RealtimeSubscriptionCallback<unknown>;

      (channel as any).on('postgres_changes', {
        event: eventType,
        schema: 'public',
        table: table,
      }, (payload: any) => {
        const event: RealtimeEvent<T> = {
          eventType: payload.eventType,
          table: payload.table,
          oldRecord: payload.old,
          record: payload.new,
          timestamp: Date.now(),
        };

        typedCallback(event);
        
        RealtimeSync.invalidateCache(table);
      });

      const subscribePromise = (channel as any).subscribe();
      
      await new Promise<void>((resolve, reject) => {
        subscribePromise.then((status: any) => {
          if (status === 'SUBSCRIBED') {
            RealtimeSync.isConnected = true;
            resolve();
          } else {
            reject(new Error(`Failed to subscribe: ${status}`));
          }
        }).catch(reject);
      });

      const subscription: RealtimeSubscription = {
        id: subscriptionId,
        table,
        eventType,
        unsubscribe: () => {
          RealtimeSync.subscriptions.delete(subscriptionId);
        },
      };

      RealtimeSync.subscriptions.set(subscriptionId, subscription);

      return subscription;
    } catch (error) {
      console.error(`[RealtimeSync] Failed to subscribe to ${table}:`, error);
      throw error;
    }
  }

  static unsubscribe(subscriptionId: string): void {
    const subscription = RealtimeSync.subscriptions.get(subscriptionId);
    
    if (subscription) {
      subscription.unsubscribe();
      RealtimeSync.subscriptions.delete(subscriptionId);
    }
  }

  static unsubscribeAll(): void {
    for (const subscription of RealtimeSync.subscriptions.values()) {
      subscription.unsubscribe();
    }
    
    RealtimeSync.subscriptions.clear();
  }

  private static invalidateCache(table: string): void {
    const keys = queryCache.keys();
    const tableKeys = keys.filter(key => key.startsWith(`${table}:`));
    
    for (const key of tableKeys) {
      queryCache.delete(key);
    }
  }

  static getSubscriptionCount(): number {
    return RealtimeSync.subscriptions.size;
  }

  static getSubscriptionList(): RealtimeSubscription[] {
    return Array.from(RealtimeSync.subscriptions.values());
  }

  static getConnectionStatus(): {
    connected: boolean;
  } {
    return {
      connected: RealtimeSync.isConnected,
    };
  }
}

export const realtimeSync = {
  subscribe: RealtimeSync.subscribe.bind(RealtimeSync),
  unsubscribe: RealtimeSync.unsubscribe.bind(RealtimeSync),
  unsubscribeAll: RealtimeSync.unsubscribeAll.bind(RealtimeSync),
  getSubscriptionCount: RealtimeSync.getSubscriptionCount.bind(RealtimeSync),
  getSubscriptionList: RealtimeSync.getSubscriptionList.bind(RealtimeSync),
  getConnectionStatus: RealtimeSync.getConnectionStatus.bind(RealtimeSync),
};