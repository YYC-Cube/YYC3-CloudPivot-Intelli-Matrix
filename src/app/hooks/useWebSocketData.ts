/**
 * useWebSocketData.ts
 * =====================
 * YYC³ CloudPivot Intelli-Matrix - WebSocket 实时数据推送
 *
 * 功能：
 * - WebSocket 连接管理（生命周期、自动重连、心跳）
 * - 消息类型路由（qps_update / latency_update / node_status / alert）
 * - 断线降级：自动切换本地模拟数据
 * - 节流控制：100ms UI 更新节流
 *
 * 架构：
 * WebSocket Server (ws://localhost:3113/ws)
 *   ↓ 连接失败
 * Simulated Data Generator (本地模拟)
 *   ↓
 * Throttled State Updates (100ms 节流)
 *   ↓
 * React Components
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// 类型定义 — 从全局类型中心导入
// ============================================================

import type {
  ConnectionState,
  NodeData,
  AlertData,
  ThroughputPoint,
  WSMessage,
  WebSocketDataState,
} from "../types";

// Re-export for backward compatibility
export type { ConnectionState, NodeData, AlertData, ThroughputPoint, WebSocketDataState };

// ============================================================
// 配置常量
// ============================================================

const WS_URL = "ws://localhost:3113/ws";
const RECONNECT_INTERVAL = 5000;       // 5 秒重连间隔
const MAX_RECONNECT_ATTEMPTS = 10;     // 最大重连 10 次
const HEARTBEAT_INTERVAL = 30000;      // 30 秒心跳
const THROTTLE_INTERVAL = 100;         // 100ms UI 节流
const QPS_UPDATE_FREQ = 2000;          // 2 秒 QPS 更新频率
const NODE_UPDATE_FREQ = 5000;         // 5 秒节点状态更新频率

/** 预检测 WebSocket 服务是否可达（HTTP ping） */
async function _isWsServerReachable(): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 800);
    await fetch("http://localhost:3113/health", {
      method: "HEAD",
      mode: "no-cors",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return true;
  } catch {
    return false;
  }
}
// Silence unused function warning
void _isWsServerReachable;

// ============================================================
// 默认模拟数据
// ============================================================

const DEFAULT_NODES: NodeData[] = [
  { id: "GPU-A100-01", status: "active", gpu: 87, mem: 72, temp: 68, model: "LLaMA-70B", tasks: 128 },
  { id: "GPU-A100-02", status: "active", gpu: 92, mem: 85, temp: 74, model: "Qwen-72B", tasks: 156 },
  { id: "GPU-A100-03", status: "warning", gpu: 98, mem: 94, temp: 82, model: "DeepSeek-V3", tasks: 89 },
  { id: "GPU-H100-01", status: "active", gpu: 65, mem: 58, temp: 55, model: "GLM-4", tasks: 210 },
  { id: "GPU-H100-02", status: "active", gpu: 78, mem: 66, temp: 62, model: "Mixtral", tasks: 178 },
  { id: "GPU-H100-03", status: "inactive", gpu: 0, mem: 12, temp: 32, model: "-", tasks: 0 },
  { id: "TPU-v4-01", status: "active", gpu: 82, mem: 70, temp: 58, model: "LLaMA-70B", tasks: 95 },
  { id: "TPU-v4-02", status: "active", gpu: 55, mem: 48, temp: 50, model: "Qwen-72B", tasks: 134 },
];

const DEFAULT_THROUGHPUT: ThroughputPoint[] = [
  { time: "00:00", qps: 1200, latency: 28, tokens: 45000 },
  { time: "02:00", qps: 980, latency: 32, tokens: 38000 },
  { time: "04:00", qps: 650, latency: 22, tokens: 25000 },
  { time: "06:00", qps: 1100, latency: 30, tokens: 42000 },
  { time: "08:00", qps: 2800, latency: 45, tokens: 98000 },
  { time: "10:00", qps: 3500, latency: 52, tokens: 125000 },
  { time: "12:00", qps: 3200, latency: 48, tokens: 118000 },
  { time: "14:00", qps: 3800, latency: 55, tokens: 138000 },
  { time: "16:00", qps: 4200, latency: 62, tokens: 155000 },
  { time: "18:00", qps: 3600, latency: 50, tokens: 130000 },
  { time: "20:00", qps: 2800, latency: 42, tokens: 102000 },
  { time: "22:00", qps: 1800, latency: 35, tokens: 68000 },
];

// ============================================================
// 辅助函数
// ============================================================

/** 生成当前时间戳字符串 */
function nowTimestamp(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

/** 在范围内随机浮动 */
function jitter(value: number, range: number): number {
  return Math.max(0, value + Math.floor(Math.random() * range * 2 - range));
}

/** 节流函数 */
function createThrottle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    const now = Date.now();
    const remaining = ms - (now - lastCall);
    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now();
        timer = null;
        fn(...args);
      }, remaining);
    }
  }) as T;
}

// ============================================================
// Hook 实现
// ============================================================

export function useWebSocketData(): WebSocketDataState {
  // 连接状态
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");
  const [reconnectCount, setReconnectCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(nowTimestamp());

  // 实时数据
  const [liveQPS, setLiveQPS] = useState(3842);
  const [qpsTrend, setQpsTrend] = useState("+12.3%");
  const [liveLatency, setLiveLatency] = useState(48);
  const [latencyTrend, setLatencyTrend] = useState("-5.2%");

  // 系统指标
  const [activeNodes, setActiveNodes] = useState("7/8");
  const [gpuUtil, setGpuUtil] = useState("82.4%");
  const [tokenThroughput, setTokenThroughput] = useState("138K/s");
  const [storageUsed, setStorageUsed] = useState("12.8TB");

  // 节点 & 图表
  const [nodes, setNodes] = useState<NodeData[]>(DEFAULT_NODES);
  const [throughputHistory, setThroughputHistory] = useState<ThroughputPoint[]>(DEFAULT_THROUGHPUT);
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  // 引用
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const simulationTimersRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const reconnectCountRef = useRef(0);
  const mountedRef = useRef(true);

  // 节流更新函数
  const throttledSetQPS = useRef(createThrottle((val: number) => {
    if (mountedRef.current) {setLiveQPS(val);}
  }, THROTTLE_INTERVAL)).current;

  const throttledSetLatency = useRef(createThrottle((val: number) => {
    if (mountedRef.current) {setLiveLatency(val);}
  }, THROTTLE_INTERVAL)).current;

  // ----------------------------------------------------------
  // 模拟数据生成器（WebSocket 不可用时的降级方案）
  // ----------------------------------------------------------

  const startSimulation = useCallback(() => {
    // 清除旧定时器
    simulationTimersRef.current.forEach(clearInterval);
    simulationTimersRef.current = [];

    setConnectionState("simulated");

    let currentQPS = 3842;
    let currentLatency = 48;

    // QPS 模拟（2 秒频率）
    const qpsTimer = setInterval(() => {
      currentQPS = jitter(currentQPS, 80);
      currentQPS = Math.max(500, Math.min(6000, currentQPS));
      const trendPct = ((currentQPS - 3842) / 3842 * 100).toFixed(1);
      throttledSetQPS(currentQPS);
      if (mountedRef.current) {
        setQpsTrend(`${Number(trendPct) >= 0 ? "+" : ""}${trendPct}%`);
        setLastSyncTime(nowTimestamp());
      }
    }, QPS_UPDATE_FREQ);

    // 延迟模拟（2 秒频率）
    const latencyTimer = setInterval(() => {
      currentLatency = jitter(currentLatency, 5);
      currentLatency = Math.max(15, Math.min(120, currentLatency));
      const trendPct = ((currentLatency - 48) / 48 * 100).toFixed(1);
      throttledSetLatency(currentLatency);
      if (mountedRef.current) {
        setLatencyTrend(`${Number(trendPct) >= 0 ? "+" : ""}${trendPct}%`);
      }
    }, QPS_UPDATE_FREQ);

    // 节点状态模拟（5 秒频率）
    const nodeTimer = setInterval(() => {
      if (!mountedRef.current) {return;}
      setNodes(prev => prev.map(node => {
        if (node.status === "inactive") {return node;}
        return {
          ...node,
          gpu: Math.max(10, Math.min(100, jitter(node.gpu, 5))),
          mem: Math.max(10, Math.min(100, jitter(node.mem, 3))),
          temp: Math.max(30, Math.min(90, jitter(node.temp, 2))),
          tasks: Math.max(0, jitter(node.tasks, 8)),
          status: node.gpu > 95 ? "warning" : (node.status as NodeData["status"]),
        };
      }));
    }, NODE_UPDATE_FREQ);

    // 系统指标模拟（10 秒频率）
    const statsTimer = setInterval(() => {
      if (!mountedRef.current) {return;}
      const gpuVal = (75 + Math.random() * 15).toFixed(1);
      const tokenVal = (120 + Math.random() * 40).toFixed(0);
      setGpuUtil(`${gpuVal}%`);
      setTokenThroughput(`${tokenVal}K/s`);
    }, 10000);

    simulationTimersRef.current = [qpsTimer, latencyTimer, nodeTimer, statsTimer];
  }, [throttledSetQPS, throttledSetLatency]);

  const stopSimulation = useCallback(() => {
    simulationTimersRef.current.forEach(clearInterval);
    simulationTimersRef.current = [];
  }, []);

  // ----------------------------------------------------------
  // WebSocket 连接管理
  // ----------------------------------------------------------

  const startHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {clearInterval(heartbeatTimerRef.current);}
    heartbeatTimerRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "heartbeat" }));
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: WSMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "qps_update":
          throttledSetQPS(msg.payload.qps);
          setQpsTrend(msg.payload.trend);
          setLastSyncTime(nowTimestamp());
          break;

        case "latency_update":
          throttledSetLatency(msg.payload.latency);
          setLatencyTrend(msg.payload.trend);
          break;

        case "node_status":
          setNodes(msg.payload);
          break;

        case "alert":
          setAlerts(prev => [msg.payload, ...prev].slice(0, 50));
          break;

        case "throughput_history":
          setThroughputHistory(msg.payload);
          break;

        case "system_stats":
          setActiveNodes(msg.payload.activeNodes);
          setGpuUtil(msg.payload.gpuUtil);
          setTokenThroughput(msg.payload.tokenThroughput);
          setStorageUsed(msg.payload.storageUsed);
          break;

        case "heartbeat_ack":
          // 心跳确认，无需处理
          break;
      }
    } catch (err) {
      console.warn("[CP-IM WS] 消息解析失败:", err);
    }
  }, [throttledSetQPS, throttledSetLatency]);

  const connect = useCallback(() => {
    // 防止多次连接
    if (wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    setConnectionState("connecting");

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {return;}
        console.log("[CP-IM WS] 连接成功:", WS_URL);
        setConnectionState("connected");
        setReconnectCount(0);
        reconnectCountRef.current = 0;
        stopSimulation();
        startHeartbeat();

        // 请求初始数据
        ws.send(JSON.stringify({ type: "init", requestData: ["throughput_history", "node_status", "system_stats"] }));
      };

      ws.onmessage = handleMessage;

      ws.onclose = (event) => {
        if (!mountedRef.current) {return;}
        // 只在非异常关闭时输出日志（code 1000 = 正常关闭, 1006 = 异常断开）
        if (event.code !== 1006) {
          console.log("[CP-IM WS] 连接关闭:", event.code, event.reason);
        }
        stopHeartbeat();
        scheduleReconnect();
      };

      ws.onerror = (_error) => {
        if (!mountedRef.current) {return;}
        // 静默处理：onclose 会触发 scheduleReconnect
        ws.close();
      };
    } catch (err) {
      // WebSocket 构造失败（例如无效 URL）
      startSimulation();
    }
  }, [handleMessage, startHeartbeat, stopHeartbeat, startSimulation, stopSimulation]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      startSimulation();
      return;
    }

    setConnectionState("reconnecting");
    reconnectCountRef.current += 1;
    setReconnectCount(reconnectCountRef.current);

    reconnectTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {connect();}
    }, RECONNECT_INTERVAL);
  }, [connect, startSimulation]);

  const manualReconnect = useCallback(() => {
    // 手动重连：重置计数器
    reconnectCountRef.current = 0;
    setReconnectCount(0);
    stopSimulation();
    if (reconnectTimerRef.current) {clearTimeout(reconnectTimerRef.current);}
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    connect();
  }, [connect, stopSimulation]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // ----------------------------------------------------------
  // 生命周期
  // ----------------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    // 本地闭环环境：直接启动模拟模式，避免 WebSocket 连接错误噪音
    // 当真实 WS 服务可用时，用户可通过 manualReconnect() 手动连接
    startSimulation();

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {clearTimeout(reconnectTimerRef.current);}
      stopHeartbeat();
      stopSimulation();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    connectionState,
    reconnectCount,
    lastSyncTime,
    liveQPS,
    qpsTrend,
    liveLatency,
    latencyTrend,
    activeNodes,
    gpuUtil,
    tokenThroughput,
    storageUsed,
    nodes,
    throughputHistory,
    alerts,
    manualReconnect,
    clearAlerts,
  };
}