import { X, Cpu, Thermometer, HardDrive, Activity, Clock, Server } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import type { NodeData } from "../types";

interface NodeDetailModalProps {
  node: NodeData;
  onClose: () => void;
}

const historyData = [
  { time: "12:00", gpu: 72, mem: 58, temp: 60 },
  { time: "12:30", gpu: 78, mem: 62, temp: 63 },
  { time: "13:00", gpu: 85, mem: 70, temp: 66 },
  { time: "13:30", gpu: 82, mem: 68, temp: 65 },
  { time: "14:00", gpu: 90, mem: 75, temp: 70 },
  { time: "14:30", gpu: 87, mem: 72, temp: 68 },
];

const tooltipStyle = {
  backgroundColor: "rgba(8, 25, 55, 0.95)",
  border: "1px solid rgba(0, 180, 255, 0.3)",
  borderRadius: "8px",
  color: "#e0f0ff",
  fontSize: "0.7rem",
  fontFamily: "'Rajdhani', sans-serif",
};

export function NodeDetailModal({ node, onClose }: NodeDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-0" onClick={onClose}>
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[600px] max-h-[85vh] overflow-auto rounded-2xl bg-[rgba(8,25,55,0.9)] backdrop-blur-2xl border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.1)] p-4 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)]">
              <Server className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <h2 className="text-[#e0f0ff]" style={{ fontSize: "1.1rem" }}>{node.id}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  node.status === "active" ? "bg-[#00ff88]" :
                  node.status === "warning" ? "bg-[#ffdd00]" : "bg-[#ff3366]"
                }`} />
                <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.75rem" }}>
                  {node.status === "active" ? "运行中" : node.status === "warning" ? "预警" : "离线"}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition-all">
            <X className="w-5 h-5 text-[rgba(0,212,255,0.5)]" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "GPU 负载", value: `${node.gpu}%`, icon: Cpu, color: "#00d4ff" },
            { label: "内存使用", value: `${node.mem}%`, icon: HardDrive, color: "#aa55ff" },
            { label: "温度", value: `${node.temp}°C`, icon: Thermometer, color: node.temp > 75 ? "#ff3366" : "#00ff88" },
            { label: "任务数", value: `${node.tasks}`, icon: Activity, color: "#ffdd00" },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-xl bg-[rgba(0,40,80,0.3)] border border-[rgba(0,180,255,0.1)]">
              <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
              <div style={{ fontSize: "1.2rem", color: stat.color, fontFamily: "'Orbitron', sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.7rem" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Model Info */}
        <div className="p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
            <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.75rem" }}>当前模型</span>
          </div>
          <span className="text-[#00d4ff]" style={{ fontSize: "0.9rem" }}>{node.model}</span>
        </div>

        {/* History Chart */}
        <div>
          <h4 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.85rem" }}>历史负载趋势</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,180,255,0.08)" />
              <XAxis dataKey="time" tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10 }} axisLine={{ stroke: "rgba(0,180,255,0.1)" }} />
              <YAxis tick={{ fill: "rgba(0,212,255,0.4)", fontSize: 10 }} axisLine={{ stroke: "rgba(0,180,255,0.1)" }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="gpu" stroke="#00d4ff" strokeWidth={2} dot={{ r: 3, fill: "#00d4ff" }} name="GPU" />
              <Line type="monotone" dataKey="mem" stroke="#aa55ff" strokeWidth={2} dot={{ r: 3, fill: "#aa55ff" }} name="内存" />
              <Line type="monotone" dataKey="temp" stroke="#ff6600" strokeWidth={2} dot={{ r: 3, fill: "#ff6600" }} name="温度" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 mt-6">
          <button className="flex-1 py-2.5 rounded-xl bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] transition-all min-h-[44px]" style={{ fontSize: "0.85rem" }}>
            查看日志
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-[rgba(0,255,136,0.1)] border border-[rgba(0,255,136,0.2)] text-[#00ff88] hover:bg-[rgba(0,255,136,0.18)] transition-all min-h-[44px]" style={{ fontSize: "0.85rem" }}>
            重启节点
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.2)] text-[#ff3366] hover:bg-[rgba(255,51,102,0.15)] transition-all min-h-[44px]" style={{ fontSize: "0.85rem" }}>
            移除节点
          </button>
        </div>
      </div>
    </div>
  );
}