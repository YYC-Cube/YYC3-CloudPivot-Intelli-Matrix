/**
 * batch-operations.ts
 * ===================
 * 批量操作优化服务
 *
 * 功能:
 * - 批量插入优化
 * - 批量更新优化
 * - 批量删除优化
 */

import { getNativeSupabaseClient } from "./native-supabase-client";
import { getHybridStorage } from "./hybrid-storage-manager";

export interface BatchResult<T> {
  success: boolean;
  data: T[];
  errors: Array<{ index: number; error: Error }>;
}

export interface BatchInsertOptions {
  batchSize?: number;
  onProgress?: (progress: { current: number; total: number }) => void;
}

export class BatchOperations {
  private supabase = getNativeSupabaseClient();

  async batchInsert<T extends Record<string, unknown>>(
    table: string,
    items: T[],
    options: BatchInsertOptions = {}
  ): Promise<BatchResult<T>> {
    const { batchSize = 100, onProgress } = options;
    const results: T[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    if (this.supabase) {
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);

        try {
          const query = this.supabase.from(table).insert(batch);
          const response = await query.select() as { data?: T[]; error?: Error };

          if (response.data) {
            results.push(...response.data);
          }

          if (onProgress) {
            onProgress({ current: i + batch.length, total: items.length });
          }
        } catch (error) {
          errors.push({ index: i, error: error as Error });
        }
      }
    } else {
      const storage = getHybridStorage();
      if (!storage) {
        throw new Error("Storage not available");
      }

      for (let i = 0; i < items.length; i++) {
        try {
          const result = await storage.add(table, items[i]);
          results.push(result as T);

          if (onProgress && i % 10 === 0) {
            onProgress({ current: i + 1, total: items.length });
          }
        } catch (error) {
          errors.push({ index: i, error: error as Error });
        }
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      errors,
    };
  }

  async batchUpdate<T extends Record<string, unknown>>(
    table: string,
    updates: Array<{ id: string; changes: Partial<T> }>
  ): Promise<BatchResult<T>> {
    const results: T[] = [];
    const errors: Array<{ index: number; error: Error }> = [];

    if (this.supabase) {
      for (let i = 0; i < updates.length; i++) {
        const { id, changes } = updates[i];

        try {
          const query = this.supabase
            .from(table)
            .update(changes)
            .eq('id', id)
            .select()
            .single();

          const response = await query;

          if (response.data) {
            results.push(response.data as T);
          }
        } catch (error) {
          errors.push({ index: i, error: error as Error });
        }
      }
    } else {
      const storage = getHybridStorage();
      if (!storage) {
        throw new Error("Storage not available");
      }

      for (let i = 0; i < updates.length; i++) {
        const { id, changes } = updates[i];

        try {
          const result = await storage.update(table, id, changes);
          if (result) {
            results.push(result as T);
          }
        } catch (error) {
          errors.push({ index: i, error: error as Error });
        }
      }
    }

    return {
      success: errors.length === 0,
      data: results,
      errors,
    };
  }

  async batchDelete(
    table: string,
    ids: string[]
  ): Promise<{ success: boolean; deleted: number; errors: Array<{ id: string; error: Error }> }> {
    let deleted = 0;
    const errors: Array<{ id: string; error: Error }> = [];

    if (this.supabase) {
      for (const id of ids) {
        try {
          const query = this.supabase
            .from(table)
            .delete()
            .eq('id', id) as unknown as Promise<unknown>;

          await query;

          deleted++;
        } catch (error) {
          errors.push({ id, error: error as Error });
        }
      }
    } else {
      const storage = getHybridStorage();
      if (!storage) {
        throw new Error("Storage not available");
      }

      for (const id of ids) {
        try {
          const success = await storage.delete(table, id);
          if (success) {
            deleted++;
          }
        } catch (error) {
          errors.push({ id, error: error as Error });
        }
      }
    }

    return {
      success: errors.length === 0,
      deleted,
      errors,
    };
  }
}

export const batchOperations = new BatchOperations();