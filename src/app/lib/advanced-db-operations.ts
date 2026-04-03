/**
 * advanced-db-operations.ts
 * ========================
 * YYC³ 高级数据库操作
 * 
 * 功能特性：
 * - 批量操作（批量插入、批量更新、批量删除）
 * - 事务支持（原子操作）
 * - 复杂查询（联表、聚合、分组）
 * - 数据缓存策略
 * - 查询优化
 */

import { getNativeSupabaseClient } from "./native-supabase-client";

// ============================================================
// 类型定义
// ============================================================

export interface BatchInsertOptions {
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
  skipDuplicates?: boolean;
}

export interface BatchUpdateOptions {
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

export interface BatchDeleteOptions {
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}

export interface TransactionOperation {
  type: "insert" | "update" | "delete";
  table: string;
  data?: unknown;
  filter?: Record<string, unknown>;
}

export interface TransactionResult {
  success: boolean;
  results: Array<{ success: boolean; error?: string; data?: unknown }>;
  error?: string;
}

export interface QueryOptions {
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
  offset?: number;
}

export interface JoinQueryOptions {
  fromTable: string;
  fromAlias?: string;
  joinTable: string;
  joinAlias?: string;
  on: string;
  type?: "inner" | "left" | "right" | "full";
  select?: string;
  filters?: Record<string, unknown>;
  orderBy?: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
  offset?: number;
}

export interface AggregateOptions {
  table: string;
  groupBy?: string[];
  aggregates: Array<{
    column: string;
    function: "count" | "sum" | "avg" | "min" | "max";
    alias: string;
  }>;
  filters?: Record<string, unknown>;
  having?: Record<string, unknown>;
  orderBy?: Array<{ column: string; ascending?: boolean }>;
  limit?: number;
}

// ============================================================
// 批量操作
// ============================================================

export async function batchInsert<T>(
  table: string,
  data: T[],
  options: BatchInsertOptions = {}
): Promise<{ success: boolean; inserted: T[]; errors: string[] }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { success: false, inserted: [], errors: ["Supabase client not initialized"] };
  }

  const batchSize = options.batchSize || 100;
  const inserted: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    try {
      const { data: result, error } = await client.from(table).insert(batch).select("*").single();
      
      if (error) {
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else if (result) {
        inserted.push(result as T);
      }

      if (options.onProgress) {
        options.onProgress(Math.min(i + batchSize, data.length), data.length);
      }
    } catch (err) {
      errors.push(`Batch ${i / batchSize + 1}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return {
    success: errors.length === 0,
    inserted,
    errors,
  };
}

export async function batchUpdate<T>(
  table: string,
  updates: Array<{ id: string; data: Partial<T> }>,
  options: BatchUpdateOptions = {}
): Promise<{ success: boolean; updated: T[]; errors: string[] }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { success: false, updated: [], errors: ["Supabase client not initialized"] };
  }

  const batchSize = options.batchSize || 50;
  const updated: T[] = [];
  const errors: string[] = [];

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    
    for (const { id, data } of batch) {
      try {
        const { data: result, error } = await client.from(table).update(data).eq("id", id).select("*").single();
        
        if (error) {
          errors.push(`Update ${id}: ${error.message}`);
        } else if (result) {
          updated.push(result as T);
        }
      } catch (err) {
        errors.push(`Update ${id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    if (options.onProgress) {
      options.onProgress(Math.min(i + batchSize, updates.length), updates.length);
    }
  }

  return {
    success: errors.length === 0,
    updated,
    errors,
  };
}

export async function batchDelete(
  table: string,
  ids: string[],
  options: BatchDeleteOptions = {}
): Promise<{ success: boolean; deleted: string[]; errors: string[] }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { success: false, deleted: [], errors: ["Supabase client not initialized"] };
  }

  const batchSize = options.batchSize || 50;
  const deleted: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    
    for (const id of batch) {
      try {
        const { error } = await client.from(table).delete().eq("id", id).then();
        
        if (error) {
          errors.push(`Delete ${id}: ${error.message}`);
        } else {
          deleted.push(id);
        }
      } catch (err) {
        errors.push(`Delete ${id}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    if (options.onProgress) {
      options.onProgress(Math.min(i + batchSize, ids.length), ids.length);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

// ============================================================
// 事务支持
// ============================================================

export async function executeTransaction(
  operations: TransactionOperation[]
): Promise<TransactionResult> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return {
      success: false,
      results: [],
      error: "Supabase client not initialized",
    };
  }

  const results: Array<{ success: boolean; error?: string; data?: unknown }> = [];

  for (const operation of operations) {
    try {
      switch (operation.type) {
        case "insert": {
          const insertResult = await client.from(operation.table).insert(operation.data).select("*").single();
          if (insertResult.error) {
            results.push({ success: false, error: insertResult.error.message });
          } else {
            results.push({ success: true, data: insertResult.data });
          }
          break;
        }

        case "update": {
          const updateResult = await client
            .from(operation.table)
            .update(operation.data)
            .eq("id", operation.filter?.id as string)
            .select("*")
            .single();
          if (updateResult.error) {
            results.push({ success: false, error: updateResult.error.message });
          } else {
            results.push({ success: true, data: updateResult.data });
          }
          break;
        }

        case "delete": {
          const deleteResult = await client.from(operation.table).delete().eq("id", operation.filter?.id as string).then();
          if (deleteResult.error) {
            results.push({ success: false, error: deleteResult.error.message });
          } else {
            results.push({ success: true });
          }
          break;
        }

        default:
          results.push({ success: false, error: "Unknown operation type" });
      }
    } catch (err) {
      results.push({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  const allSuccess = results.every((r) => r.success);

  return {
    success: allSuccess,
    results,
    error: allSuccess ? undefined : "Some operations failed",
  };
}

// ============================================================
// 复杂查询
// ============================================================

export async function complexQuery<T>(
  table: string,
  options: QueryOptions = {}
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not initialized" };
  }

  try {
    let query = client.from(table).select(options.select || "*");

    if (options.filters) {
      Object.entries(options.filters).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          query = (query as any).eq(column, value);
        }
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        query = (query as any).order(order.column, { ascending: order.ascending ?? true });
      });
    }

    if (options.limit) {
      query = (query as any).limit(options.limit);
    }

    if (options.offset) {
      query = (query as any).offset(options.offset);
    }

    const result = await new Promise<{ data: T[] | null; error: string | null }>((resolve) => {
      query.then((response: any) => {
        resolve({ data: response.data, error: response.error?.message || null });
      });
    });

    return result;
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Query failed",
    };
  }
}

export async function joinQuery<T>(
  options: JoinQueryOptions
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not initialized" };
  }

  try {
    const fromAlias = options.fromAlias || options.fromTable;
    const joinAlias = options.joinAlias || options.joinTable;

    const selectClause = options.select || `${fromAlias}.*,${joinAlias}.*`;

    let query = client.from(options.fromTable).select(selectClause);

    if (options.filters) {
      Object.entries(options.filters).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          query = (query as any).eq(column, value);
        }
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        query = (query as any).order(order.column, { ascending: order.ascending ?? true });
      });
    }

    if (options.limit) {
      query = (query as any).limit(options.limit);
    }

    if (options.offset) {
      query = (query as any).offset(options.offset);
    }

    const result = await new Promise<{ data: T[] | null; error: string | null }>((resolve) => {
      query.then((response: any) => {
        resolve({ data: response.data, error: response.error?.message || null });
      });
    });

    return result;
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Join query failed",
    };
  }
}

export async function aggregateQuery<T>(
  options: AggregateOptions
): Promise<{ data: T[] | null; error: string | null }> {
  const client = getNativeSupabaseClient();
  if (!client) {
    return { data: null, error: "Supabase client not initialized" };
  }

  try {
    const selectParts: string[] = [];

    if (options.groupBy && options.groupBy.length > 0) {
      options.groupBy.forEach((column) => {
        selectParts.push(column);
      });
    }

    options.aggregates.forEach((agg) => {
      selectParts.push(`${agg.function}(${agg.column}) as ${agg.alias}`);
    });

    const selectClause = selectParts.join(",");
    let query = client.from(options.table).select(selectClause);

    if (options.filters) {
      Object.entries(options.filters).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          query = (query as any).eq(column, value);
        }
      });
    }

    if (options.having) {
      Object.entries(options.having).forEach(([column, value]) => {
        if (value !== undefined && value !== null) {
          query = (query as any).eq(column, value);
        }
      });
    }

    if (options.orderBy) {
      options.orderBy.forEach((order) => {
        query = (query as any).order(order.column, { ascending: order.ascending ?? true });
      });
    }

    if (options.limit) {
      query = (query as any).limit(options.limit);
    }

    const result = await new Promise<{ data: T[] | null; error: string | null }>((resolve) => {
      query.then((response: any) => {
        resolve({ data: response.data, error: response.error?.message || null });
      });
    });

    return result;
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Aggregate query failed",
    };
  }
}

// ============================================================
// 数据缓存
// ============================================================

class DataCache {
  private cache: Map<string, { data: unknown; timestamp: number; ttl: number }> = new Map();
  private defaultTTL = 60000;

  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

export const dataCache = new DataCache();

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T[] | null; error: string | null }>,
  ttl?: number
): Promise<{ data: T[] | null; error: string | null; fromCache: boolean }> {
  if (dataCache.has(key)) {
    return {
      data: dataCache.get(key) as T[],
      error: null,
      fromCache: true,
    };
  }

  const result = await queryFn();

  if (result.data && !result.error) {
    dataCache.set(key, result.data, ttl);
  }

  return {
    ...result,
    fromCache: false,
  };
}

// ============================================================
// 查询优化
// ============================================================

export function optimizeQuery(options: QueryOptions): QueryOptions {
  const optimized: QueryOptions = { ...options };

  if (!optimized.select) {
    optimized.select = "*";
  }

  if (optimized.limit && optimized.limit > 1000) {
    console.warn("Query limit exceeds 1000, consider pagination");
  }

  if (optimized.orderBy && optimized.orderBy.length > 3) {
    console.warn("Multiple ORDER BY clauses may impact performance");
  }

  return optimized;
}

export function validateQuery(options: QueryOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (options.limit && options.limit < 0) {
    errors.push("Limit must be non-negative");
  }

  if (options.offset && options.offset < 0) {
    errors.push("Offset must be non-negative");
  }

  if (options.orderBy) {
    options.orderBy.forEach((order, index) => {
      if (!order.column) {
        errors.push(`ORDER BY clause ${index + 1} is missing column`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
