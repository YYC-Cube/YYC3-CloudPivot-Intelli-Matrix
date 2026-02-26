/**
 * NetworkConfig.tsx
 * =================
 * 网络连接配置弹窗组件
 * - 三种配置方式：自动检测 / WiFi 配置 / 手动配置
 * - GlassCard 统一风格
 * - 连接测试 + 状态指示
 */

import { useState } from "react";
import { X, Wifi, WifiOff, Globe, RefreshCw, Check, AlertTriangle, Loader2, Monitor, Settings, Radio, Server, HardDrive } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useNetworkConfig, type TestStatus } from "../hooks/useNetworkConfig";
import { toast } from "sonner";

interface NetworkConfigProps {
  open: boolean;
  onClose: () => void;
}

const tabs = [
  { id: "auto", label: "自动检测", icon: Radio },
  { id: "wifi", label: "WiFi 配置", icon: Wifi },
  { id: "manual", label: "手动配置", icon: Settings },
] as const;

type TabId = (typeof tabs)[number]["id"];

function StatusBadge({ status }: { status: TestStatus }) {
  if (status === "idle") {return null;}
  const map = {
    testing: {
      bg: "bg-[rgba(0,212,255,0.15)]",
      text: "text-[#00d4ff]",
      label: "测试中...",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    success: {
      bg: "bg-[rgba(0,255,136,0.15)]",
      text: "text-[#00ff88]",
      label: "连接成功",
      icon: <Check className="w-3.5 h-3.5" />,
    },
    failed: {
      bg: "bg-[rgba(255,51,102,0.15)]",
      text: "text-[#ff3366]",
      label: "连接失败",
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${s.bg} ${s.text}`}
      style={{ fontSize: "0.72rem" }}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

export function NetworkConfig({ open, onClose }: NetworkConfigProps) {
  const {
    config,
    interfaces,
    localIP,
    testStatus,
    testLatency,
    testError,
    detecting,
    updateConfig,
    save,
    reset,
    detectNetwork,
    testConnection,
  } = useNetworkConfig();

  const [activeTab, setActiveTab] = useState<TabId>("auto");

  if (!open) {return null;}

  const handleSave = () => {
    save();
    toast.success("网络配置已保存", {
      description: `WebSocket: ${config.wsUrl}`,
      style: {
        background: "rgba(8, 25, 55, 0.95)",
        border: "1px solid rgba(0, 255, 136, 0.3)",
        color: "#e0f0ff",
      },
    });
  };

  const handleTest = async () => {
    const result = await testConnection();
    if (result.success) {
      toast.success(`连接成功 (${result.latency}ms)`, {
        style: {
          background: "rgba(8, 25, 55, 0.95)",
          border: "1px solid rgba(0, 255, 136, 0.3)",
          color: "#e0f0ff",
        },
      });
    } else {
      toast.error(`连接失败: ${result.error}`, {
        style: {
          background: "rgba(8, 25, 55, 0.95)",
          border: "1px solid rgba(255, 51, 102, 0.3)",
          color: "#e0f0ff",
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <GlassCard className="relative z-10 w-full max-w-xl mx-4 max-h-[85vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgba(0,180,255,0.1)]">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#00d4ff]" />
            <h2
              className="text-[#e0f0ff]"
              style={{ fontSize: "1rem" }}
            >
              网络连接配置
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition-all"
          >
            <X className="w-5 h-5 text-[rgba(0,212,255,0.5)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                updateConfig({ mode: tab.id === "wifi" ? "wifi" : tab.id === "manual" ? "manual" : "auto" });
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-[rgba(0,212,255,0.15)] text-[#00d4ff] border border-[rgba(0,212,255,0.3)]"
                  : "text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] hover:bg-[rgba(0,212,255,0.05)] border border-transparent"
              }`}
              style={{ fontSize: "0.8rem" }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Auto Detect Tab */}
          {activeTab === "auto" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[rgba(0,212,255,0.6)]"
                    style={{ fontSize: "0.78rem" }}
                  >
                    自动检测 (WebRTC)
                  </span>
                  <button
                    onClick={detectNetwork}
                    disabled={detecting}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.15)] transition-all disabled:opacity-50"
                    style={{ fontSize: "0.72rem" }}
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${detecting ? "animate-spin" : ""}`}
                    />
                    刷新检测
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[rgba(0,212,255,0.4)]"
                      style={{ fontSize: "0.75rem" }}
                    >
                      本机 IP
                    </span>
                    <span
                      className="text-[#00d4ff] font-mono"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {localIP}
                    </span>
                  </div>

                  {interfaces.map((iface) => (
                    <div
                      key={iface.name}
                      className="flex items-center justify-between"
                    >
                      <span
                        className="text-[rgba(0,212,255,0.4)]"
                        style={{ fontSize: "0.75rem" }}
                      >
                        {iface.name} ({iface.type})
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[#c0dcf0] font-mono"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {iface.ip}
                        </span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            iface.status === "active"
                              ? "bg-[#00ff88]"
                              : "bg-[#ff3366]"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)]">
                <div className="flex items-center gap-2 mb-2">
                  {navigator.onLine ? (
                    <Wifi className="w-4 h-4 text-[#00ff88]" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-[#ff3366]" />
                  )}
                  <span
                    className={navigator.onLine ? "text-[#00ff88]" : "text-[#ff3366]"}
                    style={{ fontSize: "0.78rem" }}
                  >
                    {navigator.onLine ? "网络已连接" : "网络未连接"}
                  </span>
                </div>
                <span
                  className="text-[rgba(0,212,255,0.35)]"
                  style={{ fontSize: "0.68rem" }}
                >
                  检测到的网络类型：{(navigator as any).connection?.effectiveType || "未知"}
                </span>
              </div>
            </div>
          )}

          {/* WiFi Tab */}
          {activeTab === "wifi" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)]">
                <div className="flex items-center gap-2 mb-3">
                  <Wifi className="w-4 h-4 text-[#00d4ff]" />
                  <span
                    className="text-[rgba(0,212,255,0.6)]"
                    style={{ fontSize: "0.78rem" }}
                  >
                    WiFi 网络信息
                  </span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "网络状态", value: navigator.onLine ? "已连接" : "未连接" },
                    { label: "连接类型", value: (navigator as any).connection?.effectiveType || "4g" },
                    { label: "下行带宽", value: `${(navigator as any).connection?.downlink || "~10"} Mbps` },
                    { label: "RTT", value: `${(navigator as any).connection?.rtt || "~50"} ms` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.75rem" }}>
                        {item.label}
                      </span>
                      <span className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[rgba(0,212,255,0.03)] border border-[rgba(0,180,255,0.08)]">
                <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.7rem" }}>
                  WiFi 配置将自动使用检测到的网络接口。在 M4 Max 主节点和 iMac 辅助节点之间自动路由。
                </p>
              </div>
            </div>
          )}

          {/* Manual Tab */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              {[
                {
                  label: "服务器地址",
                  value: config.serverAddress,
                  key: "serverAddress" as const,
                  icon: Server,
                  placeholder: "192.168.3.45",
                },
                {
                  label: "端口",
                  value: config.port,
                  key: "port" as const,
                  icon: Monitor,
                  placeholder: "3113",
                },
                {
                  label: "NAS 地址",
                  value: config.nasAddress,
                  key: "nasAddress" as const,
                  icon: HardDrive,
                  placeholder: "192.168.3.45:9898",
                },
              ].map((field) => (
                <div
                  key={field.key}
                  className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <field.icon className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                    <span className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>
                      {field.label}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateConfig({ [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] font-mono focus:outline-none focus:border-[rgba(0,212,255,0.5)] focus:shadow-[0_0_10px_rgba(0,180,255,0.1)]"
                    style={{ fontSize: "0.8rem" }}
                  />
                </div>
              ))}

              {/* Auto-generated WebSocket URL */}
              <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                  <span className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>
                    WebSocket URL
                  </span>
                  <span className="text-[rgba(0,212,255,0.25)] ml-auto" style={{ fontSize: "0.65rem" }}>
                    自动生成
                  </span>
                </div>
                <input
                  type="text"
                  value={config.wsUrl}
                  onChange={(e) => updateConfig({ wsUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] font-mono focus:outline-none focus:border-[rgba(0,212,255,0.5)]"
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
            </div>
          )}

          {/* Test Result */}
          {testStatus !== "idle" && (
            <div
              className={`p-3 rounded-xl border ${
                testStatus === "success"
                  ? "bg-[rgba(0,255,136,0.05)] border-[rgba(0,255,136,0.2)]"
                  : testStatus === "failed"
                  ? "bg-[rgba(255,51,102,0.05)] border-[rgba(255,51,102,0.2)]"
                  : "bg-[rgba(0,212,255,0.05)] border-[rgba(0,212,255,0.2)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <StatusBadge status={testStatus} />
                {testLatency > 0 && (
                  <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>
                    延迟: {testLatency}ms
                  </span>
                )}
              </div>
              {testError && (
                <p className="text-[#ff3366] mt-1.5" style={{ fontSize: "0.72rem" }}>
                  {testError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-4 border-t border-[rgba(0,180,255,0.1)]">
          <button
            onClick={handleTest}
            disabled={testStatus === "testing"}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.15)] transition-all disabled:opacity-50"
            style={{ fontSize: "0.8rem" }}
          >
            {testStatus === "testing" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Radio className="w-4 h-4" />
            )}
            测试连接
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.25)] transition-all shadow-[0_0_15px_rgba(0,180,255,0.1)]"
            style={{ fontSize: "0.8rem" }}
          >
            <Check className="w-4 h-4" />
            保存配置
          </button>
          <button
            onClick={reset}
            className="ml-auto text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] transition-all"
            style={{ fontSize: "0.75rem" }}
          >
            重置默认
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
