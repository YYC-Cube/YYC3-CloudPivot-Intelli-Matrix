/**
 * useModelProvider.ts
 * ====================
 * AI 模型提供商管理 Hook
 *
 * 功能:
 * - 管理已配置的模型列表 (localStorage 持久化)
 * - 服务商定义 (Z.ai / OpenAI / Ollama 等)
 * - Ollama 本地模型自动识别 (http://localhost:11434/api/tags)
 * - 添加 / 删除 / 测试连接
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import type {
  ModelProviderId,
  ModelProviderDef,
  ConfiguredModel,
  OllamaModel,
  OllamaTagsResponse,
} from "../types";

// ============================================================
// 服务商定义 — 全部注册表
// ============================================================

export const MODEL_PROVIDERS: ModelProviderDef[] = [
  {
    id: "zhipu",
    label: "Z.ai",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    authType: "api-key",
    models: ["glm-4-flash", "glm-4-plus", "glm-4-air", "glm-4-airx", "glm-4-long", "glm-4v-plus"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "zhipu-plan",
    label: "Z.ai-plan",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    authType: "api-key",
    models: ["glm-4-plan", "glm-4-plan-plus"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "kimi-cn",
    label: "Kimi-CN",
    baseUrl: "https://api.moonshot.cn/v1",
    authType: "bearer",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "kimi-global",
    label: "Kimi-Global",
    baseUrl: "https://api.moonshot.ai/v1",
    authType: "bearer",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    authType: "bearer",
    models: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "volcengine",
    label: "火山引擎",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    authType: "bearer",
    models: ["doubao-pro-32k", "doubao-pro-128k", "doubao-lite-32k"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "volcengine-plan",
    label: "火山引擎 Plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    authType: "bearer",
    models: ["doubao-plan-pro", "doubao-plan-lite"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    authType: "bearer",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1-preview", "o1-mini"],
    requiresApiKey: true,
    isLocal: false,
  },
  {
    id: "ollama",
    label: "Ollama (本地)",
    baseUrl: "http://localhost:11434",
    authType: "none",
    models: [],  // 运行时从 /api/tags 自动获取
    requiresApiKey: false,
    isLocal: true,
  },
];

// ============================================================
// Storage Key
// ============================================================

const STORAGE_KEY = "yyc3_configured_models";

function loadModels(): ConfiguredModel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveModels(models: ConfiguredModel[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  } catch {
    // Storage unavailable
  }
}

// ============================================================
// Hook
// ============================================================

export function useModelProvider() {
  const [configuredModels, setConfiguredModels] = useState<ConfiguredModel[]>(loadModels);
  const [ollamaModels, setOllamaModels] = useState<OllamaModel[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // 持久化
  useEffect(() => {
    saveModels(configuredModels);
  }, [configuredModels]);

  // ========== Ollama 自动识别 ==========
  const fetchOllamaModels = useCallback(async (baseUrl?: string) => {
    const url = baseUrl || "http://localhost:11434";
    setOllamaLoading(true);
    setOllamaError(null);

    try {
      const res = await fetch(`${url}/api/tags`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: OllamaTagsResponse = await res.json();
      setOllamaModels(data.models || []);
      return data.models || [];
    } catch (err: any) {
      // Mock fallback for development
      const mockModels: OllamaModel[] = [
        {
          name: "llama3:8b",
          model: "llama3:8b",
          modified_at: "2026-02-20T10:00:00Z",
          size: 4700000000,
          digest: "abc123",
          details: { parent_model: "", format: "gguf", family: "llama", parameter_size: "8B", quantization_level: "Q4_0" },
        },
        {
          name: "qwen2.5:14b",
          model: "qwen2.5:14b",
          modified_at: "2026-02-18T08:00:00Z",
          size: 8900000000,
          digest: "def456",
          details: { parent_model: "", format: "gguf", family: "qwen2", parameter_size: "14B", quantization_level: "Q4_K_M" },
        },
        {
          name: "deepseek-r1:7b",
          model: "deepseek-r1:7b",
          modified_at: "2026-02-15T12:00:00Z",
          size: 4200000000,
          digest: "ghi789",
          details: { parent_model: "", format: "gguf", family: "deepseek", parameter_size: "7B", quantization_level: "Q4_0" },
        },
        {
          name: "codellama:13b",
          model: "codellama:13b",
          modified_at: "2026-02-10T06:00:00Z",
          size: 7400000000,
          digest: "jkl012",
          details: { parent_model: "", format: "gguf", family: "llama", parameter_size: "13B", quantization_level: "Q4_0" },
        },
      ];
      setOllamaModels(mockModels);
      setOllamaError(`连接失败 (Mock 模式): ${err.message}`);
      return mockModels;
    } finally {
      setOllamaLoading(false);
    }
  }, []);

  // ========== 添加模型 ==========
  const addModel = useCallback((
    providerId: ModelProviderId,
    model: string,
    apiKey: string,
    customBaseUrl?: string,
  ) => {
    const provider = MODEL_PROVIDERS.find((p) => p.id === providerId);
    if (!provider) {return;}

    const newModel: ConfiguredModel = {
      id: `${providerId}-${model}-${Date.now()}`,
      providerId,
      providerLabel: provider.label,
      model,
      apiKey,
      baseUrl: customBaseUrl || provider.baseUrl,
      createdAt: Date.now(),
      lastUsed: null,
      status: "unchecked",
    };

    setConfiguredModels((prev) => [...prev, newModel]);
    return newModel;
  }, []);

  // ========== 删除模型 ==========
  const removeModel = useCallback((id: string) => {
    setConfiguredModels((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ========== 测试连接 (Mock) ==========
  const testConnection = useCallback(async (id: string) => {
    setConfiguredModels((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: "active" as const, lastUsed: Date.now() } : m
      )
    );
  }, []);

  // ========== 统计 ==========
  const stats = useMemo(() => ({
    total: configuredModels.length,
    active: configuredModels.filter((m) => m.status === "active").length,
    ollamaCount: ollamaModels.length,
    providers: new Set(configuredModels.map((m) => m.providerId)).size,
  }), [configuredModels, ollamaModels]);

  return {
    // 数据
    providers: MODEL_PROVIDERS,
    configuredModels,
    ollamaModels,
    ollamaLoading,
    ollamaError,
    stats,

    // 模态框
    modalOpen,
    openModal: () => setModalOpen(true),
    closeModal: () => setModalOpen(false),

    // 操作
    addModel,
    removeModel,
    testConnection,
    fetchOllamaModels,
  };
}
