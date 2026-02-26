import {
  Settings, Server, Database, Shield, Bell, Cpu,
  ChevronRight, Save, RotateCcw,
  Monitor, Network, Key, Layers, Wifi,
  Globe, Terminal, Code, Download, Upload, Trash2, Plus, Edit2, Eye, EyeOff,
  RefreshCw, Clock, AlertTriangle, Sliders
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { NetworkConfig } from "./NetworkConfig";
import { YYC3Logo } from "./YYC3Logo";
import { useI18n } from "../hooks/useI18n";
import { toast } from "sonner";


import { useState } from 'react';
// ============================================================
// Settings sections config
// ============================================================

const settingsSections = [
  { id: "general", labelKey: "settings.general", icon: Settings },
  { id: "network", labelKey: "settings.network", icon: Globe },
  { id: "cluster", labelKey: "settings.cluster", icon: Server },
  { id: "model", labelKey: "settings.model", icon: Cpu },
  { id: "storage", labelKey: "settings.storage", icon: Database },
  { id: "websocket", labelKey: "settings.websocket", icon: Wifi },
  { id: "ai", labelKey: "settings.aiLlm", icon: Sliders },
  { id: "pwa", labelKey: "settings.pwaOffline", icon: Monitor },
  { id: "security", labelKey: "settings.security", icon: Shield },
  { id: "notification", labelKey: "settings.notification", icon: Bell },
  { id: "env", labelKey: "settings.envVars", icon: Terminal },
  { id: "advanced", labelKey: "settings.advanced", icon: Code },
];

// ============================================================
// Toggle component
// ============================================================

interface ToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
        enabled
          ? "bg-[rgba(0,212,255,0.3)] border border-[rgba(0,212,255,0.5)]"
          : "bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)]"
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all duration-300 ${
        enabled
          ? "left-[22px] bg-[#00d4ff] shadow-[0_0_10px_rgba(0,212,255,0.5)]"
          : "left-0.5 bg-[rgba(0,180,255,0.3)]"
      }`} />
    </button>
  );
}

// ============================================================
// Editable field component
// ============================================================

interface EditableFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (val: string) => void;
  type?: "text" | "number" | "password" | "url" | "email";
  placeholder?: string;
  mono?: boolean;
}

function EditableField({ label, description, value, onChange, type = "text", placeholder, mono }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  return (
    <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)] hover:border-[rgba(0,180,255,0.15)] transition-all">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>{label}</p>
        <button
          onClick={() => setEditing(!editing)}
          className={`p-1 rounded hover:bg-[rgba(0,212,255,0.1)] transition-all ${editing ? "text-[#00d4ff]" : "text-[rgba(0,212,255,0.3)]"}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
      </div>
      {description && (
        <p className="text-[rgba(0,212,255,0.35)] mb-2" style={{ fontSize: "0.68rem" }}>{description}</p>
      )}
      {editing ? (
        <div className="relative">
          <input
            type={type === "password" && !showPwd ? "password" : "text"}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] focus:outline-none focus:shadow-[0_0_10px_rgba(0,180,255,0.1)] ${mono ? "font-mono" : ""}`}
            style={{ fontSize: "0.8rem" }}
            autoFocus
          />
          {type === "password" && (
            <button
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgba(0,212,255,0.1)]"
            >
              {showPwd ? <EyeOff className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" /> : <Eye className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />}
            </button>
          )}
        </div>
      ) : (
        <span className={`text-[rgba(0,212,255,0.6)] ${mono ? "font-mono" : ""}`} style={{ fontSize: "0.78rem" }}>
          {type === "password" ? "••••••••" : (value || "-")}
        </span>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function SystemSettings() {
  const { t } = useI18n();
  const [activeSection, setActiveSection] = useState("general");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [networkConfigOpen, setNetworkConfigOpen] = useState(false);

  // Toggle settings
  const [settings, setSettings] = useState({
    autoScale: true,
    healthCheck: true,
    alertEmail: true,
    alertSlack: false,
    darkMode: true,
    autoBackup: true,
    mfa: true,
    auditLog: true,
    rateLimiting: true,
    cacheEnabled: true,
    wsAutoReconnect: true,
    wsHeartbeat: true,
    aiStreamMode: true,
    aiContextMemory: true,
    debugMode: false,
    performanceLog: true,
    autoUpdate: false,
    dataCompression: true,
    corsEnabled: true,
  });

  // Editable settings values
  const [values, setValues] = useState({
    systemName: "YYC³ CloudPivot Intelli-Matrix v3.2",
    clusterId: "CN-EAST-PROD-01",
    refreshInterval: "5",
    language: "zh-CN",
    timezone: "Asia/Shanghai",
    maxNodes: "16",
    loadBalanceStrategy: "轮询 (Round Robin)",
    healthCheckInterval: "30",
    scaleUpThreshold: "85",
    scaleDownThreshold: "30",
    wsEndpoint: "ws://localhost:3113/ws",
    wsReconnectInterval: "5000",
    wsMaxReconnect: "10",
    wsHeartbeatInterval: "30000",
    wsThrottleMs: "100",
    aiApiKey: "",
    aiBaseUrl: "https://api.openai.com/v1",
    aiModel: "gpt-4o",
    aiTemperature: "0.7",
    aiTopP: "0.9",
    aiMaxTokens: "2048",
    aiTimeout: "30000",
    dbHost: "localhost",
    dbPort: "5433",
    dbName: "cpim_matrix",
    dbUser: "yyc_admin",
    dbPassword: "••••••••",
    dbPoolSize: "20",
    sessionTimeout: "30",
    ipWhitelist: "192.168.1.0/24\n10.0.0.0/16\n172.16.0.0/12",
    alertGpuThreshold: "90",
    alertTempThreshold: "80",
    alertEmail: "admin@cloudpivot.ai",
    webhookUrl: "",
    backupSchedule: "0 2 * * *",
    logLevel: "info",
    logRetention: "30",
    maxConcurrency: "100",
    cacheSize: "512",
    cacheTTL: "3600",
  });

  const updateValue = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
    setHasChanges(true);
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    setHasChanges(false);
    toast.success(t("settings.saved"), {
      description: t("settings.savedDesc"),
      style: {
        background: "rgba(8, 25, 55, 0.95)",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        color: "#e0f0ff",
      },
    });
  };

  const handleReset = () => {
    setHasChanges(false);
    toast.info(t("settings.resetDone"), {
      style: {
        background: "rgba(8, 25, 55, 0.95)",
        border: "1px solid rgba(0, 180, 255, 0.3)",
        color: "#e0f0ff",
      },
    });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ settings, values }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cpim-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("settings.exported"));
  };

  // ============================================================
  // Render sections
  // ============================================================

  const renderSection = () => {
    switch (activeSection) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <YYC3Logo size="sm" showStatus={false} glow={false} />
                <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.95rem" }}>系统信息</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <EditableField label="系统名称" value={values.systemName} onChange={v => updateValue("systemName", v)} description="系统显示标题" />
                <EditableField label="集群 ID" value={values.clusterId} onChange={v => updateValue("clusterId", v)} description="全局唯一集群标识" mono />
                <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                    <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>运行时间</span>
                  </div>
                  <span className="text-[#c0dcf0]" style={{ fontSize: "0.85rem" }}>127 天 14 小时</span>
                </div>
                <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                    <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>许可证</span>
                  </div>
                  <span className="text-[#c0dcf0]" style={{ fontSize: "0.85rem" }}>Enterprise Pro</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>显示与界面</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div>
                    <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>深色模式</p>
                    <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>使用深色主题界面</p>
                  </div>
                  <Toggle enabled={settings.darkMode} onChange={() => toggleSetting("darkMode")} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div>
                    <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>数据刷新间隔</p>
                    <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>设置仪表盘自动刷新频率</p>
                  </div>
                  <select
                    value={values.refreshInterval}
                    onChange={e => updateValue("refreshInterval", e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <option value="2">2 秒</option>
                    <option value="5">5 秒</option>
                    <option value="10">10 秒</option>
                    <option value="30">30 秒</option>
                    <option value="60">1 分钟</option>
                  </select>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div>
                    <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>语言</p>
                    <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>系统显示语言</p>
                  </div>
                  <select
                    value={values.language}
                    onChange={e => updateValue("language", e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
                <EditableField label="时区" value={values.timezone} onChange={v => updateValue("timezone", v)} description="系统时区设置" />
              </div>
            </div>

            {/* Import/Export */}
            <div>
              <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>配置导入 / 导出</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.15)] transition-all"
                  style={{ fontSize: "0.8rem" }}
                >
                  <Download className="w-4 h-4" />
                  导出配置
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)] text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] transition-all"
                  style={{ fontSize: "0.8rem" }}
                >
                  <Upload className="w-4 h-4" />
                  导入配置
                </button>
              </div>
            </div>
          </div>
        );

      case "network":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Globe className="w-4 h-4 text-[#00d4ff]" />
              网络连接配置
            </h3>

            {/* 快捷操作 */}
            <button
              onClick={() => setNetworkConfigOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.15)] hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.08)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[rgba(0,212,255,0.1)] group-hover:bg-[rgba(0,212,255,0.15)] transition-all">
                  <Network className="w-5 h-5 text-[#00d4ff]" />
                </div>
                <div className="text-left">
                  <p className="text-[#e0f0ff]" style={{ fontSize: "0.85rem" }}>打开网络配置面板</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>自动检测 / WiFi 配置 / 手动配置</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[rgba(0,212,255,0.3)] group-hover:text-[#00d4ff] transition-all" />
            </button>

            {/* 当前连接状态 */}
            <div className="space-y-3">
              <h4 className="text-[rgba(0,212,255,0.6)]" style={{ fontSize: "0.8rem" }}>当前连接</h4>
              {[
                { label: "WebSocket 端点", value: values.wsEndpoint },
                { label: "数据库地址", value: `${values.dbHost}:${values.dbPort}` },
                { label: "网络状态", value: navigator.onLine ? "已连接" : "未连接" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.78rem" }}>{item.label}</span>
                  <span className="text-[#c0dcf0] font-mono" style={{ fontSize: "0.78rem" }}>{item.value}</span>
                </div>
              ))}
            </div>

            {/* 节点拓扑 */}
            <div>
              <h4 className="text-[rgba(0,212,255,0.6)] mb-3" style={{ fontSize: "0.8rem" }}>节点拓扑</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { name: "M4 Max 主节点", ip: "192.168.3.45", role: "主节点", status: "active", color: "#00d4ff" },
                  { name: "iMac 辅助节点", ip: "192.168.3.46", role: "辅助", status: "active", color: "#00ff88" },
                  { name: "NAS 数据中心", ip: "192.168.3.45:9898", role: "存储", status: "active", color: "#aa55ff" },
                ].map((node) => (
                  <div key={node.name} className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color, boxShadow: `0 0 8px ${node.color}60` }} />
                      <span className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>{node.name}</span>
                    </div>
                    <p className="text-[rgba(0,212,255,0.5)] font-mono" style={{ fontSize: "0.7rem" }}>{node.ip}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[rgba(0,212,255,0.6)]" style={{ fontSize: "0.62rem", backgroundColor: `${node.color}15`, border: `1px solid ${node.color}30` }}>
                      {node.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* NetworkConfig Modal */}
            <NetworkConfig open={networkConfigOpen} onClose={() => setNetworkConfigOpen(false)} />
          </div>
        );

      case "cluster":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>集群配置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>自动弹性伸缩</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>根据负载自动增减节点</p>
                </div>
                <Toggle enabled={settings.autoScale} onChange={() => toggleSetting("autoScale")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>健康检查</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>定时检测节点状态</p>
                </div>
                <Toggle enabled={settings.healthCheck} onChange={() => toggleSetting("healthCheck")} />
              </div>
              <EditableField label="最大节点数量" value={values.maxNodes} onChange={v => updateValue("maxNodes", v)} type="number" />
              <EditableField label="健康检查间隔 (秒)" value={values.healthCheckInterval} onChange={v => updateValue("healthCheckInterval", v)} type="number" description="每次健康检查的时间间隔" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>负载均衡策略</p>
                </div>
                <select
                  value={values.loadBalanceStrategy}
                  onChange={e => updateValue("loadBalanceStrategy", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option>轮询 (Round Robin)</option>
                  <option>最少连接 (Least Connections)</option>
                  <option>加权轮询 (Weighted RR)</option>
                  <option>一致性哈希 (Consistent Hash)</option>
                </select>
              </div>
              <EditableField label="扩容阈值 (%)" value={values.scaleUpThreshold} onChange={v => updateValue("scaleUpThreshold", v)} type="number" description="GPU 利用率超过此值时触发扩容" />
              <EditableField label="缩容阈值 (%)" value={values.scaleDownThreshold} onChange={v => updateValue("scaleDownThreshold", v)} type="number" description="GPU 利用率低于此值时触发缩容" />
            </div>
          </div>
        );

      case "model":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.95rem" }}>模型管理</h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] transition-all" style={{ fontSize: "0.72rem" }}>
                <Plus className="w-3.5 h-3.5" />
                添加模型
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: "LLaMA-70B", ver: "v2.1", size: "140GB", status: "deployed", gpu: "GPU-A100-01" },
                { name: "Qwen-72B", ver: "v1.5", size: "145GB", status: "deployed", gpu: "GPU-A100-02" },
                { name: "DeepSeek-V3", ver: "v3.0", size: "180GB", status: "deploying", gpu: "GPU-A100-03" },
                { name: "GLM-4", ver: "v4.0", size: "92GB", status: "deployed", gpu: "GPU-H100-01" },
                { name: "Mixtral-8x7B", ver: "v0.1", size: "95GB", status: "standby", gpu: "-" },
              ].map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)] hover:border-[rgba(0,180,255,0.2)] transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[rgba(0,212,255,0.08)]">
                      <Layers className="w-4 h-4 text-[#00d4ff]" />
                    </div>
                    <div>
                      <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>{model.name}</p>
                      <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.65rem" }}>{model.ver} · {model.size} · {model.gpu}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded ${
                      model.status === "deployed" ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]" :
                      model.status === "deploying" ? "bg-[rgba(0,212,255,0.1)] text-[#00d4ff]" :
                      "bg-[rgba(170,85,255,0.1)] text-[#aa55ff]"
                    }`} style={{ fontSize: "0.65rem" }}>
                      {model.status === "deployed" ? "已部署" : model.status === "deploying" ? "部署中" : "待命"}
                    </span>
                    <button className="p-1 rounded hover:bg-[rgba(0,212,255,0.1)]">
                      <Edit2 className="w-3.5 h-3.5 text-[rgba(0,212,255,0.3)]" />
                    </button>
                    <button className="p-1 rounded hover:bg-[rgba(255,51,102,0.1)]">
                      <Trash2 className="w-3.5 h-3.5 text-[rgba(0,212,255,0.3)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
              <div>
                <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>推理缓存 (KV-Cache)</p>
                <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>启用 KV-Cache 加速推理</p>
              </div>
              <Toggle enabled={settings.cacheEnabled} onChange={() => toggleSetting("cacheEnabled")} />
            </div>
          </div>
        );

      case "storage":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>存储配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {[
                { label: "总存储", value: "48 TB", used: "12.8 TB", pct: 27, color: "#00d4ff" },
                { label: "向量数据库", value: "8 TB", used: "5.2 TB", pct: 65, color: "#00ff88" },
                { label: "模型仓库", value: "20 TB", used: "4.8 TB", pct: 24, color: "#aa55ff" },
                { label: "日志存储", value: "10 TB", used: "2.8 TB", pct: 28, color: "#ffdd00" },
              ].map((store) => (
                <div key={store.label} className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#c0dcf0]" style={{ fontSize: "0.8rem" }}>{store.label}</span>
                    <span style={{ fontSize: "0.7rem", color: store.color }}>{store.used} / {store.value}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[rgba(0,180,255,0.08)]">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${store.pct}%`,
                      backgroundColor: store.color,
                      opacity: 0.7,
                    }} />
                  </div>
                  <div className="text-right mt-1">
                    <span style={{ fontSize: "0.65rem", color: store.color }}>{store.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>自动备份</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>按 Cron 计划自动备份</p>
                </div>
                <Toggle enabled={settings.autoBackup} onChange={() => toggleSetting("autoBackup")} />
              </div>
              <EditableField label="备份调度 (Cron)" value={values.backupSchedule} onChange={v => updateValue("backupSchedule", v)} mono description="默认每天凌晨 2:00" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>数据压缩</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>启用传输和存储压缩</p>
                </div>
                <Toggle enabled={settings.dataCompression} onChange={() => toggleSetting("dataCompression")} />
              </div>
            </div>
          </div>
        );

      case "websocket":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Wifi className="w-4 h-4 text-[#00d4ff]" />
              WebSocket 连接配置
            </h3>
            <div className="space-y-3">
              <EditableField label="WebSocket 端点" value={values.wsEndpoint} onChange={v => updateValue("wsEndpoint", v)} mono description="实时数据推送 WebSocket 服务地址" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>自动重连</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>断线后自动尝试重新连接</p>
                </div>
                <Toggle enabled={settings.wsAutoReconnect} onChange={() => toggleSetting("wsAutoReconnect")} />
              </div>
              <EditableField label="重连间隔 (ms)" value={values.wsReconnectInterval} onChange={v => updateValue("wsReconnectInterval", v)} type="number" description="两次重连之间的等待时间" />
              <EditableField label="最大重连次数" value={values.wsMaxReconnect} onChange={v => updateValue("wsMaxReconnect", v)} type="number" description="超过此次数后切换模拟模式" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>心跳检测</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>定时发送心跳保持连接</p>
                </div>
                <Toggle enabled={settings.wsHeartbeat} onChange={() => toggleSetting("wsHeartbeat")} />
              </div>
              <EditableField label="心跳间隔 (ms)" value={values.wsHeartbeatInterval} onChange={v => updateValue("wsHeartbeatInterval", v)} type="number" />
              <EditableField label="UI 更新节流 (ms)" value={values.wsThrottleMs} onChange={v => updateValue("wsThrottleMs", v)} type="number" description="防止高频更新导致渲染卡顿" />
            </div>
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Sliders className="w-4 h-4 text-[#aa55ff]" />
              AI / 大模型配置
            </h3>
            <div className="space-y-3">
              <EditableField label="OpenAI API Key" value={values.aiApiKey} onChange={v => updateValue("aiApiKey", v)} type="password" placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx" description="留空使用本地模拟模式" />
              <EditableField label="API Base URL" value={values.aiBaseUrl} onChange={v => updateValue("aiBaseUrl", v)} type="url" mono description="兼容 OpenAI 协议的 API 端点" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>默认模型</p>
                </div>
                <select
                  value={values.aiModel}
                  onChange={e => updateValue("aiModel", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="local-llama-70b">本地 LLaMA-70B</option>
                  <option value="local-qwen-72b">本地 Qwen-72B</option>
                  <option value="local-deepseek-v3">本地 DeepSeek-V3</option>
                </select>
              </div>
              <EditableField label="温度 (Temperature)" value={values.aiTemperature} onChange={v => updateValue("aiTemperature", v)} type="number" description="0=精确，2=创意" />
              <EditableField label="Top-P (核采样)" value={values.aiTopP} onChange={v => updateValue("aiTopP", v)} type="number" description="控制采样多样性" />
              <EditableField label="最大 Token" value={values.aiMaxTokens} onChange={v => updateValue("aiMaxTokens", v)} type="number" description="单次对话最大生成长度" />
              <EditableField label="API 超时 (ms)" value={values.aiTimeout} onChange={v => updateValue("aiTimeout", v)} type="number" description="API 请求超时时间" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>流式输出 (Stream)</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>启用 SSE 流式响应</p>
                </div>
                <Toggle enabled={settings.aiStreamMode} onChange={() => toggleSetting("aiStreamMode")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>上下文记忆</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>保留对话历史作为上下文</p>
                </div>
                <Toggle enabled={settings.aiContextMemory} onChange={() => toggleSetting("aiContextMemory")} />
              </div>
            </div>
          </div>
        );

      case "pwa":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Monitor className="w-4 h-4 text-[#ff6600]" />
              PWA / 离线配置
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>启用 PWA</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>允许用户离线访问</p>
                </div>
                <Toggle enabled={settings.cacheEnabled} onChange={() => toggleSetting("cacheEnabled")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>缓存大小 (MB)</p>
                </div>
                <select
                  value={values.cacheSize}
                  onChange={e => updateValue("cacheSize", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option value="512">512 MB</option>
                  <option value="1024">1 GB</option>
                  <option value="2048">2 GB</option>
                  <option value="4096">4 GB</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>缓存 TTL (秒)</p>
                </div>
                <select
                  value={values.cacheTTL}
                  onChange={e => updateValue("cacheTTL", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option value="3600">1 小时</option>
                  <option value="7200">2 小时</option>
                  <option value="14400">4 小时</option>
                  <option value="28800">8 小时</option>
                </select>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>安全设置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>多因素认证 (MFA)</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>要求所有用户启用 MFA</p>
                </div>
                <Toggle enabled={settings.mfa} onChange={() => toggleSetting("mfa")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>审计日志</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>记录所有操作行为</p>
                </div>
                <Toggle enabled={settings.auditLog} onChange={() => toggleSetting("auditLog")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>API 速率限制</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>限制 API 请求频率</p>
                </div>
                <Toggle enabled={settings.rateLimiting} onChange={() => toggleSetting("rateLimiting")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>CORS 跨域</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>允许跨域请求访问</p>
                </div>
                <Toggle enabled={settings.corsEnabled} onChange={() => toggleSetting("corsEnabled")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>会话超时</p>
                </div>
                <select
                  value={values.sessionTimeout}
                  onChange={e => updateValue("sessionTimeout", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option value="30">30 分钟</option>
                  <option value="60">1 小时</option>
                  <option value="240">4 小时</option>
                  <option value="480">8 小时</option>
                  <option value="0">永不过期</option>
                </select>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <p className="text-[#c0dcf0] mb-2" style={{ fontSize: "0.82rem" }}>IP 白名单</p>
                <p className="text-[rgba(0,212,255,0.35)] mb-2" style={{ fontSize: "0.68rem" }}>每行一个 CIDR 地址段</p>
                <textarea
                  value={values.ipWhitelist}
                  onChange={e => { updateValue("ipWhitelist", e.target.value); }}
                  className="w-full px-3 py-2 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none focus:border-[rgba(0,212,255,0.4)] resize-none font-mono"
                  style={{ fontSize: "0.75rem" }}
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case "notification":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4" style={{ fontSize: "0.95rem" }}>通知配置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>邮件通知</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>通过邮件发送告警通知</p>
                </div>
                <Toggle enabled={settings.alertEmail} onChange={() => toggleSetting("alertEmail")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>Slack 通知</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>通过 Slack 频道推送告警</p>
                </div>
                <Toggle enabled={settings.alertSlack} onChange={() => toggleSetting("alertSlack")} />
              </div>
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <p className="text-[#c0dcf0] mb-2" style={{ fontSize: "0.82rem" }}>GPU 使用率告警阈值</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={values.alertGpuThreshold}
                    onChange={e => updateValue("alertGpuThreshold", e.target.value)}
                    className="flex-1 accent-[#00d4ff]"
                  />
                  <span className="text-[#00d4ff] w-12 text-right" style={{ fontSize: "0.8rem" }}>{values.alertGpuThreshold}%</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <p className="text-[#c0dcf0] mb-2" style={{ fontSize: "0.82rem" }}>温度告警阈值</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={values.alertTempThreshold}
                    onChange={e => updateValue("alertTempThreshold", e.target.value)}
                    className="flex-1 accent-[#ff6600]"
                  />
                  <span className="text-[#ff6600] w-12 text-right" style={{ fontSize: "0.8rem" }}>{values.alertTempThreshold}°C</span>
                </div>
              </div>
              <EditableField label="通知邮箱" value={values.alertEmail} onChange={v => updateValue("alertEmail", v)} type="email" />
              <EditableField label="Webhook URL" value={values.webhookUrl} onChange={v => updateValue("webhookUrl", v)} type="url" placeholder="https://hooks.slack.com/..." description="Slack / 飞书 / 钉钉 Webhook 地址" />
            </div>
          </div>
        );

      case "env":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Terminal className="w-4 h-4 text-[#ffdd00]" />
              环境变量 & 数据库
            </h3>
            <div className="p-3 rounded-xl bg-[rgba(255,221,0,0.05)] border border-[rgba(255,221,0,0.15)]">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-[#ffdd00]" />
                <span className="text-[#ffdd00]" style={{ fontSize: "0.75rem" }}>注意</span>
              </div>
              <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.68rem" }}>
                修改环境变量可能影响系统运行，请谨慎操作。变更将在下次重启后生效。
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-[rgba(0,212,255,0.6)]" style={{ fontSize: "0.8rem" }}>PostgreSQL 数据库</h4>
              <EditableField label="数据库主机" value={values.dbHost} onChange={v => updateValue("dbHost", v)} mono />
              <EditableField label="数据库端口" value={values.dbPort} onChange={v => updateValue("dbPort", v)} type="number" mono />
              <EditableField label="数据库名称" value={values.dbName} onChange={v => updateValue("dbName", v)} mono />
              <EditableField label="数据库用户名" value={values.dbUser} onChange={v => updateValue("dbUser", v)} mono />
              <EditableField label="数据库密码" value={values.dbPassword} onChange={v => updateValue("dbPassword", v)} type="password" />
              <EditableField label="连接池大小" value={values.dbPoolSize} onChange={v => updateValue("dbPoolSize", v)} type="number" description="最大并发数据库连接数" />
            </div>
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-6">
            <h3 className="text-[#e0f0ff] mb-4 flex items-center gap-2" style={{ fontSize: "0.95rem" }}>
              <Code className="w-4 h-4 text-[#ff6600]" />
              高级设置
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>调试模式</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>启用详细日志输出</p>
                </div>
                <Toggle enabled={settings.debugMode} onChange={() => toggleSetting("debugMode")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>性能日志</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>记录每次请求的性能指标</p>
                </div>
                <Toggle enabled={settings.performanceLog} onChange={() => toggleSetting("performanceLog")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>自动更新</p>
                  <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem" }}>自动检查和安装系统更新</p>
                </div>
                <Toggle enabled={settings.autoUpdate} onChange={() => toggleSetting("autoUpdate")} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div>
                  <p className="text-[#c0dcf0]" style={{ fontSize: "0.82rem" }}>日志级别</p>
                </div>
                <select
                  value={values.logLevel}
                  onChange={e => updateValue("logLevel", e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] focus:outline-none"
                  style={{ fontSize: "0.75rem" }}
                >
                  <option value="debug">Debug</option>
                  <option value="info">Info</option>
                  <option value="warn">Warn</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <EditableField label="日志保留天数" value={values.logRetention} onChange={v => updateValue("logRetention", v)} type="number" description="超过天数的日志自动清理" />
              <EditableField label="最大并发数" value={values.maxConcurrency} onChange={v => updateValue("maxConcurrency", v)} type="number" description="系统最大并发请求处理数" />
              <EditableField label="缓存大小 (MB)" value={values.cacheSize} onChange={v => updateValue("cacheSize", v)} type="number" description="内存缓存最大容量" />
              <EditableField label="缓存 TTL (秒)" value={values.cacheTTL} onChange={v => updateValue("cacheTTL", v)} type="number" description="缓存数据过期时间" />
            </div>

            {/* Danger zone */}
            <div className="mt-6 p-4 rounded-xl border border-[rgba(255,51,102,0.2)] bg-[rgba(255,51,102,0.03)]">
              <h4 className="text-[#ff3366] mb-3 flex items-center gap-2" style={{ fontSize: "0.85rem" }}>
                <AlertTriangle className="w-4 h-4" />
                危险操作
              </h4>
              <div className="space-y-2">
                <button className="w-full py-2.5 rounded-xl bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.2)] text-[#ff3366] hover:bg-[rgba(255,51,102,0.15)] transition-all" style={{ fontSize: "0.78rem" }}>
                  <RefreshCw className="w-3.5 h-3.5 inline mr-2" />
                  重置所有设置为默认值
                </button>
                <button className="w-full py-2.5 rounded-xl bg-[rgba(255,51,102,0.05)] border border-[rgba(255,51,102,0.12)] text-[rgba(255,51,102,0.6)] hover:text-[#ff3366] hover:bg-[rgba(255,51,102,0.1)] transition-all" style={{ fontSize: "0.78rem" }}>
                  <Trash2 className="w-3.5 h-3.5 inline mr-2" />
                  清除所有缓存数据
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-full">
      {/* Left sidebar */}
      <GlassCard className="md:col-span-3 p-3">
        <h3 className="text-[#e0f0ff] px-3 mb-4" style={{ fontSize: "0.9rem" }}>系统设置</h3>
        <div className="space-y-1">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${
                activeSection === section.id
                  ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.2)]"
                  : "text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.05)] border border-transparent"
              }`}
              style={{ fontSize: "0.82rem" }}
            >
              <section.icon className="w-4 h-4" />
              {t(section.labelKey)}
            </button>
          ))}
        </div>

        {/* System Health */}
        <div className="mt-6 p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)]">
          <h4 className="text-[rgba(0,212,255,0.5)] mb-3" style={{ fontSize: "0.75rem" }}>系统健康度</h4>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span className="text-[#00ff88]" style={{ fontSize: "0.72rem" }}>所有服务正常</span>
          </div>
          <div className="space-y-1.5">
            {[
              { name: "API Gateway", status: "ok" },
              { name: "推理引擎", status: "ok" },
              { name: "数据库", status: "ok" },
              { name: "消息队列", status: "ok" },
              { name: "缓存服务", status: "warn" },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between">
                <span className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.68rem" }}>{svc.name}</span>
                <div className={`w-1.5 h-1.5 rounded-full ${svc.status === "ok" ? "bg-[#00ff88]" : "bg-[#ffdd00] animate-pulse"}`} />
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Right content */}
      <GlassCard className="md:col-span-9 p-4 md:p-6 overflow-auto">
        {renderSection()}

        {/* Save / Reset buttons - sticky at bottom */}
        <div className={`flex items-center gap-3 mt-8 pt-4 border-t border-[rgba(0,180,255,0.08)] ${hasChanges ? "" : "opacity-60"}`}>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.25)] transition-all shadow-[0_0_15px_rgba(0,180,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: "0.82rem" }}
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {t("settings.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t("settings.saveChanges")}
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)] text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] transition-all"
            style={{ fontSize: "0.82rem" }}
          >
            <RotateCcw className="w-4 h-4" />
            {t("settings.resetDefault")}
          </button>
          {hasChanges && (
            <span className="ml-auto text-[#ffdd00] flex items-center gap-1" style={{ fontSize: "0.72rem" }}>
              <div className="w-2 h-2 rounded-full bg-[#ffdd00] animate-pulse" />
              ⚠
            </span>
          )}
        </div>
      </GlassCard>
    </div>
  );
}