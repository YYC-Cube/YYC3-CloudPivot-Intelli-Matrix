/**
 * useAIDiagnostics.ts
 * ====================
 * Hook for AI-Assisted Diagnostics Module
 * Pattern recognition, anomaly analysis, auto-generated solutions
 */

import { useState, useCallback, useRef, useEffect } from "react";

// ============================================================
// Types
// ============================================================

export type DiagnosticStatus = "idle" | "analyzing" | "complete" | "error";
export type PatternType = "recurring" | "gradual" | "spike" | "correlation" | "seasonal";
export type ConfidenceLevel = "high" | "medium" | "low";
export type ActionPriority = "urgent" | "recommended" | "optional";

export interface DetectedPattern {
  id: string;
  type: PatternType;
  title: string;
  description: string;
  confidence: ConfidenceLevel;
  affectedNodes: string[];
  detectedAt: number;
  dataPoints: number[];
  metric: string;
  severity: "critical" | "warning" | "info";
}

export interface AnomalyRecord {
  id: string;
  timestamp: number;
  nodeId: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  rootCause: string;
  relatedPatternId?: string;
}

export interface SuggestedAction {
  id: string;
  priority: ActionPriority;
  title: string;
  description: string;
  estimatedImpact: string;
  confidence: ConfidenceLevel;
  steps: string[];
  autoExecutable: boolean;
  relatedPatternId: string;
}

export interface PredictiveForecast {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  trend: "up" | "down" | "stable";
  riskLevel: "safe" | "warning" | "danger";
  explanation: string;
}

export interface DiagnosticSession {
  id: string;
  startedAt: number;
  completedAt: number | null;
  status: DiagnosticStatus;
  patterns: DetectedPattern[];
  anomalies: AnomalyRecord[];
  actions: SuggestedAction[];
  forecasts: PredictiveForecast[];
  summary: string;
}

export interface WsNodeSnapshot {
  id: string;
  gpu: number;
  mem: number;
  temp: number;
  status: string;
}

export interface DiagnosticsOptions {
  liveNodes?: WsNodeSnapshot[];
  liveQPS?: number;
  liveLatency?: number;
}

export type DiagnosticView = "patterns" | "anomalies" | "actions" | "forecasts";

// ============================================================
// Mock data generators
// ============================================================

const PATTERN_TYPES: PatternType[] = ["recurring", "gradual", "spike", "correlation", "seasonal"];
const NODE_IDS = ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03", "GPU-A100-04", "GPU-A100-05", "GPU-A100-06"];
const METRICS = ["gpu_utilization", "memory_usage", "inference_latency", "temperature", "throughput"];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generatePatterns(opts: DiagnosticsOptions): DetectedPattern[] {
  const now = Date.now();
  const count = 3 + Math.floor(Math.random() * 3);
  return Array.from({ length: count }, (_, i) => {
    const type = PATTERN_TYPES[i % PATTERN_TYPES.length];
    const node = opts.liveNodes?.[i % (opts.liveNodes.length || 1)];
    const nodeId = node?.id ?? randomFrom(NODE_IDS);
    const metric = randomFrom(METRICS);
    const gpu = node?.gpu ?? 50 + Math.random() * 40;
    return {
      id: `pat-${uid()}`,
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} pattern in ${metric}`,
      description: `Detected ${type} pattern on ${nodeId} — ${metric} shows anomalous behaviour over the last 30 minutes.`,
      confidence: gpu > 85 ? "high" : gpu > 60 ? "medium" : "low",
      affectedNodes: [nodeId],
      detectedAt: now - Math.floor(Math.random() * 3600000),
      dataPoints: Array.from({ length: 12 }, () => Math.round(40 + Math.random() * 55)),
      metric,
      severity: gpu > 85 ? "critical" : gpu > 60 ? "warning" : "info",
    } as DetectedPattern;
  });
}

function generateAnomalies(opts: DiagnosticsOptions, patterns: DetectedPattern[]): AnomalyRecord[] {
  const now = Date.now();
  return (opts.liveNodes ?? NODE_IDS.slice(0, 3).map((id) => ({ id, gpu: 70, mem: 60, temp: 65, status: "online" }))).map((n, i) => ({
    id: `ano-${uid()}`,
    timestamp: now - Math.floor(Math.random() * 1800000),
    nodeId: n.id,
    metric: randomFrom(METRICS),
    expectedValue: 50 + Math.random() * 20,
    actualValue: n.gpu ?? 80 + Math.random() * 15,
    deviation: 15 + Math.random() * 35,
    rootCause: `Elevated load on ${n.id} due to concurrent inference tasks`,
    relatedPatternId: patterns[i % patterns.length]?.id,
  }));
}

function generateActions(patterns: DetectedPattern[]): SuggestedAction[] {
  const templates: { title: string; desc: string; steps: string[]; auto: boolean }[] = [
    { title: "Migrate workload", desc: "Move inference tasks to a lower-utilized node", steps: ["Identify target node", "Pause incoming requests", "Transfer model weights", "Resume on new node"], auto: true },
    { title: "Restart inference service", desc: "Clear memory and restart the inference daemon", steps: ["Graceful shutdown", "Clear GPU memory cache", "Restart service", "Verify health"], auto: true },
    { title: "Enable dynamic load balancing", desc: "Activate auto-scaling rules for affected nodes", steps: ["Review current rules", "Set threshold parameters", "Enable auto-scaling", "Monitor for 15 min"], auto: false },
    { title: "Scale up node pool", desc: "Add additional GPU nodes to handle peak load", steps: ["Check available resources", "Provision new node", "Deploy model", "Join cluster"], auto: false },
    { title: "Adjust batch size", desc: "Reduce inference batch size to lower latency", steps: ["Analyze current batch config", "Calculate optimal size", "Apply configuration", "Validate latency improvement"], auto: true },
  ];
  return templates.map((tpl, i) => ({
    id: `act-${uid()}`,
    priority: i < 2 ? "urgent" : i < 4 ? "recommended" : "optional",
    title: tpl.title,
    description: tpl.desc,
    estimatedImpact: `${15 + Math.floor(Math.random() * 30)}% improvement`,
    confidence: i < 2 ? "high" : "medium",
    steps: tpl.steps,
    autoExecutable: tpl.auto,
    relatedPatternId: patterns[i % patterns.length]?.id ?? "",
  }));
}

function generateForecasts(opts: DiagnosticsOptions): PredictiveForecast[] {
  const qps = opts.liveQPS ?? 1200;
  const lat = opts.liveLatency ?? 45;
  return [
    { metric: "GPU Utilization", currentValue: 78, predictedValue: 89, timeframe: "Next 2 hours", trend: "up", riskLevel: "warning", explanation: "Based on current workload growth rate, GPU utilization will approach critical threshold." },
    { metric: "QPS (Queries/sec)", currentValue: qps, predictedValue: Math.round(qps * 1.15), timeframe: "Next 1 hour", trend: "up", riskLevel: "safe", explanation: "Query volume is trending upward but remains within safe capacity." },
    { metric: "Inference Latency", currentValue: lat, predictedValue: Math.round(lat * 1.4), timeframe: "Next 30 min", trend: "up", riskLevel: lat > 80 ? "danger" : "warning", explanation: "Latency increase correlated with rising GPU memory pressure." },
    { metric: "Memory Usage", currentValue: 72, predictedValue: 85, timeframe: "Next 3 hours", trend: "up", riskLevel: "warning", explanation: "Gradual memory growth detected; consider clearing caches before threshold." },
    { metric: "Temperature", currentValue: 68, predictedValue: 64, timeframe: "Next 1 hour", trend: "down", riskLevel: "safe", explanation: "Cooling systems are effective; temperature trending downward." },
  ];
}

export function useAIDiagnostics(opts: DiagnosticsOptions = {}) {
  const [status, setStatus] = useState<DiagnosticStatus>("idle");
  const [session, setSession] = useState<DiagnosticSession | null>(null);
  const [history, setHistory] = useState<DiagnosticSession[]>([]);
  const [activeView, setActiveView] = useState<DiagnosticView>("patterns");
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {clearTimeout(timerRef.current);}
    };
  }, []);

  const startDiagnosis = useCallback(() => {
    setStatus("analyzing");
    setSession(null);

    timerRef.current = setTimeout(() => {
      const patterns = generatePatterns(opts);
      const anomalies = generateAnomalies(opts, patterns);
      const actions = generateActions(patterns);
      const forecasts = generateForecasts(opts);

      const newSession: DiagnosticSession = {
        id: `diag-${uid()}`,
        startedAt: Date.now() - 2500,
        completedAt: Date.now(),
        status: "complete",
        patterns,
        anomalies,
        actions,
        forecasts,
        summary: `Detected ${patterns.length} patterns, ${anomalies.length} anomalies across ${new Set(anomalies.map((a) => a.nodeId)).size} nodes. ${actions.filter((a) => a.priority === "urgent").length} urgent actions recommended.`,
      };

      setSession(newSession);
      setHistory((prev) => [newSession, ...prev].slice(0, 20));
      setStatus("complete");
    }, 1800);
  }, [opts]);

  const executeAction = useCallback((actionId: string) => {
    setExecutingAction(actionId);
    setTimeout(() => {
      setExecutingAction(null);
      setSession((prev) => {
        if (!prev) {return prev;}
        return {
          ...prev,
          actions: prev.actions.map((a) =>
            a.id === actionId ? { ...a, priority: "optional" as const, title: `✓ ${a.title}` } : a
          ),
        };
      });
    }, 2000);
  }, []);

  return {
    status,
    session,
    history,
    activeView,
    setActiveView,
    executingAction,
    startDiagnosis,
    executeAction,
  };
}
