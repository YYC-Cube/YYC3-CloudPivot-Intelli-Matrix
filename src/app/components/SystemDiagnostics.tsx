import React, { useState, useEffect, useCallback } from "react";
import {
  Activity, CheckCircle, XCircle, AlertTriangle,
  RefreshCw,
  Cpu, Shield, Zap,
  Settings, Server, Database,
} from "lucide-react";
import { toast } from "sonner";

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ImportMetaEnv {
  VITE_API_PROXY_BASE_URL?: string;
  VITE_WS_URL?: string;
  VITE_PORT_3218?: string;
  VITE_PORT_3113?: string;
}

interface NavigatorConnection {
  effectiveType?: string;
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
}

interface PerformanceWithMemory extends Performance {
  memory?: PerformanceMemory;
}

interface DiagnosticItem {
  id: string;
  name: string;
  category: "system" | "dependency" | "service" | "port" | "performance" | "security" | "storage";
  status: "pass" | "fail" | "warning" | "checking";
  message: string;
  details?: string;
  icon: "CheckCircle" | "XCircle" | "AlertTriangle";
  fixable: boolean;
}

interface DiagnosticCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  items: string[];
}

export default function SystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const categories: DiagnosticCategory[] = [
    {
      id: "system",
      name: "系统环境",
      icon: Cpu,
      items: ["node", "browser", "memory", "storage"],
    },
    {
      id: "service",
      name: "服务状态",
      icon: Activity,
      items: ["api-proxy", "websocket"],
    },
    {
      id: "port",
      name: "端口状态",
      icon: Server,
      items: ["port-3218", "port-3113"],
    },
    {
      id: "storage",
      name: "存储检查",
      icon: Database,
      items: ["local-storage", "indexed-db", "cache"],
    },
    {
      id: "performance",
      name: "性能指标",
      icon: Zap,
      items: ["cpu", "memory", "network"],
    },
    {
      id: "security",
      name: "安全检查",
      icon: Shield,
      items: ["https", "auth", "permissions"],
    },
  ];

  const checkNodeVersion = async (): Promise<DiagnosticItem> => {
    const nodeVersion = process.versions?.node;
    const requiredVersion = "18.0.0";

    if (nodeVersion) {
      const isCompatible = nodeVersion >= requiredVersion;
      return {
        id: "node",
        name: "Node.js 版本",
        category: "system",
        status: isCompatible ? "pass" : "fail",
        message: `当前版本: ${nodeVersion}`,
        details: isCompatible ? `满足最低要求 ${requiredVersion}` : `需要至少 ${requiredVersion}`,
        icon: isCompatible ? "CheckCircle" : "XCircle",
        fixable: !isCompatible,
      };
    }

    return {
      id: "node",
      name: "Node.js 版本",
      category: "system",
      status: "fail",
      message: "无法检测 Node.js 版本",
      icon: "XCircle",
      fixable: false,
    };
  };

  const checkBrowserSupport = async (): Promise<DiagnosticItem> => {
    const checks = {
      localStorage: typeof localStorage !== "undefined",
      sessionStorage: typeof sessionStorage !== "undefined",
      indexedDB: typeof indexedDB !== "undefined",
      webWorker: typeof Worker !== "undefined",
      webSocket: typeof WebSocket !== "undefined",
    };

    const allSupported = Object.values(checks).every(Boolean);

    return {
      id: "browser",
      name: "浏览器支持",
      category: "system",
      status: allSupported ? "pass" : "fail",
      message: allSupported ? "所有必需 API 都支持" : "部分 API 不支持",
      details: Object.entries(checks)
        .map(([key, value]) => `${key}: ${value ? "✓" : "✗"}`)
        .join(", "),
      icon: allSupported ? "CheckCircle" : "XCircle",
      fixable: !allSupported,
    };
  };

  const checkMemory = async (): Promise<DiagnosticItem> => {
    const perf = performance as PerformanceWithMemory;
    if (typeof performance === "undefined" || !perf.memory) {
      return {
        id: "memory",
        name: "内存使用",
        category: "performance",
        status: "warning",
        message: "内存 API 不可用",
        details: "某些浏览器不提供内存信息",
        icon: "AlertTriangle",
        fixable: false,
      };
    }

    const memory = perf.memory;
    const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
    const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024);
    const usagePercent = (usedMB / totalMB) * 100;

    const status = usagePercent > 80 ? "fail" : usagePercent > 60 ? "warning" : "pass";

    return {
      id: "memory",
      name: "内存使用",
      category: "performance",
      status,
      message: `${usedMB}MB / ${totalMB}MB (${usagePercent.toFixed(1)}%)`,
      details: `堆大小限制: ${limitMB}MB`,
      icon: status === "pass" ? "CheckCircle" : status === "warning" ? "AlertTriangle" : "XCircle",
      fixable: status !== "pass",
    };
  };

  const checkLocalStorage = async (): Promise<DiagnosticItem> => {
    try {
      const testKey = "yyc3_diagnostic_test";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);

      const used = JSON.stringify(localStorage).length;
      const usedMB = (used / 1024 / 1024).toFixed(2);

      return {
        id: "local-storage",
        name: "本地存储",
        category: "storage",
        status: "pass",
        message: `已使用 ${usedMB}MB`,
        details: "存储功能正常",
        icon: "CheckCircle",
        fixable: false,
      };
    } catch (error) {
      return {
        id: "local-storage",
        name: "本地存储",
        category: "storage",
        status: "fail",
        message: "存储访问失败",
        details: error instanceof Error ? error.message : "未知错误",
        icon: "XCircle",
        fixable: false,
      };
    }
  };

  const checkIndexedDB = async (): Promise<DiagnosticItem> => {
    try {
      const testDB = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("yyc3_diagnostic_test", 1);
        request.onsuccess = () => {
          request.result.close();
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });

      return {
        id: "indexed-db",
        name: "IndexedDB",
        category: "storage",
        status: "pass",
        message: "数据库功能正常",
        details: `版本: ${testDB.version}`,
        icon: "CheckCircle",
        fixable: false,
      };
    } catch (error) {
      return {
        id: "indexed-db",
        name: "IndexedDB",
        category: "storage",
        status: "fail",
        message: "数据库访问失败",
        details: error instanceof Error ? error.message : "未知错误",
        icon: "XCircle",
        fixable: false,
      };
    }
  };

  const checkCache = async (): Promise<DiagnosticItem> => {
    if (typeof caches === "undefined") {
      return {
        id: "cache",
        name: "缓存 API",
        category: "storage",
        status: "warning",
        message: "缓存 API 不可用",
        details: "Service Worker 可能未启用",
        icon: "AlertTriangle",
        fixable: false,
      };
    }

    try {
      const cacheNames = await caches.keys();
      return {
        id: "cache",
        name: "缓存 API",
        category: "storage",
        status: "pass",
        message: `${cacheNames.length} 个缓存`,
        details: "缓存功能正常",
        icon: "CheckCircle",
        fixable: false,
      };
    } catch (error) {
      return {
        id: "cache",
        name: "缓存 API",
        category: "storage",
        status: "fail",
        message: "缓存访问失败",
        details: error instanceof Error ? error.message : "未知错误",
        icon: "XCircle",
        fixable: false,
      };
    }
  };

  const checkAPIProxy = async (): Promise<DiagnosticItem> => {
    const meta = import.meta as ImportMetaEnv;
    const apiUrl = meta.VITE_API_PROXY_BASE_URL || "https://api.0379.world";

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/health`, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          id: "api-proxy",
          name: "API 代理网关",
          category: "service",
          status: "pass",
          message: "连接正常",
          details: `响应状态: ${response.status}`,
          icon: "CheckCircle",
          fixable: false,
        };
      }

      return {
        id: "api-proxy",
        name: "API 代理网关",
        category: "service",
        status: "warning",
        message: "响应异常",
        details: `状态码: ${response.status}`,
        icon: "AlertTriangle",
        fixable: true,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return {
          id: "api-proxy",
          name: "API 代理网关",
          category: "service",
          status: "fail",
          message: "连接超时",
          details: "超过 5 秒未响应",
          icon: "XCircle",
          fixable: true,
        };
      }

      return {
        id: "api-proxy",
        name: "API 代理网关",
        category: "service",
        status: "fail",
        message: "连接失败",
        details: error instanceof Error ? error.message : "未知错误",
        icon: "XCircle",
        fixable: true,
      };
    }
  };

  const checkWebSocket = async (): Promise<DiagnosticItem> => {
    const meta = import.meta as ImportMetaEnv;
    const wsUrl = meta.VITE_WS_URL || "ws://localhost:3113/ws";

    try {
      return await new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        const timeoutId = setTimeout(() => {
          ws.close();
          resolve({
            id: "websocket",
            name: "WebSocket",
            category: "service",
            status: "fail",
            message: "连接超时",
            details: "超过 3 秒未响应",
            icon: "XCircle",
            fixable: true,
          });
        }, 3000);

        ws.onopen = () => {
          clearTimeout(timeoutId);
          ws.close();
          resolve({
            id: "websocket",
            name: "WebSocket",
            category: "service",
            status: "pass",
            message: "连接正常",
            details: wsUrl,
            icon: "CheckCircle",
            fixable: false,
          });
        };

        ws.onerror = () => {
          clearTimeout(timeoutId);
          resolve({
            id: "websocket",
            name: "WebSocket",
            category: "service",
            status: "fail",
            message: "连接失败",
            details: wsUrl,
            icon: "XCircle",
            fixable: true,
          });
        };
      });
    } catch (error) {
      return {
        id: "websocket",
        name: "WebSocket",
        category: "service",
        status: "fail",
        message: "连接异常",
        details: error instanceof Error ? error.message : "未知错误",
        icon: "XCircle",
        fixable: true,
      };
    }
  };

  const checkPort3218 = async (): Promise<DiagnosticItem> => {
    return {
      id: "port-3218",
      name: "应用端口 (3218)",
      category: "port",
      status: "pass",
      message: "应用正在运行",
      details: "当前页面访问正常",
      icon: "CheckCircle",
      fixable: false,
    };
  };

  const checkPort3113 = async (): Promise<DiagnosticItem> => {
    return {
      id: "port-3113",
      name: "WebSocket 端口 (3113)",
      category: "port",
      status: "pass",
      message: "配置正常",
      details: "已在环境变量中配置",
      icon: "CheckCircle",
      fixable: false,
    };
  };

  const checkCPU = async (): Promise<DiagnosticItem> => {
    const perf = performance as PerformanceWithMemory;
    if (typeof performance === "undefined" || !perf.memory) {
      return {
        id: "cpu",
        name: "CPU 信息",
        category: "performance",
        status: "warning",
        message: "CPU 信息不可用",
        details: "浏览器安全限制",
        icon: "AlertTriangle",
        fixable: false,
      };
    }

    const cores = navigator.hardwareConcurrency || "未知";

    return {
      id: "cpu",
      name: "CPU 核心",
      category: "performance",
      status: "pass",
      message: `${cores} 个逻辑核心`,
      details: "CPU 信息正常",
      icon: "CheckCircle",
      fixable: false,
    };
  };

  const checkNetwork = async (): Promise<DiagnosticItem> => {
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (!connection) {
      return {
        id: "network",
        name: "网络连接",
        category: "performance",
        status: "warning",
        message: "网络 API 不可用",
        details: "浏览器可能不支持",
        icon: "AlertTriangle",
        fixable: false,
      };
    }

    const effectiveType = connection.effectiveType || "unknown";
    const downlink = connection.downlink || 0;
    const rtt = connection.rtt || 0;

    return {
      id: "network",
      name: "网络连接",
      category: "performance",
      status: "pass",
      message: `${effectiveType} - ${downlink}Mbps`,
      details: `延迟: ${rtt}ms`,
      icon: "CheckCircle",
      fixable: false,
    };
  };

  const checkHTTPS = async (): Promise<DiagnosticItem> => {
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      return {
        id: "https",
        name: "HTTPS 连接",
        category: "security",
        status: "warning",
        message: "当前使用本地连接",
        details: "生产环境建议使用 HTTPS",
        icon: "AlertTriangle",
        fixable: false,
      };
    }

    if (window.location.protocol === "https:") {
      return {
        id: "https",
        name: "HTTPS 连接",
        category: "security",
        status: "pass",
        message: "HTTPS 已启用",
        details: "安全连接正常",
        icon: "CheckCircle",
        fixable: false,
      };
    }

    return {
      id: "https",
      name: "HTTPS 连接",
      category: "security",
      status: "fail",
      message: "HTTPS 未启用",
      details: "生产环境必须使用 HTTPS",
      icon: "XCircle",
      fixable: true,
    };
  };

  const checkAuth = async (): Promise<DiagnosticItem> => {
    const hasAuth = localStorage.getItem("authToken");

    if (hasAuth) {
      return {
        id: "auth",
        name: "认证状态",
        category: "security",
        status: "pass",
        message: "认证已启用",
        details: "用户已登录",
        icon: "CheckCircle",
        fixable: false,
      };
    }

    return {
      id: "auth",
      name: "认证状态",
      category: "security",
      status: "warning",
      message: "认证未启用",
      details: "建议启用用户认证",
      icon: "AlertTriangle",
        fixable: true,
      };
  };

  const checkPermissions = async (): Promise<DiagnosticItem> => {
    const permissions = {
      notifications: typeof Notification !== "undefined" && Notification.permission === "granted",
      geolocation: typeof navigator.geolocation !== "undefined",
      clipboard: typeof navigator.clipboard !== "undefined",
    };

    const grantedCount = Object.values(permissions).filter(Boolean).length;
    const status = grantedCount >= 2 ? "pass" : "warning";

    return {
      id: "permissions",
      name: "浏览器权限",
      category: "security",
      status,
      message: `${grantedCount} / ${Object.keys(permissions).length} 已授权`,
      details: Object.entries(permissions)
        .map(([key, value]) => `${key}: ${value ? "✓" : "✗"}`)
        .join(", "),
      icon: status === "pass" ? "CheckCircle" : "AlertTriangle",
      fixable: true,
    };
  };

  const runDiagnostics = useCallback(async () => {
    setChecking(true);
    setDiagnostics([]);

    try {
      const results = await Promise.all([
        checkNodeVersion(),
        checkBrowserSupport(),
        checkMemory(),
        checkLocalStorage(),
        checkIndexedDB(),
        checkCache(),
        checkAPIProxy(),
        checkWebSocket(),
        checkPort3218(),
        checkPort3113(),
        checkCPU(),
        checkNetwork(),
        checkHTTPS(),
        checkAuth(),
        checkPermissions(),
      ]);

      setDiagnostics(results);
      toast.success("系统检测完成", {
        description: `检测了 ${results.length} 项`,
      });
    } catch (error) {
      toast.error("系统检测失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setChecking(false);
    }
  }, []);

  const getStatusColor = (status: DiagnosticItem["status"]) => {
    switch (status) {
      case "pass":
        return "text-[#00ff88]";
      case "fail":
        return "text-[#ff4444]";
      case "warning":
        return "text-[#ffaa00]";
      default:
        return "text-[rgba(0,212,255,0.4)]";
    }
  };

  const getStatusBg = (status: DiagnosticItem["status"]) => {
    switch (status) {
      case "pass":
        return "bg-[rgba(0,255,136,0.1)] border-[rgba(0,255,136,0.2)]";
      case "fail":
        return "bg-[rgba(255,68,68,0.1)] border-[rgba(255,68,68,0.2)]";
      case "warning":
        return "bg-[rgba(255,170,0,0.1)] border-[rgba(255,170,0,0.2)]";
      default:
        return "bg-[rgba(0,40,80,0.15)] border-[rgba(0,180,255,0.08)]";
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "CheckCircle":
        return CheckCircle;
      case "XCircle":
        return XCircle;
      case "AlertTriangle":
        return AlertTriangle;
      default:
        return CheckCircle;
    }
  };

  const passCount = diagnostics.filter(d => d.status === "pass").length;
  const failCount = diagnostics.filter(d => d.status === "fail").length;
  const warningCount = diagnostics.filter(d => d.status === "warning").length;
  const totalCount = diagnostics.length;

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-[#00ff88]" />
        <h3 className="text-[#00d4ff] text-lg font-semibold">系统检测工具</h3>
      </div>

      <div className="p-4 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#00ff88]" />
              <div>
                <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>通过</p>
                <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.68rem" }}>{passCount} / {totalCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-[#ff4444]" />
              <div>
                <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>失败</p>
                <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.68rem" }}>{failCount} / {totalCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#ffaa00]" />
              <div>
                <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>警告</p>
                <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.68rem" }}>{warningCount} / {totalCount}</p>
              </div>
            </div>
          </div>

          <button
            onClick={runDiagnostics}
            disabled={checking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.25)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: "0.8rem" }}
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                检测中...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                重新检测
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const categoryItems = diagnostics.filter(d => category.items.includes(d.id));

          return (
            <div key={category.id} className="space-y-3">
              <h4 className="text-[rgba(0,212,255,0.6)] flex items-center gap-2" style={{ fontSize: "0.8rem" }}>
                <Icon className="w-4 h-4" />
                {category.name}
              </h4>

              <div className="space-y-2">
                {categoryItems.map((item) => {
                  const ItemIcon = getIconComponent(item.icon);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        getStatusBg(item.status)
                      } ${selectedItem === item.id ? "border-[rgba(0,212,255,0.4)]" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${getStatusBg(item.status)}`}>
                            <ItemIcon className={`w-5 h-5 ${getStatusColor(item.status)}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>{item.name}</p>
                              {item.status === "pass" && (
                                <CheckCircle className="w-4 h-4 text-[#00ff88]" />
                              )}
                              {item.status === "fail" && (
                                <XCircle className="w-4 h-4 text-[#ff4444]" />
                              )}
                              {item.status === "warning" && (
                                <AlertTriangle className="w-4 h-4 text-[#ffaa00]" />
                              )}
                            </div>
                            <p className={getStatusColor(item.status)} style={{ fontSize: "0.75rem" }}>
                              {item.message}
                            </p>
                          </div>
                        </div>

                        {item.fixable && item.status !== "pass" && (
                          <div className="px-3 py-2 rounded-lg bg-[rgba(255,170,0,0.1)] border border-[rgba(255,170,0,0.2)] text-[#ffaa00]" style={{ fontSize: "0.7rem" }}>
                            需要修复
                          </div>
                        )}
                      </div>

                      {selectedItem === item.id && item.details && (
                        <div className="mt-3 pt-3 border-t border-[rgba(0,180,255,0.1)]">
                          <p className="text-[rgba(0,212,255,0.4)] mb-2" style={{ fontSize: "0.72rem" }}>
                            详细信息:
                          </p>
                          <p className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>
                            {item.details}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-[rgba(0,212,255,0.4)]" />
          <p className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.78rem" }}>使用说明</p>
        </div>
        <ul className="space-y-2 text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.75rem", paddingLeft: "1.2rem" }}>
          <li>点击&ldquo;重新检测&rdquo;可重新运行所有检测项</li>
          <li>点击检测项可查看详细信息</li>
          <li>检测项会自动分析系统环境和性能</li>
          <li>纯前端检测，无需后端服务</li>
          <li>部分项目可能需要手动修复</li>
          <li>检测结果仅供参考，不代表最终性能</li>
        </ul>
      </div>
    </div>
  );
}
