/**
 * IDEPanel.tsx
 * =============
 * IDE 插件集成面板 · 模拟 VS Code 侧边栏视图
 * Tab: 数据监控 / 告警 / 操作 / 日志
 */

import React, { useState, useContext } from "react";
import { Monitor, AlertTriangle, Settings, FileText, CheckCircle, XCircle, ChevronRight, ExternalLink, Code2, Layers, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router";
import { GlassCard } from "./GlassCard";
import { ViewContext } from "./Layout";
import { useI18n } from "../hooks/useI18n";
import type { IDEPanelTab } from "../types";

const mockNodeList = [
  { id: "GPU-A100-01", status: "ok" as const, info: "GPU 72% · 3 任务" },
  { id: "GPU-A100-02", status: "ok" as const, info: "GPU 68% · 2 任务" },
  { id: "GPU-A100-03", status: "warning" as const, info: "延迟高 2,450ms" },
  { id: "GPU-A100-04", status: "ok" as const, info: "GPU 45% · 1 任务" },
  { id: "GPU-H100-01", status: "ok" as const, info: "GPU 55% · 2 任务" },
  { id: "GPU-H100-02", status: "error" as const, info: "显存不足 98%" },
  { id: "M4-Max-01",   status: "ok" as const, info: "GPU 30% · 1 任务" },
];

const mockAlerts = [
  { id: "AL-0032", level: "critical" as const, msg: "GPU-A100-03 推理延迟异常" },
  { id: "AL-0035", level: "warning" as const,  msg: "NAS-Storage-01 存储 85.8%" },
  { id: "AL-0038", level: "warning" as const,  msg: "网络延迟偏高 平均 45ms" },
  { id: "AL-0040", level: "error" as const,    msg: "GPU-H100-02 显存 98%" },
];

const mockQuickOps = [
  { id: "op1", label: "重启节点", desc: "重启异常节点" },
  { id: "op2", label: "清理缓存", desc: "清理推理缓存" },
  { id: "op3", label: "导出日志", desc: "导出到本地" },
  { id: "op4", label: "生成报告", desc: "性能报告" },
];

const mockLogs = [
  { time: "10:24:30", msg: "系统自动降频 GPU-A100-03", ok: true },
  { time: "10:24:15", msg: "延迟异常告警 #AL-0032", ok: false },
  { time: "10:24:12", msg: "推理任务启动 #12847", ok: true },
  { time: "10:23:45", msg: "模型加载 LLaMA-70B", ok: true },
  { time: "10:20:00", msg: "巡查完成 健康度 96%", ok: true },
  { time: "10:15:00", msg: "备份 PostgreSQL 完成", ok: true },
];

const statusIcon: Record<string, React.ElementType> = {
  ok: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
};
const statusColor: Record<string, string> = {
  ok: "#00ff88",
  warning: "#ffaa00",
  error: "#ff3366",
};
const levelColor: Record<string, string> = {
  critical: "#ff3366",
  error: "#ff6600",
  warning: "#ffaa00",
  info: "#00d4ff",
};

export function IDEPanel() {
  const [activeTab, setActiveTab] = useState<IDEPanelTab>("monitor");
  const navigate = useNavigate();
  const view = useContext(ViewContext);
  const isMobile = view?.isMobile ?? false;
  const { t } = useI18n();

  const tabs: { key: IDEPanelTab; label: string; icon: React.ElementType }[] = [
    { key: "monitor",    label: t("nav.dataMonitor"), icon: Monitor },
    { key: "alerts",     label: t("common.warning"),  icon: AlertTriangle },
    { key: "operations", label: t("nav.operations"),  icon: Settings },
    { key: "logs",       label: t("log.title"),       icon: FileText },
  ];

  const okCount = mockNodeList.filter((n) => n.status === "ok").length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
          <Code2 className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div>
          <h2 className="text-[#e0f0ff]" style={{ fontSize: "1.1rem" }}>
            {t("nav.ide")}
          </h2>
          <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.7rem" }}>
            VS Code · {t("nav.ide")}
          </p>
        </div>
      </div>

      {/* IDE Sidebar simulation */}
      <GlassCard className="overflow-hidden">
        {/* IDE title bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-[rgba(0,20,40,0.6)] border-b border-[rgba(0,180,255,0.08)]">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#00d4ff]" />
            <span className="text-[#e0f0ff]" style={{ fontSize: "0.78rem" }}>
              YYC³ CloudPivot Intelli-Matrix
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="p-1 rounded hover:bg-[rgba(0,212,255,0.1)] transition-all"
            title={t("monitor.openBrowser")}
          >
            <ExternalLink className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-[rgba(0,180,255,0.08)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 transition-all ${
                  isActive
                    ? "text-[#00d4ff] border-b-2 border-[#00d4ff] bg-[rgba(0,212,255,0.04)]"
                    : "text-[rgba(0,212,255,0.35)] hover:text-[rgba(0,212,255,0.6)]"
                }`}
                style={{ fontSize: "0.65rem" }}
                data-testid={`ide-tab-${tab.key}`}
              >
                <Icon className="w-3 h-3" />
                {!isMobile && tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div
          className="p-3 overflow-y-auto"
          style={{
            height: isMobile ? "50vh" : "55vh",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(0,180,255,0.15) transparent",
          }}
          data-testid="ide-panel-content"
        >
          {activeTab === "monitor" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>
                  {t("monitor.nodeStatus")} ({okCount}/{mockNodeList.length})
                </span>
                <RefreshCw className="w-3 h-3 text-[rgba(0,212,255,0.3)] cursor-pointer hover:text-[#00d4ff]" />
              </div>
              <div className="space-y-0.5">
                {mockNodeList.map((node) => {
                  const StIcon = statusIcon[node.status];
                  return (
                    <div
                      key={node.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[rgba(0,40,80,0.15)] transition-all cursor-pointer"
                    >
                      <StIcon className="w-3 h-3 shrink-0" style={{ color: statusColor[node.status] }} />
                      <span className="text-[#c0dcf0] flex-1 truncate" style={{ fontSize: "0.72rem" }}>
                        {node.id}
                      </span>
                      <span className="text-[rgba(0,212,255,0.25)] shrink-0 hidden sm:inline" style={{ fontSize: "0.58rem" }}>
                        {node.info}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "alerts" && (
            <div>
              <span className="text-[rgba(0,212,255,0.5)] mb-2 block" style={{ fontSize: "0.72rem" }}>
                {t("monitor.activeAlerts")} ({mockAlerts.length})
              </span>
              <div className="space-y-1">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => navigate("/follow-up")}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,40,80,0.08)] hover:bg-[rgba(0,40,80,0.2)] transition-all cursor-pointer group"
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: levelColor[alert.level] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#c0dcf0] truncate" style={{ fontSize: "0.72rem" }}>
                        {alert.msg}
                      </p>
                      <p className="text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.58rem" }}>
                        #{alert.id}
                      </p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-[rgba(0,212,255,0.2)] group-hover:text-[#00d4ff] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "operations" && (
            <div>
              <span className="text-[rgba(0,212,255,0.5)] mb-2 block" style={{ fontSize: "0.72rem" }}>
                {t("operations.quickActions")}
              </span>
              <div className="space-y-1">
                {mockQuickOps.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => navigate("/operations")}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-[rgba(0,40,80,0.08)] hover:bg-[rgba(0,40,80,0.2)] transition-all text-left group"
                  >
                    <Settings className="w-3 h-3 text-[rgba(0,212,255,0.4)] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[#c0dcf0]" style={{ fontSize: "0.72rem" }}>{op.label}</p>
                      <p className="text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.58rem" }}>{op.desc}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-[rgba(0,212,255,0.2)] group-hover:text-[#00d4ff] transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 px-3 py-2 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[#00d4ff] text-center hover:bg-[rgba(0,212,255,0.15)] transition-all"
                  style={{ fontSize: "0.68rem" }}
                >
                  {t("monitor.openBrowser")}
                </button>
                <button
                  onClick={() => navigate("/operations")}
                  className="flex-1 px-3 py-2 rounded-lg bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)] text-[rgba(0,212,255,0.5)] text-center hover:text-[#00d4ff] transition-all"
                  style={{ fontSize: "0.68rem" }}
                >
                  {t("operations.title")}
                </button>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div>
              <span className="text-[rgba(0,212,255,0.5)] mb-2 block" style={{ fontSize: "0.72rem" }}>
                {t("monitor.recentLogs")}
              </span>
              <div className="space-y-0.5">
                {mockLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[rgba(0,40,80,0.15)] transition-all"
                  >
                    <span
                      className="shrink-0"
                      style={{
                        fontSize: "0.6rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(0,212,255,0.3)",
                      }}
                    >
                      {log.time}
                    </span>
                    {log.ok ? (
                      <CheckCircle className="w-2.5 h-2.5 text-[#00ff88] shrink-0" />
                    ) : (
                      <XCircle className="w-2.5 h-2.5 text-[#ff3366] shrink-0" />
                    )}
                    <span className="text-[#c0dcf0] flex-1 truncate" style={{ fontSize: "0.68rem" }}>
                      {log.msg}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}