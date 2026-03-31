/**
 * FamilyEcosystem.tsx
 * ===================
 * AI Family 生态中心 —— 数字生态全景
 * 生态概览 · 服务集成 · 开放平台 · 生态伙伴
 */

import { useState } from "react";
import {
  Network, Zap, Shield, TrendingUp,
  Users, Code2, Database, Cpu, BarChart3,
  ChevronRight, CheckCircle2,
  RefreshCcw, Settings, Link2, Sparkles,
} from "lucide-react";
import { GlassCard } from "../GlassCard";
import { FadeIn } from "./FadeIn";
import { hexToRgb } from "./shared";

const ECOSYSTEM_STATS = [
  { label: "生态节点", value: "156", trend: "+12%", icon: Network, color: "#00FF88" },
  { label: "活跃服务", value: "89", trend: "+8%", icon: Zap, color: "#00BFFF" },
  { label: "API调用", value: "2.4M", trend: "+23%", icon: Code2, color: "#FF69B4" },
  { label: "生态伙伴", value: "42", trend: "+5%", icon: Users, color: "#FF7043" },
];

const ECOSYSTEM_SERVICES = [
  {
    id: "ai-engine",
    name: "AI 引擎",
    desc: "智能推理 · 模型服务 · 算力调度",
    status: "active",
    uptime: "99.9%",
    icon: Cpu,
    color: "#00FF88",
  },
  {
    id: "data-platform",
    name: "数据平台",
    desc: "数据湖 · 实时流 · 分析引擎",
    status: "active",
    uptime: "99.8%",
    icon: Database,
    color: "#00BFFF",
  },
  {
    id: "security-center",
    name: "安全中心",
    desc: "威胁检测 · 访问控制 · 审计日志",
    status: "active",
    uptime: "100%",
    icon: Shield,
    color: "#FF69B4",
  },
  {
    id: "monitor-system",
    name: "监控系统",
    desc: "性能监控 · 告警管理 · 可视化",
    status: "active",
    uptime: "99.7%",
    icon: BarChart3,
    color: "#FF7043",
  },
];

const PARTNERS = [
  { name: "YYC³ Cloud", type: "云服务", status: "active", logo: "☁️" },
  { name: "Intelli Matrix", type: "AI平台", status: "active", logo: "🧠" },
  { name: "Data Pivot", type: "数据中台", status: "active", logo: "📊" },
  { name: "Security Hub", type: "安全服务", status: "active", logo: "🛡️" },
];

export function FamilyEcosystem() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  return (
    <FadeIn>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">生态中心</h1>
              <p className="text-white/50 text-sm">数字生态全景 · 开放互联</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-cyan-300 hover:bg-[rgba(0,212,255,0.2)] transition-all disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              刷新数据
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ECOSYSTEM_STATS.map((stat, index) => (
              <GlassCard key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: `rgba(${hexToRgb(stat.color)}, 0.1)` }}
                  >
                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    {stat.trend}
                  </span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </GlassCard>
            ))}
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">核心服务</h2>
              <button className="flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
                <Settings className="w-4 h-4" />
                管理服务
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ECOSYSTEM_SERVICES.map((service, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-[rgba(255,255,255,0.05)] hover:border-[rgba(0,212,255,0.3)] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{ background: `rgba(${hexToRgb(service.color)}, 0.1)` }}
                    >
                      <service.icon className="w-5 h-5" style={{ color: service.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-white font-medium">{service.name}</h3>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs text-emerald-400">{service.status}</span>
                        </div>
                      </div>
                      <p className="text-sm text-white/50 mb-2">{service.desc}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/30">运行时间: {service.uptime}</span>
                        <button className="text-cyan-300 hover:text-cyan-200 flex items-center gap-1">
                          查看详情 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">生态伙伴</h2>
                <button className="text-sm text-cyan-300 hover:text-cyan-200">查看全部</button>
              </div>
              <div className="space-y-3">
                {PARTNERS.map((partner, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border border-[rgba(255,255,255,0.05)] hover:border-[rgba(0,212,255,0.3)] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.1)] flex items-center justify-center text-xl">
                        {partner.logo}
                      </div>
                      <div>
                        <div className="text-white font-medium">{partner.name}</div>
                        <div className="text-sm text-white/50">{partner.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400">{partner.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">开放平台</h2>
                <button className="flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200">
                  <Link2 className="w-4 h-4" />
                  API 文档
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <h3 className="text-white font-medium">开发者接入</h3>
                  </div>
                  <p className="text-sm text-white/50 mb-3">
                    通过开放 API 快速接入 AI Family 生态，享受智能服务
                  </p>
                  <button className="w-full py-2 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-cyan-300 hover:bg-[rgba(0,212,255,0.2)] transition-all text-sm">
                    立即接入
                  </button>
                </div>

                <div className="p-4 rounded-lg border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-white font-medium">生态增长</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xl font-bold text-white">2.4M</div>
                      <div className="text-xs text-white/50">API 调用/月</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-white">42</div>
                      <div className="text-xs text-white/50">生态伙伴</div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}
