/**
 * Supabase Client 封装
 * ==================================
 * YYC³ 本地多端推理矩阵数据库
 *
 * 当前状态：原生实现（不使用 @supabase/supabase-js）
 * 接入方式：配置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量
 *
 * .env.development 配置示例：
 *   VITE_SUPABASE_URL=https://your-project.supabase.co
 *   VITE_SUPABASE_ANON_KEY=your-anon-key
 *
 * 本地直连 PostgreSQL 备选方案：
 *   VITE_DB_HOST=localhost
 *   VITE_DB_PORT=5433
 *   VITE_DB_NAME=yyc3_matrix
 */

import { createNativeSupabaseClient, getNativeSupabaseClient, type SupabaseConfig } from "./native-supabase-client";
import type { AppUser, AppSession } from "../types";

// ============================================================
// 预设用户（本地闭环系统：admin + developer 两种角色）
// ============================================================

const MOCK_USERS: Record<string, { password: string; user: AppUser }> = {
  "admin@cloudpivot.local": {
    password: "admin123",
    user: { id: "usr-001", email: "admin@cloudpivot.local", role: "admin", name: "YYC Admin" },
  },
  "dev@cloudpivot.local": {
    password: "dev123",
    user: { id: "usr-002", email: "dev@cloudpivot.local", role: "developer", name: "YYC Developer" },
  },
};

/** 幽灵用户 · Ghost Mode — 无需凭证，全权限 */
const GHOST_USER: AppUser = {
  id: "ghost-000",
  email: "ghost@yyc3.local",
  role: "admin",
  name: "Ghost Operator",
};

const SESSION_KEY = "yyc3_session";

// ============================================================
// 初始化原生 Supabase 客户端
// ============================================================

let nativeClientInitialized = false;

function initializeNativeClient(): void {
  if (nativeClientInitialized) {
    return;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const config: SupabaseConfig = {
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    };

    createNativeSupabaseClient(config);
  }

  nativeClientInitialized = true;
}

// ============================================================
// SupabaseClient 包装类
// ============================================================

class SupabaseClientWrapper {
  auth = {
    /** 邮箱密码登录 */
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const nativeClient = getNativeSupabaseClient();
      
      if (nativeClient) {
        const result = await nativeClient.signInWithPassword(email, password);
        
        if (result.data) {
          const session: AppSession = {
            user: {
              id: result.data.user.id,
              email: result.data.user.email,
              role: (result.data.user.user_metadata.role as "admin" | "developer") || "developer",
              name: (result.data.user.user_metadata.name as string) || result.data.user.email,
            },
            token: result.data.access_token,
            expiresAt: result.data.expires_at,
          };
          localStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return { data: { user: session.user, session }, error: null };
        }
        
        return { data: null, error: result.error };
      }

      const entry = MOCK_USERS[email];
      if (!entry || entry.password !== password) {
        return { data: null, error: { message: "邮箱或密码不正确" } };
      }
      const session: AppSession = {
        user: entry.user,
        token: `mock_token_${Date.now()}`,
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { data: { user: entry.user, session }, error: null };
    },

    /** 获取当前会话 */
    getSession: async () => {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) { return { data: { session: null }, error: null }; }
        const session: AppSession = JSON.parse(raw);
        if (Date.now() > session.expiresAt) {
          localStorage.removeItem(SESSION_KEY);
          return { data: { session: null }, error: null };
        }
        return { data: { session }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    },

    /** 获取当前用户 */
    getUser: async () => {
      const { data } = await this.auth.getSession();
      if (data.session) {
        return { data: { user: data.session.user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    /** 登出 */
    signOut: async () => {
      const nativeClient = getNativeSupabaseClient();
      
      if (nativeClient) {
        await nativeClient.signOut();
      }
      
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem("yyc3_ghost");
      return { error: null };
    },

    /** 监听认证状态变化 */
    onAuthStateChange: (callback: (event: string, session: AppSession | null) => void) => {
      const nativeClient = getNativeSupabaseClient();
      
      if (nativeClient) {
        const unsubscribe = nativeClient.onAuthStateChange((event, session) => {
          if (session) {
            const appSession: AppSession = {
              user: {
                id: session.user.id,
                email: session.user.email,
                role: (session.user.user_metadata.role as "admin" | "developer") || "developer",
                name: (session.user.user_metadata.name as string) || session.user.email,
              },
              token: session.access_token,
              expiresAt: session.expires_at,
            };
            callback(event, appSession);
          } else {
            callback(event, null);
          }
        });
        return { data: { subscription: { unsubscribe } } };
      }

      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        try {
          const session = JSON.parse(raw);
          callback("SIGNED_IN", session);
        } catch {
          callback("SIGNED_OUT", null);
        }
      } else {
        callback("SIGNED_OUT", null);
      }
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
  };

  /** 数据查询接口 */
  from(table: string) {
    const nativeClient = getNativeSupabaseClient();
    
    if (nativeClient) {
      return nativeClient.from(table);
    }

    interface QueryBuilder {
      _table: string;
      _columns: string | undefined;
      _filters: Record<string, unknown>;
      _orderBy: { column: string; ascending?: boolean } | undefined;
      _limit: number | undefined;
      select: (columns?: string) => QueryBuilder;
      eq: (col: string, val: unknown) => QueryBuilder;
      order: (col: string, opts?: { ascending?: boolean }) => QueryBuilder;
      limit: (n: number) => QueryBuilder;
      then: (resolve: (val: { data: never[]; error: null; count: number }) => void) => { data: { subscription: { unsubscribe: () => void } } };
      insert: (data: unknown) => { select: () => { single: () => Promise<{ data: Array<{ id: string;[key: string]: unknown }>; error: null; count: number }> }; error: null };
      update: (data: unknown) => { eq: (col: string, val: unknown) => { select: () => { single: () => Promise<{ data: Array<{ id: string;[key: string]: unknown }>; error: null; count: number }> }; error: null } };
      channel: (channelName: string) => { on: (event: string, callback: (payload: unknown) => void) => { subscribe: () => { data: { subscription: { unsubscribe: () => void } } } } };
    }

    const queryBuilder: QueryBuilder = {
      _table: table,
      _columns: undefined,
      _filters: {},
      _orderBy: undefined,
      _limit: undefined,

      select: (columns?: string) => {
        queryBuilder._columns = columns;
        return queryBuilder;
      },
      eq: (col: string, val: unknown) => {
        queryBuilder._filters[col] = val;
        return queryBuilder;
      },
      order: (col: string, opts?: { ascending?: boolean }) => {
        queryBuilder._orderBy = { column: col, ascending: opts?.ascending };
        return queryBuilder;
      },
      limit: (n: number) => {
        queryBuilder._limit = n;
        return queryBuilder;
      },
      then: (resolve: (val: { data: never[]; error: null; count: number }) => void) => {
        resolve({ data: [], error: null, count: 0 });
        return { data: { subscription: { unsubscribe: () => { } } } };
      },
      insert: (_data: unknown) => {
        return { select: () => ({ single: async () => this._mockQuery(table) }), error: null };
      },
      update: (_data: unknown) => {
        return { eq: (col: string, val: unknown) => { queryBuilder._filters[col] = val; return { select: () => ({ single: async () => this._mockQuery(table, queryBuilder._filters) }), error: null }; } };
      },
      channel: (_channelName: string) => {
        return {
          on: (_event: string, _callback: (payload: unknown) => void) => ({
            subscribe: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
          }),
        };
      },
    };
    return queryBuilder;
  }

  private _mockQuery(_table: string, _filters?: Record<string, unknown>): { data: Array<{ id: string;[key: string]: unknown }>; error: null; count: number } {
    return { data: [{ id: `mock-${_table}-id-1` }], error: null, count: 1 };
  }

  channel(_channelName: string) {
    const nativeClient = getNativeSupabaseClient();
    
    if (nativeClient) {
      return nativeClient.channel(_channelName);
    }

    return {
      on: (_event: string, _config: unknown, _callback: (payload: unknown) => void) => ({
        subscribe: () => ({ unsubscribe: () => { } }),
      }),
    };
  }
}

export const supabase = new SupabaseClientWrapper();

/**
 * 幽灵登录 · Ghost Sign-In
 * 跳过所有认证流程，直接创建 admin 级会话
 * 功能完全不受限，适用于本地开发 / 演示 / 紧急运维
 */
export function ghostSignIn(): AppSession {
  const session: AppSession = {
    user: GHOST_USER,
    token: `ghost_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem("yyc3_ghost", "1");
  return session;
}

/** 检查当前是否为幽灵模式 */
export function isGhostMode(): boolean {
  return localStorage.getItem("yyc3_ghost") === "1";
}

/** 初始化 Supabase 客户端 */
export function initSupabaseClient(): void {
  initializeNativeClient();
}
