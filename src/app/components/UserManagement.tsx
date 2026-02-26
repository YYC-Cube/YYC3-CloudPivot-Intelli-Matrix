import { useState } from "react";
import {
  Users, UserPlus, Search, Shield, ShieldCheck, ShieldAlert, Crown,
  Edit2, Lock, Activity,
  Eye, XCircle
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { useI18n } from "../hooks/useI18n";

const users = [
  { id: 1, name: "张管理", username: "admin", email: "admin@cloudpivot.ai", role: "超级管理员", status: "online", lastLogin: "2026-02-22 14:30", sessions: 3, apiCalls: 1284 },
  { id: 2, name: "李运维", username: "ops_li", email: "ops_li@cloudpivot.ai", role: "运维工程师", status: "online", lastLogin: "2026-02-22 14:25", sessions: 1, apiCalls: 856 },
  { id: 3, name: "王开发", username: "dev_wang", email: "dev_wang@cloudpivot.ai", role: "开发者", status: "online", lastLogin: "2026-02-22 14:18", sessions: 2, apiCalls: 2105 },
  { id: 4, name: "赵分析", username: "analyst_zhao", email: "zhao@cloudpivot.ai", role: "数据分析师", status: "online", lastLogin: "2026-02-22 13:55", sessions: 1, apiCalls: 432 },
  { id: 5, name: "刘测试", username: "qa_liu", email: "qa_liu@cloudpivot.ai", role: "测试工程师", status: "offline", lastLogin: "2026-02-21 18:30", sessions: 0, apiCalls: 321 },
  { id: 6, name: "陈研究", username: "dev_chen", email: "chen@cloudpivot.ai", role: "AI 研究员", status: "offline", lastLogin: "2026-02-21 17:45", sessions: 0, apiCalls: 1567 },
  { id: 7, name: "API Service", username: "api_svc", email: "svc@cloudpivot.ai", role: "系统服务", status: "online", lastLogin: "2026-02-22 14:32", sessions: 12, apiCalls: 48920 },
  { id: 8, name: "OPS Bot", username: "ops_bot", email: "bot@cloudpivot.ai", role: "自动化运维", status: "online", lastLogin: "2026-02-22 14:32", sessions: 1, apiCalls: 15240 },
];

const roles = [
  { name: "超级管理员", count: 1, color: "#ff3366", icon: Crown, perms: "全部权限" },
  { name: "运维工程师", count: 3, color: "#ff6600", icon: ShieldAlert, perms: "节点管理、部署、监控" },
  { name: "开发者", count: 8, color: "#00d4ff", icon: ShieldCheck, perms: "模型调用、日志查看" },
  { name: "数据分析师", count: 4, color: "#00ff88", icon: Shield, perms: "数据查看、报表导出" },
  { name: "系统服务", count: 2, color: "#aa55ff", icon: Shield, perms: "API 调用、推理执行" },
];

export function UserManagement() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<typeof users[0] | null>(null);

  const filteredUsers = users.filter(u =>
    u.name.includes(searchQuery) || u.username.includes(searchQuery) || u.email.includes(searchQuery)
  );

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
        {[
          { label: t("userMgmt.totalUsers"), value: "24", color: "#00d4ff", icon: Users },
          { label: t("userMgmt.onlineUsers"), value: "18", color: "#00ff88", icon: Activity },
          { label: t("userMgmt.admins"), value: "2", color: "#ff3366", icon: Crown },
          { label: t("userMgmt.serviceAccounts"), value: "4", color: "#aa55ff", icon: Shield },
          { label: t("userMgmt.todayApiCalls"), value: "72.4K", color: "#ffdd00", icon: Activity },
        ].map((s) => (
          <GlassCard key={s.label} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
            </div>
            <div style={{ fontSize: "1.4rem", color: s.color, fontFamily: "'Orbitron', sans-serif" }}>{s.value}</div>
            <div className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3">
        {/* Users Table */}
        <GlassCard className="lg:col-span-8 p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#00d4ff]" />
              <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.9rem" }}>{t("userMgmt.userList")}</h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("userMgmt.searchUser")}
                  className="pl-8 pr-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.3)] focus:outline-none focus:border-[rgba(0,212,255,0.4)]"
                  style={{ fontSize: "0.75rem", width: "180px" }}
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] transition-all" style={{ fontSize: "0.75rem" }}>
                <UserPlus className="w-3.5 h-3.5" />
                {t("userMgmt.addUser")}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[rgba(0,180,255,0.08)]">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-[rgba(0,40,80,0.3)]">
                  {[t("userMgmt.colStatus"), t("userMgmt.colUser"), t("userMgmt.colRole"), t("userMgmt.colLastLogin"), t("userMgmt.colSessions"), t("userMgmt.colApiCalls"), t("userMgmt.colActions")].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.7rem" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-[rgba(0,180,255,0.05)] hover:bg-[rgba(0,180,255,0.03)] transition-colors">
                    <td className="px-3 py-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${user.status === "online" ? "bg-[#00ff88] shadow-[0_0_6px_rgba(0,255,136,0.5)]" : "bg-[rgba(0,212,255,0.2)]"}`} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[rgba(0,212,255,0.3)] to-[rgba(170,85,255,0.3)] flex items-center justify-center border border-[rgba(0,180,255,0.15)]">
                          <span className="text-[#e0f0ff]" style={{ fontSize: "0.7rem" }}>{user.name.slice(0, 1)}</span>
                        </div>
                        <div>
                          <div className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>{user.name}</div>
                          <div className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.62rem" }}>{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded ${
                        user.role === "超级管理员" ? "bg-[rgba(255,51,102,0.1)] text-[#ff3366]" :
                        user.role === "运维工程师" || user.role === "自动化运维" ? "bg-[rgba(255,102,0,0.1)] text-[#ff6600]" :
                        user.role === "开发者" || user.role === "AI 研究员" || user.role === "测试工程师" ? "bg-[rgba(0,212,255,0.1)] text-[#00d4ff]" :
                        user.role === "系统服务" ? "bg-[rgba(170,85,255,0.1)] text-[#aa55ff]" :
                        "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                      }`} style={{ fontSize: "0.65rem" }}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.72rem" }}>{user.lastLogin}</td>
                    <td className="px-3 py-2.5 text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>{user.sessions}</td>
                    <td className="px-3 py-2.5 text-[#00d4ff]" style={{ fontSize: "0.78rem", fontFamily: "'Orbitron', sans-serif" }}>{user.apiCalls.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedUser(user)} className="p-1 rounded hover:bg-[rgba(0,212,255,0.1)] transition-all">
                          <Eye className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                        </button>
                        <button className="p-1 rounded hover:bg-[rgba(0,212,255,0.1)] transition-all">
                          <Edit2 className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                        </button>
                        <button className="p-1 rounded hover:bg-[rgba(255,51,102,0.1)] transition-all">
                          <Lock className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Roles Panel */}
        <GlassCard className="lg:col-span-4 p-3 md:p-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-[#aa55ff]" />
            <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.9rem" }}>{t("userMgmt.rolesPerms")}</h3>
          </div>
          <div className="space-y-2.5">
            {roles.map((role) => (
              <div key={role.name} className="p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,180,255,0.2)] transition-all cursor-pointer">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${role.color}15` }}>
                    <role.icon className="w-4 h-4" style={{ color: role.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#c0dcf0]" style={{ fontSize: "0.8rem" }}>{role.name}</span>
                      <span style={{ fontSize: "0.75rem", color: role.color, fontFamily: "'Orbitron', sans-serif" }}>{role.count}</span>
                    </div>
                  </div>
                </div>
                <p className="text-[rgba(0,212,255,0.35)] ml-10" style={{ fontSize: "0.68rem" }}>{role.perms}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-4 space-y-2">
            <button className="w-full py-2.5 rounded-xl bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.15)] transition-all" style={{ fontSize: "0.78rem" }}>
              + {t("userMgmt.createRole")}
            </button>
            <button className="w-full py-2.5 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] transition-all" style={{ fontSize: "0.78rem" }}>
              {t("userMgmt.permMatrix")}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-0" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm" />
          <div className="relative w-full max-w-[480px] max-h-[85vh] overflow-auto rounded-2xl bg-[rgba(8,25,55,0.9)] backdrop-blur-2xl border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.1)] p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#e0f0ff]" style={{ fontSize: "1rem" }}>{t("userMgmt.userDetail")}</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]">
                <XCircle className="w-5 h-5 text-[rgba(0,212,255,0.4)]" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[rgba(0,212,255,0.4)] to-[rgba(170,85,255,0.4)] flex items-center justify-center border border-[rgba(0,180,255,0.2)]">
                <span className="text-[#e0f0ff]" style={{ fontSize: "1.2rem" }}>{selectedUser.name.slice(0, 1)}</span>
              </div>
              <div>
                <h4 className="text-[#e0f0ff]" style={{ fontSize: "1rem" }}>{selectedUser.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.75rem" }}>@{selectedUser.username}</span>
                  <div className={`w-2 h-2 rounded-full ${selectedUser.status === "online" ? "bg-[#00ff88]" : "bg-[rgba(0,212,255,0.2)]"}`} />
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { k: t("userMgmt.fieldEmail"), v: selectedUser.email },
                { k: t("userMgmt.fieldRole"), v: selectedUser.role },
                { k: t("userMgmt.fieldLastLogin"), v: selectedUser.lastLogin },
                { k: t("userMgmt.fieldSessions"), v: t("userMgmt.sessionsUnit").replace("{n}", String(selectedUser.sessions)) },
                { k: t("userMgmt.fieldApiCalls"), v: t("userMgmt.apiCallsUnit").replace("{n}", selectedUser.apiCalls.toLocaleString()) },
              ].map((row) => (
                <div key={row.k} className="flex items-center justify-between py-2 border-b border-[rgba(0,180,255,0.06)]">
                  <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.78rem" }}>{row.k}</span>
                  <span className="text-[#c0dcf0]" style={{ fontSize: "0.78rem" }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button className="flex-1 py-2 rounded-xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] text-[#00d4ff] hover:bg-[rgba(0,212,255,0.2)] transition-all" style={{ fontSize: "0.8rem" }}>
                {t("userMgmt.editInfo")}
              </button>
              <button className="flex-1 py-2 rounded-xl bg-[rgba(255,51,102,0.08)] border border-[rgba(255,51,102,0.2)] text-[#ff3366] hover:bg-[rgba(255,51,102,0.15)] transition-all" style={{ fontSize: "0.8rem" }}>
                {t("userMgmt.disableAccount")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}