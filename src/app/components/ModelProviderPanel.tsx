/**
 * ModelProviderPanel.tsx
 * =======================
 * AI 模型提供商管理面板 · 路由: /models
 *
 * 功能:
 * - 已配置模型列表
 * - 添加模型 (打开 AddModelModal)
 * - 删除 / 测试连接
 * - Ollama 本地模型状态
 */

import { useContext } from "react";
import { Plus, Trash2, Plug, Server, Cpu, CheckCircle, AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { AddModelModal } from "./AddModelModal";
import { useModelProvider } from "../hooks/useModelProvider";
import { useI18n } from "../hooks/useI18n";
import { ViewContext } from "./Layout";

function formatSize(bytes: number): string {
  if (bytes >= 1e9) {return `${(bytes / 1e9).toFixed(1)}GB`;}
  if (bytes >= 1e6) {return `${(bytes / 1e6).toFixed(0)}MB`;}
  return `${bytes}B`;
}

export function ModelProviderPanel() {
  const view = useContext(ViewContext);
  const { t } = useI18n();
  const isMobile = view?.isMobile ?? false;

  const {
    providers,
    configuredModels,
    ollamaModels,
    ollamaLoading,
    ollamaError,
    stats,
    modalOpen,
    openModal,
    closeModal,
    addModel,
    removeModel,
    testConnection,
    fetchOllamaModels,
  } = useModelProvider();

  const statusConfig = {
    active:    { color: "#00ff88", icon: CheckCircle, label: t("modelProvider.statusActive") },
    error:     { color: "#ff3366", icon: AlertCircle, label: t("modelProvider.statusError") },
    unchecked: { color: "rgba(0,212,255,0.3)", icon: HelpCircle, label: t("modelProvider.statusUnchecked") },
  };

  return (
    <div className="space-y-4" data-testid="model-provider-panel">
      {/* ======== Header ======== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
            <Cpu className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <div>
            <h2 className="text-[#e0f0ff]" style={{ fontSize: "1.1rem" }}>
              {t("modelProvider.title")}
            </h2>
            <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.7rem" }}>
              {t("modelProvider.subtitle")}
            </p>
          </div>
        </div>

        <button
          onClick={openModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgba(0,140,200,0.15)] border border-[rgba(0,180,255,0.3)] text-[#00d4ff] hover:bg-[rgba(0,140,200,0.25)] transition-all"
          style={{ fontSize: "0.78rem" }}
          data-testid="open-add-model"
        >
          <Plus className="w-4 h-4" />
          {t("modelProvider.addModel")}
        </button>
      </div>

      {/* ======== Stats ======== */}
      <div className={`grid gap-3 ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
        <GlassCard className="p-3 flex flex-col items-center">
          <span className="text-[#e0f0ff]" style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace" }}>
            {stats.total}
          </span>
          <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.62rem" }}>
            {t("modelProvider.totalModels")}
          </p>
        </GlassCard>
        <GlassCard className="p-3 flex flex-col items-center">
          <span className="text-[#00ff88]" style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace" }}>
            {stats.active}
          </span>
          <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.62rem" }}>
            {t("modelProvider.activeModels")}
          </p>
        </GlassCard>
        <GlassCard className="p-3 flex flex-col items-center">
          <span className="text-[#7b2ff7]" style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace" }}>
            {stats.providers}
          </span>
          <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.62rem" }}>
            {t("modelProvider.providerCount")}
          </p>
        </GlassCard>
        <GlassCard className="p-3 flex flex-col items-center">
          <span className="text-[#ffaa00]" style={{ fontSize: "1.1rem", fontFamily: "'Orbitron', monospace" }}>
            {stats.ollamaCount}
          </span>
          <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.62rem" }}>
            {t("modelProvider.ollamaModels")}
          </p>
        </GlassCard>
      </div>

      {/* ======== Ollama 本地模型 ======== */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#00ff88]" />
            <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.88rem" }}>
              {t("modelProvider.ollamaLocal")}
            </h3>
            <span className="text-[rgba(0,212,255,0.2)]" style={{ fontSize: "0.6rem" }}>
              http://localhost:11434
            </span>
          </div>
          <button
            onClick={() => fetchOllamaModels()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] transition-all"
            style={{ fontSize: "0.65rem" }}
            disabled={ollamaLoading}
            data-testid="refresh-ollama-models"
          >
            <RefreshCw className={`w-3 h-3 ${ollamaLoading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
        </div>

        {ollamaModels.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {ollamaModels.map((m) => (
              <div
                key={m.name}
                className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[rgba(0,40,80,0.06)] hover:bg-[rgba(0,40,80,0.12)] transition-all"
                data-testid={`ollama-model-${m.name}`}
              >
                <div className="w-2 h-2 rounded-full bg-[#00ff88] shrink-0" style={{ boxShadow: "0 0 6px rgba(0,255,136,0.4)" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[#e0f0ff] truncate block" style={{ fontSize: "0.78rem" }}>
                    {m.name}
                  </span>
                  <span className="text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.58rem" }}>
                    {m.details.family} · {m.details.parameter_size} · {m.details.quantization_level} · {formatSize(m.size)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[rgba(0,212,255,0.25)] text-center py-3" style={{ fontSize: "0.75rem" }}>
            {ollamaLoading ? t("modelProvider.loadingModels") : t("modelProvider.noOllamaModels")}
          </p>
        )}

        {ollamaError && (
          <p className="text-[#ffaa00] mt-2" style={{ fontSize: "0.62rem" }}>
            {ollamaError}
          </p>
        )}
      </GlassCard>

      {/* ======== 已配置模型 ======== */}
      <GlassCard className="p-4">
        <h3 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.88rem" }}>
          {t("modelProvider.configuredModels")}
        </h3>

        {configuredModels.length > 0 ? (
          <div className="space-y-1.5">
            {configuredModels.map((cm) => {
              const stCfg = statusConfig[cm.status];
              const StIcon = stCfg.icon;
              return (
                <div
                  key={cm.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,40,80,0.06)] hover:bg-[rgba(0,40,80,0.12)] transition-all"
                  data-testid={`configured-model-${cm.id}`}
                >
                  <StIcon className="w-4 h-4 shrink-0" style={{ color: stCfg.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#e0f0ff]" style={{ fontSize: "0.78rem" }}>
                        {cm.model}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded"
                        style={{ fontSize: "0.55rem", color: "#00d4ff", backgroundColor: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)" }}
                      >
                        {cm.providerLabel}
                      </span>
                    </div>
                    <span className="text-[rgba(0,212,255,0.2)] block" style={{ fontSize: "0.58rem", fontFamily: "'JetBrains Mono', monospace" }}>
                      {cm.baseUrl}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => testConnection(cm.id)}
                      className="p-1.5 rounded-lg hover:bg-[rgba(0,180,255,0.08)] transition-all"
                      title={t("modelProvider.testConnection")}
                    >
                      <Plug className="w-3.5 h-3.5 text-[rgba(0,212,255,0.4)]" />
                    </button>
                    <button
                      onClick={() => removeModel(cm.id)}
                      className="p-1.5 rounded-lg hover:bg-[rgba(255,51,102,0.08)] transition-all"
                      title={t("common.delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[rgba(255,51,102,0.5)]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Cpu className="w-8 h-8 text-[rgba(0,212,255,0.15)] mx-auto mb-2" />
            <p className="text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.78rem" }}>
              {t("modelProvider.noConfigured")}
            </p>
            <p className="text-[rgba(0,212,255,0.15)] mt-1" style={{ fontSize: "0.65rem" }}>
              {t("modelProvider.noConfiguredHint")}
            </p>
          </div>
        )}
      </GlassCard>

      {/* ======== AddModelModal ======== */}
      <AddModelModal
        isOpen={modalOpen}
        onClose={closeModal}
        providers={providers}
        ollamaModels={ollamaModels}
        ollamaLoading={ollamaLoading}
        ollamaError={ollamaError}
        onFetchOllama={fetchOllamaModels}
        onAdd={addModel}
      />
    </div>
  );
}
