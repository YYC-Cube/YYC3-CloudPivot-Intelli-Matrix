/**
 * native-supabase-client.ts
 * ========================
 * YYC³ 原生 Supabase 客户端
 * 
 * 不使用 @supabase/supabase-js 第三方库
 * 使用原生 fetch API 实现 Supabase REST API 调用
 * 
 * 功能特性：
 * - 认证管理（登录、登出、会话管理）
 * - 数据库 CRUD 操作
 * - 实时订阅（WebSocket）
 * - 存储操作
 * - 自动重试机制
 */

// ============================================================
// 类型定义
// ============================================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  dbUrl?: string;
  realtimeUrl?: string;
  storageUrl?: string;
}

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
}

export interface SupabaseError {
  message: string;
  status?: number;
  code?: string;
}

export interface User {
  id: string;
  email: string;
  user_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface DatabaseResponse<T> {
  data: T[] | null;
  error: SupabaseError | null;
  count: number | null;
}

export interface RealtimeMessage {
  event: string;
  payload: {
    data: Record<string, unknown>;
    errors: unknown[];
    schema: string;
    table: string;
    commit_timestamp: string;
    type: string;
  };
  ref: string;
  topic: string;
}

// ============================================================
// NativeSupabaseClient 实现
// ============================================================

export class NativeSupabaseClient {
  private config: SupabaseConfig;
  private session: Session | null = null;
  private authHeaders: Record<string, string> = {};
  private wsConnection: WebSocket | null = null;
  private wsSubscriptions: Map<string, Set<(payload: RealtimeMessage) => void>> = new Map();
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(config: SupabaseConfig) {
    this.config = {
      dbUrl: `${config.url}/rest/v1`,
      realtimeUrl: config.url.replace("https://", "wss://").replace("http://", "ws://"),
      storageUrl: `${config.url}/storage/v1`,
      ...config,
    };
    
    this.loadSessionFromStorage();
    this.updateAuthHeaders();
  }

  // ============================================================
  // 认证管理
  // ============================================================

  private loadSessionFromStorage(): void {
    try {
      const sessionData = localStorage.getItem("supabase_session");
      if (sessionData) {
        this.session = JSON.parse(sessionData);
        if (this.session && this.session.expires_at < Date.now()) {
          this.session = null;
          localStorage.removeItem("supabase_session");
        }
      }
    } catch {}
  }

  private saveSessionToStorage(): void {
    if (this.session) {
      localStorage.setItem("supabase_session", JSON.stringify(this.session));
    } else {
      localStorage.removeItem("supabase_session");
    }
  }

  private updateAuthHeaders(): void {
    this.authHeaders = {
      "apikey": this.config.anonKey,
      "Content-Type": "application/json",
    };

    if (this.session?.access_token) {
      this.authHeaders["Authorization"] = `Bearer ${this.session.access_token}`;
    }
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResponse<Session>> {
    try {
      const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data.error_description || data.message || "Authentication failed",
            status: response.status,
          },
        };
      }

      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        user: data.user,
      };

      this.saveSessionToStorage();
      this.updateAuthHeaders();

      return { data: this.session, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async signOut(): Promise<AuthResponse<null>> {
    try {
      if (this.session?.access_token) {
        await fetch(`${this.config.url}/auth/v1/logout`, {
          method: "POST",
          headers: {
            "apikey": this.config.anonKey,
            "Authorization": `Bearer ${this.session.access_token}`,
          },
        });
      }

      this.session = null;
      this.saveSessionToStorage();
      this.updateAuthHeaders();

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Logout failed",
        },
      };
    }
  }

  async getSession(): Promise<AuthResponse<Session | null>> {
    if (this.session && this.session.expires_at > Date.now()) {
      return { data: this.session, error: null };
    }

    if (this.session?.refresh_token) {
      return this.refreshSession();
    }

    return { data: null, error: null };
  }

  async refreshSession(): Promise<AuthResponse<Session | null>> {
    if (!this.session?.refresh_token) {
      return { data: null, error: { message: "No refresh token" } };
    }

    try {
      const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          "apikey": this.config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: this.session.refresh_token }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.session = null;
        this.saveSessionToStorage();
        this.updateAuthHeaders();

        return {
          data: null,
          error: {
            message: data.error_description || data.message || "Token refresh failed",
            status: response.status,
          },
        };
      }

      this.session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
        user: data.user,
      };

      this.saveSessionToStorage();
      this.updateAuthHeaders();

      return { data: this.session, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void): () => void {
    callback(this.session ? "SIGNED_IN" : "SIGNED_OUT", this.session);

    const checkInterval = setInterval(() => {
      const currentSession = this.session;
      if (currentSession && currentSession.expires_at < Date.now()) {
        this.refreshSession().then((result) => {
          if (result.data) {
            callback("TOKEN_REFRESHED", result.data);
          } else {
            callback("SIGNED_OUT", null);
          }
        });
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }

  // ============================================================
  // 数据库操作
  // ============================================================

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: {
      headers?: Record<string, string>;
      params?: Record<string, unknown>;
    } = {}
  ): Promise<DatabaseResponse<T>> {
    const url = new URL(`${this.config.dbUrl}${path}`);
    
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers = { ...this.authHeaders, ...options.headers };

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data.message || data.error || "Request failed",
            status: response.status,
            code: data.code,
          },
          count: null,
        };
      }

      const countHeader = response.headers.get("content-range");
      const count = countHeader ? parseInt(countHeader.split("/")[1]) : null;

      return {
        data: Array.isArray(data) ? data : [data],
        error: null,
        count,
      };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
        count: null,
      };
    }
  }

  from(table: string) {
    return {
      select: (columns: string = "*") => {
        const queryBuilder: any = {
          _columns: columns,
          _filters: [] as Array<{ column: string; operator: string; value: unknown }>,
          _orderBy: [] as Array<{ column: string; ascending: boolean }>,
          _limit: null as number | null,
          _offset: null as number | null,
          _single: false,
          _maybeSingle: false,

          select: (newColumns: string) => {
            queryBuilder._columns = newColumns;
            return queryBuilder;
          },

          eq: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "eq", value });
            return queryBuilder;
          },

          neq: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "neq", value });
            return queryBuilder;
          },

          gt: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "gt", value });
            return queryBuilder;
          },

          gte: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "gte", value });
            return queryBuilder;
          },

          lt: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "lt", value });
            return queryBuilder;
          },

          lte: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "lte", value });
            return queryBuilder;
          },

          like: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "like", value });
            return queryBuilder;
          },

          ilike: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "ilike", value });
            return queryBuilder;
          },

          in: (column: string, values: unknown[]) => {
            queryBuilder._filters.push({ column, operator: "in", value: `(${values.join(",")})` });
            return queryBuilder;
          },

          is: (column: string, value: unknown) => {
            queryBuilder._filters.push({ column, operator: "is", value });
            return queryBuilder;
          },

          order: (column: string, options: { ascending?: boolean } = {}) => {
            queryBuilder._orderBy.push({ column, ascending: options.ascending ?? true });
            return queryBuilder;
          },

          limit: (n: number) => {
            queryBuilder._limit = n;
            return queryBuilder;
          },

          offset: (n: number) => {
            queryBuilder._offset = n;
            return queryBuilder;
          },

          single: () => {
            queryBuilder._single = true;
            return queryBuilder;
          },

          maybeSingle: () => {
            queryBuilder._maybeSingle = true;
            return queryBuilder;
          },

          then: async (resolve: (value: DatabaseResponse<unknown>) => void) => {
            const params: Record<string, unknown> = {
              select: queryBuilder._columns,
            };

            queryBuilder._filters.forEach((filter: any) => {
              params[filter.column] = filter.value;
            });

            queryBuilder._orderBy.forEach((order: any) => {
              params[`order`] = `${order.column}.${order.ascending ? "asc" : "desc"}`;
            });

            if (queryBuilder._limit !== null) {
              params.limit = queryBuilder._limit;
            }

            if (queryBuilder._offset !== null) {
              params.offset = queryBuilder._offset;
            }

            const result = await this.request<unknown>("GET", `/${table}`, undefined, { params });

            if (queryBuilder._single || queryBuilder._maybeSingle) {
              const singleData = result.data?.[0] ?? null;
              resolve({
                data: singleData !== null ? [singleData] : null,
                error: queryBuilder._maybeSingle && singleData === null ? null : result.error,
                count: null,
              });
            } else {
              resolve(result);
            }
          },
        };

        return queryBuilder;
      },

      insert: (data: unknown | unknown[]) => {
        return {
          select: (columns: string = "*") => {
            return {
              single: async () => {
                const result = await this.request<unknown>("POST", `/${table}`, data, {
                  params: { select: columns },
                });

                return {
                  data: result.data?.[0] ?? null,
                  error: result.error,
                  count: null,
                };
              },
            };
          },
        };
      },

      update: (data: unknown) => {
        return {
          eq: (column: string, value: unknown) => {
            return {
              select: (columns: string = "*") => {
                return {
                  single: async () => {
                    const result = await this.request<unknown>("PATCH", `/${table}`, data, {
                      params: { select: columns, [column]: value },
                    });

                    return {
                      data: result.data?.[0] ?? null,
                      error: result.error,
                      count: null,
                    };
                  },
                };
              },
            };
          },
        };
      },

      delete: () => {
        return {
          eq: (column: string, value: unknown) => {
            return {
              then: async () => {
                const result = await this.request<unknown>("DELETE", `/${table}`, undefined, {
                  params: { [column]: value },
                });

                return {
                  data: result.data,
                  error: result.error,
                  count: result.count,
                };
              },
            };
          },
        };
      },
    };
  }

  // ============================================================
  // 实时订阅
  // ============================================================

  private connectWebSocket(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${this.config.realtimeUrl}/realtime/v1/websocket?apikey=${this.config.anonKey}`;
      this.wsConnection = new WebSocket(wsUrl);

      this.wsConnection.onopen = () => {
        this.retryCount = 0;
        this.sendHeartbeat();
      };

      this.wsConnection.onmessage = (event) => {
        try {
          const message: RealtimeMessage = JSON.parse(event.data);
          const { topic } = message;

          if (topic.startsWith("realtime:")) {
            return;
          }

          const callbacks = this.wsSubscriptions.get(topic);
          if (callbacks) {
            callbacks.forEach((callback) => {
              try {
                callback(message);
              } catch {}
            });
          }
        } catch {}
      };

      this.wsConnection.onerror = () => {
        this.handleWebSocketError();
      };

      this.wsConnection.onclose = () => {
        this.handleWebSocketClose();
      };
    } catch (_error) {
      this.handleWebSocketError();
    }
  }

  private sendHeartbeat(): void {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({ event: "heartbeat", topic: "phoenix" }));
      setTimeout(() => this.sendHeartbeat(), 30000);
    }
  }

  private handleWebSocketError(): void {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.connectWebSocket();
      }, this.retryDelay * this.retryCount);
    }
  }

  private handleWebSocketClose(): void {
    setTimeout(() => {
      this.connectWebSocket();
    }, this.retryDelay);
  }

  channel(_channelName: string) {
    return {
      on: (
        event: string,
        config: { schema: string; table: string; filter?: string },
        callback: (payload: RealtimeMessage) => void
      ) => {
        this.connectWebSocket();

        const topic = `realtime:${config.schema}:${config.table}`;
        
        if (!this.wsSubscriptions.has(topic)) {
          this.wsSubscriptions.set(topic, new Set());
        }

        this.wsSubscriptions.get(topic)!.add(callback);

        if (this.wsConnection?.readyState === WebSocket.OPEN) {
          this.wsConnection.send(
            JSON.stringify({
              event: "phx_join",
              topic,
              payload: {
                config: {
                  broadcast: { self: true },
                  postgres_changes: [
                    {
                      event,
                      schema: config.schema,
                      table: config.table,
                      filter: config.filter,
                    },
                  ],
                },
              },
              ref: `0`,
            })
          );
        }

        return {
          subscribe: () => ({
            data: {
              subscription: {
                unsubscribe: () => {
                  const callbacks = this.wsSubscriptions.get(topic);
                  if (callbacks) {
                    callbacks.delete(callback);
                    if (callbacks.size === 0) {
                      this.wsSubscriptions.delete(topic);
                      if (this.wsConnection?.readyState === WebSocket.OPEN) {
                        this.wsConnection.send(
                          JSON.stringify({
                            event: "phx_leave",
                            topic,
                            ref: `0`,
                          })
                        );
                      }
                    }
                  }
                },
              },
            },
          }),
        };
      },
    };
  }

  // ============================================================
  // 存储操作
  // ============================================================

  async uploadFile(
    bucket: string,
    path: string,
    file: File,
    options: { upsert?: boolean; contentType?: string } = {}
  ): Promise<AuthResponse<{ path: string }>> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const url = new URL(`${this.config.storageUrl}/object/${bucket}/${path}`);
      if (options.upsert) {
        url.searchParams.append("upsert", "true");
      }

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "apikey": this.config.anonKey,
          "Authorization": `Bearer ${this.session?.access_token || this.config.anonKey}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          data: null,
          error: {
            message: data.message || "Upload failed",
            status: response.status,
          },
        };
      }

      return { data: { path: data.Key || path }, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }

  async getPublicUrl(bucket: string, path: string): Promise<string> {
    return `${this.config.storageUrl}/object/public/${bucket}/${path}`;
  }

  async deleteFile(bucket: string, path: string): Promise<AuthResponse<null>> {
    try {
      const response = await fetch(`${this.config.storageUrl}/object/${bucket}/${path}`, {
        method: "DELETE",
        headers: {
          "apikey": this.config.anonKey,
          "Authorization": `Bearer ${this.session?.access_token || this.config.anonKey}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        return {
          data: null,
          error: {
            message: data.message || "Delete failed",
            status: response.status,
          },
        };
      }

      return { data: null, error: null };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Network error",
        },
      };
    }
  }
}

// ============================================================
// 工厂函数
// ============================================================

let nativeClientInstance: NativeSupabaseClient | null = null;

export function createNativeSupabaseClient(config: SupabaseConfig): NativeSupabaseClient {
  if (!nativeClientInstance) {
    nativeClientInstance = new NativeSupabaseClient(config);
  }
  return nativeClientInstance;
}

export function getNativeSupabaseClient(): NativeSupabaseClient | null {
  return nativeClientInstance;
}
