/**
 * UnifiedSettingsPanel.tsx
 * ========================
 * 统一设置管理面板
 *
 * 功能:
 * 1. 展示所有存储的数据
 * 2. 提供CRUD操作
 * 3. 支持数据导入导出
 * 4. 显示数据统计信息
 *
 * 特点:
 * - 纯本地化，不上传任何数据
 * - 一用户一端，完全隔离
 * - 开源透明，无隐藏收集
 */

import { useState, useCallback } from "react";
import {
  useGlobalStore,
  useModelProviders,
  useOllamaInstances,
  useDBConnections,
  useAlertRules,
  usePatrolConfigs,
} from "../contexts/GlobalStoreContext";
import { GlassCard } from "./GlassCard";
import {
  Database,
  Server,
  Brain,
  AlertTriangle,
  Eye,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  XCircle,
  Settings,
  BarChart3,
  Shield,
  HardDrive,
  Edit3,
} from "lucide-react";

type TabKey = "overview" | "models" | "ollama" | "database" | "alerts" | "patrols" | "import-export";

export default function UnifiedSettingsPanel() {
  const globalStore = useGlobalStore();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  const tabs: { key: TabKey; label: string; icon: typeof Database }[] = [
    { key: "overview", label: "数据概览", icon: BarChart3 },
    { key: "models", label: "模型配置", icon: Brain },
    { key: "ollama", label: "Ollama", icon: Server },
    { key: "database", label: "数据库", icon: Database },
    { key: "alerts", label: "告警规则", icon: AlertTriangle },
    { key: "patrols", label: "巡查配置", icon: Eye },
    { key: "import-export", label: "导入导出", icon: HardDrive },
  ];

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#00d4ff]" />
          <h1 className="text-lg font-medium text-[#e0f0ff]">统一数据管理</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[rgba(0,212,255,0.5)]">
          <Shield className="w-3.5 h-3.5" />
          <span>本地存储 · 无上传 · 开源透明</span>
        </div>
      </div>

      {/* 标签栏 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-[rgba(0,212,255,0.1)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]"
                : "text-[rgba(0,212,255,0.35)] border border-transparent hover:border-[rgba(0,180,255,0.12)]"
            }`}
            style={{ fontSize: "0.75rem" }}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-auto">
        {activeTab === "overview" && <OverviewTab globalStore={globalStore} />}
        {activeTab === "models" && <ModelsTab />}
        {activeTab === "ollama" && <OllamaTab />}
        {activeTab === "database" && <DatabaseTab />}
        {activeTab === "alerts" && <AlertsTab />}
        {activeTab === "patrols" && <PatrolsTab />}
        {activeTab === "import-export" && <ImportExportTab globalStore={globalStore} />}
      </div>
    </div>
  );
}

// ============================================================
// 数据概览标签
// ============================================================

function OverviewTab({ globalStore }: { globalStore: ReturnType<typeof useGlobalStore> }) {
  const stats = globalStore.stats;

  const statCards = [
    { label: "模型配置", value: globalStore.modelProviders.length, color: "#00d4ff", icon: Brain },
    { label: "Ollama实例", value: globalStore.ollamaInstances.length, color: "#00ff88", icon: Server },
    { label: "数据库连接", value: globalStore.dbConnections.length, color: "#7b8cff", icon: Database },
    { label: "告警规则", value: globalStore.alertRules.length, color: "#ffaa00", icon: AlertTriangle },
    { label: "巡查配置", value: globalStore.patrolConfigs.length, color: "#ff6b9d", icon: Eye },
    { label: "操作历史", value: globalStore.operationHistory.length, color: "#aa77ff", icon: RefreshCw },
  ];

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
          <GlassCard key={stat.label} className="p-4 text-center">
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </p>
            <p className="text-xs text-[rgba(0,212,255,0.5)]">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      {/* 系统信息 */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-[#e0f0ff] mb-3">系统信息</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <p className="text-[rgba(0,212,255,0.5)]">存储数量</p>
            <p className="text-[#e0f0ff]">{stats.totalStores} 个</p>
          </div>
          <div>
            <p className="text-[rgba(0,212,255,0.5)]">总数据项</p>
            <p className="text-[#e0f0ff]">{stats.totalItems} 条</p>
          </div>
          <div>
            <p className="text-[rgba(0,212,255,0.5)]">最后同步</p>
            <p className="text-[#e0f0ff]">{new Date(stats.lastSync).toLocaleString("zh-CN")}</p>
          </div>
          <div>
            <p className="text-[rgba(0,212,255,0.5)]">数据位置</p>
            <p className="text-[#e0f0ff]">本地 localStorage</p>
          </div>
        </div>
      </GlassCard>

      {/* 安全提示 */}
      <GlassCard className="p-4 border-[rgba(0,255,136,0.2)]">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-[#00ff88] mb-1">数据安全说明</h3>
            <ul className="text-xs text-[rgba(0,212,255,0.6)] space-y-1">
              <li>• 所有数据存储在您的浏览器本地，不上传任何服务器</li>
              <li>• 项目完全开源，代码透明可审计</li>
              <li>• 一用户一端，数据完全隔离</li>
              <li>• 支持数据导出备份，随时迁移</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ============================================================
// 模型配置标签
// ============================================================

function ModelsTab() {
  const { modelProviders, addModelProvider, updateModelProvider, removeModelProvider } = useModelProviders();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    providerId: "openai",
    providerLabel: "OpenAI",
    model: "",
    apiKey: "",
    baseUrl: "",
  });

  const providers = [
    { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1" },
    { id: "zhipu", label: "Z.ai", baseUrl: "https://open.bigmodel.cn/api/paas/v4" },
    { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1" },
    { id: "kimi-cn", label: "Kimi (国内)", baseUrl: "https://api.moonshot.cn/v1" },
    { id: "ollama", label: "Ollama (本地)", baseUrl: "http://localhost:11434" },
  ];

  const handleAdd = () => {
    if (!formData.model || !formData.apiKey) {return;}

    addModelProvider({
      providerId: formData.providerId,
      providerLabel: formData.providerLabel,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
      createdAt: Date.now(),
      lastUsed: null,
      status: "unchecked",
    });

    setFormData({ providerId: "openai", providerLabel: "OpenAI", model: "", apiKey: "", baseUrl: "" });
    setShowAddForm(false);
  };

  const handleEdit = (model: typeof modelProviders[0]) => {
    setEditingId(model.id);
    setFormData({
      providerId: model.providerId,
      providerLabel: model.providerLabel,
      model: model.model,
      apiKey: model.apiKey,
      baseUrl: model.baseUrl,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.model) {return;}

    updateModelProvider(editingId, {
      providerId: formData.providerId,
      providerLabel: formData.providerLabel,
      model: formData.model,
      apiKey: formData.apiKey,
      baseUrl: formData.baseUrl,
    });

    setEditingId(null);
    setFormData({ providerId: "openai", providerLabel: "OpenAI", model: "", apiKey: "", baseUrl: "" });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ providerId: "openai", providerLabel: "OpenAI", model: "", apiKey: "", baseUrl: "" });
    setShowAddForm(false);
  };

  const handleProviderChange = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId);
    if (provider) {
      setFormData({
        ...formData,
        providerId: provider.id,
        providerLabel: provider.label,
        baseUrl: provider.baseUrl,
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* 添加按钮 */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-[rgba(0,212,255,0.5)]">{modelProviders.length} 个模型配置</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> 添加模型
        </button>
      </div>

      {/* 添加/编辑表单 */}
      {showAddForm && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#e0f0ff]">{editingId ? "编辑模型配置" : "添加模型配置"}</span>
            <button onClick={handleCancelEdit} className="text-[rgba(0,212,255,0.3)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">服务商</label>
              <select
                value={formData.providerId}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">模型名称</label>
              <input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="gpt-4o"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[rgba(0,212,255,0.5)]">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[rgba(0,212,255,0.5)]">Base URL</label>
              <input
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg text-[rgba(0,212,255,0.4)] text-xs">
              取消
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs"
            >
              {editingId ? "保存" : "添加"}
            </button>
          </div>
        </GlassCard>
      )}

      {/* 模型列表 */}
      {modelProviders.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-[rgba(0,212,255,0.15)]" />
          <p className="text-sm text-[#e0f0ff]">暂无模型配置</p>
          <p className="text-xs text-[rgba(0,212,255,0.4)]">点击"添加模型"开始配置</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {modelProviders.map((model) => (
            <GlassCard key={model.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#e0f0ff]">{model.model}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        model.status === "active"
                          ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                          : model.status === "error"
                            ? "bg-[rgba(255,60,60,0.1)] text-[#ff6464]"
                            : "bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.5)]"
                      }`}
                    >
                      {model.status === "active" ? "正常" : model.status === "error" ? "错误" : "未测试"}
                    </span>
                    {model.latency && <span className="text-xs text-[rgba(0,212,255,0.4)]">{model.latency}ms</span>}
                  </div>
                  <p className="text-xs text-[rgba(0,212,255,0.4)] mt-1">
                    {model.providerLabel} · {model.baseUrl}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(model)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.4)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeModelProvider(model.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,60,60,0.1)] text-[rgba(255,100,100,0.4)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Ollama标签
// ============================================================

function OllamaTab() {
  const { ollamaInstances, addOllamaInstance, updateOllamaInstance, removeOllamaInstance } = useOllamaInstances();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    baseUrl: "http://localhost:11434",
  });

  const handleAdd = () => {
    if (!formData.name || !formData.baseUrl) {return;}

    addOllamaInstance({
      name: formData.name,
      baseUrl: formData.baseUrl,
      status: "offline",
      autoDiscovery: true,
    });

    setFormData({ name: "", baseUrl: "http://localhost:11434" });
    setShowAddForm(false);
  };

  const handleEdit = (instance: typeof ollamaInstances[0]) => {
    setEditingId(instance.id);
    setFormData({
      name: instance.name,
      baseUrl: instance.baseUrl,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name) {return;}

    updateOllamaInstance(editingId, {
      name: formData.name,
      baseUrl: formData.baseUrl,
    });

    setEditingId(null);
    setFormData({ name: "", baseUrl: "http://localhost:11434" });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", baseUrl: "http://localhost:11434" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[rgba(0,212,255,0.5)]">{ollamaInstances.length} 个实例</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> 添加实例
        </button>
      </div>

      {showAddForm && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#e0f0ff]">{editingId ? "编辑实例" : "添加实例"}</span>
            <button onClick={handleCancelEdit} className="text-[rgba(0,212,255,0.3)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">实例名称</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="本地 Ollama"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">Base URL</label>
              <input
                value={formData.baseUrl}
                onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg text-[rgba(0,212,255,0.4)] text-xs">
              取消
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs"
            >
              {editingId ? "保存" : "添加"}
            </button>
          </div>
        </GlassCard>
      )}

      {ollamaInstances.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Server className="w-12 h-12 mx-auto mb-4 text-[rgba(0,212,255,0.15)]" />
          <p className="text-sm text-[#e0f0ff]">暂无Ollama实例</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {ollamaInstances.map((instance) => (
            <GlassCard key={instance.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#e0f0ff]">{instance.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        instance.status === "online"
                          ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                          : "bg-[rgba(255,60,60,0.1)] text-[#ff6464]"
                      }`}
                    >
                      {instance.status === "online" ? "在线" : "离线"}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(0,212,255,0.4)] mt-1">{instance.baseUrl}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(instance)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.4)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeOllamaInstance(instance.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,60,60,0.1)] text-[rgba(255,100,100,0.4)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 数据库标签
// ============================================================

function DatabaseTab() {
  const { dbConnections, addDBConnection, updateDBConnection, removeDBConnection } = useDBConnections();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "postgresql" as "postgresql" | "mysql" | "sqlite" | "redis" | "mongodb" | "custom",
    host: "localhost",
    port: "5432",
    database: "",
    username: "",
    password: "",
  });

  const handleAdd = () => {
    if (!formData.name || !formData.host) {return;}

    addDBConnection({
      name: formData.name,
      type: formData.type,
      host: formData.host,
      port: parseInt(formData.port) || 5432,
      database: formData.database,
      username: formData.username,
      password: formData.password,
      status: "disconnected",
    });

    setFormData({ name: "", type: "postgresql", host: "localhost", port: "5432", database: "", username: "", password: "" });
    setShowAddForm(false);
  };

  const handleEdit = (conn: typeof dbConnections[0]) => {
    setEditingId(conn.id);
    setFormData({
      name: conn.name,
      type: conn.type,
      host: conn.host,
      port: conn.port.toString(),
      database: conn.database,
      username: conn.username,
      password: conn.password,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name) {return;}

    updateDBConnection(editingId, {
      name: formData.name,
      type: formData.type,
      host: formData.host,
      port: parseInt(formData.port) || 5432,
      database: formData.database,
      username: formData.username,
      password: formData.password,
    });

    setEditingId(null);
    setFormData({ name: "", type: "postgresql", host: "localhost", port: "5432", database: "", username: "", password: "" });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", type: "postgresql", host: "localhost", port: "5432", database: "", username: "", password: "" });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[rgba(0,212,255,0.5)]">{dbConnections.length} 个连接</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> 添加连接
        </button>
      </div>

      {showAddForm && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#e0f0ff]">{editingId ? "编辑连接" : "添加连接"}</span>
            <button onClick={handleCancelEdit} className="text-[rgba(0,212,255,0.3)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">连接名称</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">数据库类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              >
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="redis">Redis</option>
                <option value="mongodb">MongoDB</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">主机地址</label>
              <input
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">端口</label>
              <input
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">数据库名</label>
              <input
                value={formData.database}
                onChange={(e) => setFormData({ ...formData, database: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">用户名</label>
              <input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[rgba(0,212,255,0.5)]">密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg text-[rgba(0,212,255,0.4)] text-xs">
              取消
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs"
            >
              {editingId ? "保存" : "添加"}
            </button>
          </div>
        </GlassCard>
      )}

      {dbConnections.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-[rgba(0,212,255,0.15)]" />
          <p className="text-sm text-[#e0f0ff]">暂无数据库连接</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {dbConnections.map((conn) => (
            <GlassCard key={conn.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#e0f0ff]">{conn.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        conn.status === "connected"
                          ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88]"
                          : "bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.5)]"
                      }`}
                    >
                      {conn.status === "connected" ? "已连接" : "未连接"}
                    </span>
                  </div>
                  <p className="text-xs text-[rgba(0,212,255,0.4)] mt-1">
                    {conn.type} · {conn.host}:{conn.port} · {conn.database}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(conn)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.4)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeDBConnection(conn.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,60,60,0.1)] text-[rgba(255,100,100,0.4)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 告警规则标签
// ============================================================

function AlertsTab() {
  const { alertRules, addAlertRule, updateAlertRule, removeAlertRule } = useAlertRules();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    condition: "",
    threshold: 80,
    severity: "warning" as "info" | "warning" | "error" | "critical",
    enabled: true,
  });

  const handleAdd = () => {
    if (!formData.name) {return;}

    addAlertRule({
      name: formData.name,
      condition: formData.condition,
      threshold: formData.threshold,
      severity: formData.severity,
      enabled: formData.enabled,
      notifyChannels: ["toast", "log"],
      createdAt: Date.now(),
    });

    setFormData({ name: "", condition: "", threshold: 80, severity: "warning", enabled: true });
    setShowAddForm(false);
  };

  const handleEdit = (rule: typeof alertRules[0]) => {
    setEditingId(rule.id);
    setFormData({
      name: rule.name,
      condition: rule.condition,
      threshold: rule.threshold,
      severity: rule.severity,
      enabled: rule.enabled,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name) {return;}

    updateAlertRule(editingId, {
      name: formData.name,
      condition: formData.condition,
      threshold: formData.threshold,
      severity: formData.severity,
      enabled: formData.enabled,
    });

    setEditingId(null);
    setFormData({ name: "", condition: "", threshold: 80, severity: "warning", enabled: true });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", condition: "", threshold: 80, severity: "warning", enabled: true });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[rgba(0,212,255,0.5)]">{alertRules.length} 条规则</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> 添加规则
        </button>
      </div>

      {showAddForm && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#e0f0ff]">{editingId ? "编辑规则" : "添加规则"}</span>
            <button onClick={handleCancelEdit} className="text-[rgba(0,212,255,0.3)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">规则名称</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">严重级别</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as "info" | "warning" | "error" | "critical" })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              >
                <option value="info">信息</option>
                <option value="warning">警告</option>
                <option value="error">错误</option>
                <option value="critical">严重</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-[rgba(0,212,255,0.5)]">阈值</label>
              <input
                type="number"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: parseInt(e.target.value) || 0 })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg text-[rgba(0,212,255,0.4)] text-xs">
              取消
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs"
            >
              {editingId ? "保存" : "添加"}
            </button>
          </div>
        </GlassCard>
      )}

      {alertRules.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[rgba(0,212,255,0.15)]" />
          <p className="text-sm text-[#e0f0ff]">暂无告警规则</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {alertRules.map((rule) => (
            <GlassCard key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#e0f0ff]">{rule.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        rule.severity === "critical"
                          ? "bg-[rgba(255,60,60,0.1)] text-[#ff6464]"
                          : rule.severity === "error"
                            ? "bg-[rgba(255,170,0,0.1)] text-[#ffaa00]"
                            : "bg-[rgba(0,212,255,0.1)] text-[#00d4ff]"
                      }`}
                    >
                      {rule.severity}
                    </span>
                    {!rule.enabled && <span className="text-xs text-[rgba(0,212,255,0.3)]">已禁用</span>}
                  </div>
                  <p className="text-xs text-[rgba(0,212,255,0.4)] mt-1">阈值: {rule.threshold}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.4)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeAlertRule(rule.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,60,60,0.1)] text-[rgba(255,100,100,0.4)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 巡查配置标签
// ============================================================

function PatrolsTab() {
  const { patrolConfigs, addPatrolConfig, updatePatrolConfig, removePatrolConfig } = usePatrolConfigs();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    interval: 300000,
    enabled: true,
  });

  const handleAdd = () => {
    if (!formData.name) {return;}

    addPatrolConfig({
      name: formData.name,
      interval: formData.interval,
      enabled: formData.enabled,
      targets: ["all"],
      checks: ["health"],
    });

    setFormData({ name: "", interval: 300000, enabled: true });
    setShowAddForm(false);
  };

  const handleEdit = (config: typeof patrolConfigs[0]) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      interval: config.interval,
      enabled: config.enabled,
    });
    setShowAddForm(true);
  };

  const handleUpdate = () => {
    if (!editingId || !formData.name) {return;}

    updatePatrolConfig(editingId, {
      name: formData.name,
      interval: formData.interval,
      enabled: formData.enabled,
    });

    setEditingId(null);
    setFormData({ name: "", interval: 300000, enabled: true });
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", interval: 300000, enabled: true });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs text-[rgba(0,212,255,0.5)]">{patrolConfigs.length} 个配置</span>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1.5 rounded-lg bg-[rgba(0,212,255,0.08)] border border-[rgba(0,180,255,0.15)] text-[#00d4ff] flex items-center gap-1.5 text-xs"
        >
          <Plus className="w-3.5 h-3.5" /> 添加配置
        </button>
      </div>

      {showAddForm && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#e0f0ff]">{editingId ? "编辑配置" : "添加配置"}</span>
            <button onClick={handleCancelEdit} className="text-[rgba(0,212,255,0.3)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">配置名称</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-[rgba(0,212,255,0.5)]">间隔(毫秒)</label>
              <input
                type="number"
                value={formData.interval}
                onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) || 300000 })}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={handleCancelEdit} className="px-4 py-2 rounded-lg text-[rgba(0,212,255,0.4)] text-xs">
              取消
            </button>
            <button
              onClick={editingId ? handleUpdate : handleAdd}
              className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs"
            >
              {editingId ? "保存" : "添加"}
            </button>
          </div>
        </GlassCard>
      )}

      {patrolConfigs.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <Eye className="w-12 h-12 mx-auto mb-4 text-[rgba(0,212,255,0.15)]" />
          <p className="text-sm text-[#e0f0ff]">暂无巡查配置</p>
        </GlassCard>
      ) : (
        <div className="space-y-2">
          {patrolConfigs.map((config) => (
            <GlassCard key={config.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#e0f0ff]">{config.name}</span>
                    {!config.enabled && <span className="text-xs text-[rgba(0,212,255,0.3)]">已禁用</span>}
                  </div>
                  <p className="text-xs text-[rgba(0,212,255,0.4)] mt-1">间隔: {config.interval / 1000}秒</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] text-[rgba(0,212,255,0.4)]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removePatrolConfig(config.id)}
                    className="p-1.5 rounded-lg hover:bg-[rgba(255,60,60,0.1)] text-[rgba(255,100,100,0.4)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 导入导出标签
// ============================================================

function ImportExportTab({ globalStore }: { globalStore: ReturnType<typeof useGlobalStore> }) {
  const [importText, setImportText] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleExport = useCallback(() => {
    const data = globalStore.exportAllData();
    const json = JSON.stringify(data, null, 2);

    // 下载文件
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yyc3-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setMessage({ type: "success", text: "数据已导出并下载" });
  }, [globalStore]);

  const handleImport = useCallback(() => {
    if (!importText.trim()) {
      setMessage({ type: "error", text: "请粘贴要导入的数据" });
      return;
    }

    try {
      const data = JSON.parse(importText);
      const success = globalStore.importAllData(data);

      if (success) {
        setMessage({ type: "success", text: "数据导入成功" });
        setImportText("");
      } else {
        setMessage({ type: "error", text: "数据导入失败" });
      }
    } catch {
      setMessage({ type: "error", text: "JSON格式错误" });
    }
  }, [globalStore, importText]);

  const handleReset = useCallback(() => {
    if (confirm("确定要重置所有数据吗？此操作不可恢复！")) {
      globalStore.resetAllData();
      setMessage({ type: "success", text: "数据已重置" });
    }
  }, [globalStore]);

  return (
    <div className="space-y-4">
      {/* 导出 */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-[#e0f0ff] mb-3 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#00d4ff]" />
          导出数据
        </h3>
        <p className="text-xs text-[rgba(0,212,255,0.5)] mb-3">
          导出所有配置数据为JSON文件，可用于备份或迁移到其他设备
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" /> 导出并下载
        </button>
      </GlassCard>

      {/* 导入 */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium text-[#e0f0ff] mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#00d4ff]" />
          导入数据
        </h3>
        <p className="text-xs text-[rgba(0,212,255,0.5)] mb-3">
          粘贴之前导出的JSON数据，将覆盖当前所有配置
        </p>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder='{"_exportedAt": "...", "modelProviders": [...], ...}'
          className="w-full h-32 px-3 py-2 rounded-lg bg-[rgba(0,10,20,0.5)] border border-[rgba(0,180,255,0.1)] text-[#e0f0ff] outline-none text-xs font-mono resize-none"
        />
        <button
          onClick={handleImport}
          className="mt-3 px-4 py-2 rounded-lg bg-[rgba(0,212,255,0.15)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff] text-xs flex items-center gap-2"
        >
          <Upload className="w-3.5 h-3.5" /> 导入数据
        </button>
      </GlassCard>

      {/* 重置 */}
      <GlassCard className="p-4 border-[rgba(255,60,60,0.2)]">
        <h3 className="text-sm font-medium text-[#ff6464] mb-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          重置数据
        </h3>
        <p className="text-xs text-[rgba(0,212,255,0.5)] mb-3">
          清除所有配置数据，恢复到默认状态。此操作不可恢复！
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-[rgba(255,60,60,0.1)] border border-[rgba(255,60,60,0.3)] text-[#ff6464] text-xs"
        >
          重置所有数据
        </button>
      </GlassCard>

      {/* 消息提示 */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs ${
            message.type === "success"
              ? "bg-[rgba(0,255,136,0.1)] text-[#00ff88] border border-[rgba(0,255,136,0.2)]"
              : "bg-[rgba(255,60,60,0.1)] text-[#ff6464] border border-[rgba(255,60,60,0.2)]"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
