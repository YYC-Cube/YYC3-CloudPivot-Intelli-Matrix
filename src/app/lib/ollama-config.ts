/**
 * ollama-config.ts
 * ================
 * Ollama 动态配置管理系统
 * 
 * 功能：
 * - 自动扫描识别 Ollama 服务
 * - API 配置动态管理（增删改查）
 * - 模型列表动态加载
 * - 服务健康检查
 * - 多实例支持
 */

import { config } from '@/config/config-loader';

// ============================================================
// 类型定义
// ============================================================

/**
 * Ollama 服务实例配置
 */
export interface OllamaInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  baseUrl: string;
  enabled: boolean;
  lastHealthCheck?: Date;
  status: 'online' | 'offline' | 'unknown';
}

/**
 * Ollama 模型信息
 */
export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details?: {
    parent_model?: string;
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

/**
 * Ollama 服务响应
 */
export interface OllamaServiceInfo {
  version: string;
  build: number;
  commit: string;
  models: OllamaModel[];
}

/**
 * Ollama 配置存储
 */
export interface OllamaConfigStorage {
  instances: OllamaInstance[];
  activeInstanceId?: string;
  autoDiscovery: boolean;
  discoveryInterval: number;
}

// ============================================================
// 常量
// ============================================================

const STORAGE_KEY = 'yyc3_ollama_config';
const DEFAULT_DISCOVERY_INTERVAL = 30000; // 30 秒
const DEFAULT_PORTS = [11434, 11435, 11436]; // 默认扫描端口
const DEFAULT_HOSTS = ['localhost', '127.0.0.1', 'host.docker.internal'];

// ============================================================
// 配置存储
// ============================================================

let _config: OllamaConfigStorage | null = null;

/**
 * 加载配置
 */
function loadConfig(): OllamaConfigStorage {
  if (_config) {return _config;}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      _config = JSON.parse(raw) as OllamaConfigStorage;
      return _config;
    }
  } catch (error) {
    console.error('Failed to load Ollama config:', error);
  }

  // 默认配置
  const defaultConfig: OllamaConfigStorage = {
    instances: [],
    autoDiscovery: true,
    discoveryInterval: DEFAULT_DISCOVERY_INTERVAL,
  };

  _config = defaultConfig;
  saveConfig();
  return _config;
}

/**
 * 保存配置
 */
function saveConfig(): void {
  if (_config) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_config));
  }
}

/**
 * 获取配置
 */
export function getOllamaConfig(): OllamaConfigStorage {
  return loadConfig();
}

/**
 * 重置配置
 */
export function resetOllamaConfig(): void {
  _config = null;
  localStorage.removeItem(STORAGE_KEY);
  loadConfig();
}

// ============================================================
// 实例管理
// ============================================================

/**
 * 添加 Ollama 实例
 */
export function addOllamaInstance(instance: Omit<OllamaInstance, 'id' | 'status' | 'lastHealthCheck'>): OllamaInstance {
  const config = loadConfig();
  const newInstance: OllamaInstance = {
    ...instance,
    id: generateId(),
    status: 'unknown',
    baseUrl: `http://${instance.host}:${instance.port}`,
  };

  config.instances.push(newInstance);
  saveConfig();

  return newInstance;
}

/**
 * 更新 Ollama 实例
 */
export function updateOllamaInstance(id: string, updates: Partial<OllamaInstance>): OllamaInstance | null {
  const config = loadConfig();
  const index = config.instances.findIndex(i => i.id === id);

  if (index === -1) {return null;}

  config.instances[index] = { ...config.instances[index], ...updates };
  saveConfig();

  return config.instances[index];
}

/**
 * 删除 Ollama 实例
 */
export function removeOllamaInstance(id: string): boolean {
  const config = loadConfig();
  const index = config.instances.findIndex(i => i.id === id);

  if (index === -1) {return false;}

  config.instances.splice(index, 1);

  // 如果删除的是当前激活的实例，清除激活状态
  if (config.activeInstanceId === id) {
    config.activeInstanceId = undefined;
  }

  saveConfig();
  return true;
}

/**
 * 设置激活实例
 */
export function setActiveOllamaInstance(id: string): void {
  const config = loadConfig();
  const instance = config.instances.find(i => i.id === id);

  if (instance) {
    config.activeInstanceId = id;
    saveConfig();
  }
}

/**
 * 获取激活的实例
 */
export function getActiveOllamaInstance(): OllamaInstance | null {
  const config = loadConfig();

  if (!config.activeInstanceId) {return null;}

  return config.instances.find(i => i.id === config.activeInstanceId) || null;
}

/**
 * 获取所有实例
 */
export function getAllOllamaInstances(): OllamaInstance[] {
  return loadConfig().instances;
}

// ============================================================
// 服务发现
// ============================================================

/**
 * 扫描本地 Ollama 服务
 */
export async function discoverOllamaServices(): Promise<OllamaInstance[]> {
  const discovered: OllamaInstance[] = [];

  // 扫描默认主机和端口
  for (const host of DEFAULT_HOSTS) {
    for (const port of DEFAULT_PORTS) {
      try {
        const instance = await checkOllamaService(host, port);
        if (instance) {
          discovered.push(instance);
        }
      } catch {
        // 忽略连接错误，继续扫描其他端口
        continue;
      }
    }
  }

  return discovered;
}

/**
 * 检查 Ollama 服务是否可用
 */
export async function checkOllamaService(host: string, port: number): Promise<OllamaInstance | null> {
  const baseUrl = `http://${host}:${port}`;

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 秒超时
    });

    if (!response.ok) {return null;}

    await response.json();

    return {
      id: generateId(),
      name: `${host}:${port}`,
      host,
      port,
      baseUrl,
      enabled: true,
      status: 'online',
      lastHealthCheck: new Date(),
    };
  } catch {
    return null;
  }
}

/**
 * 健康检查
 */
export async function healthCheckOllamaInstance(instance: OllamaInstance): Promise<boolean> {
  try {
    const response = await fetch(`${instance.baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(3000), // 3 秒超时
    });

    const isOnline = response.ok;

    // 更新实例状态
    updateOllamaInstance(instance.id, {
      status: isOnline ? 'online' : 'offline',
      lastHealthCheck: new Date(),
    });

    return isOnline;
  } catch {
    updateOllamaInstance(instance.id, {
      status: 'offline',
      lastHealthCheck: new Date(),
    });
    return false;
  }
}

// ============================================================
// 模型管理
// ============================================================

/**
 * 获取模型列表
 */
export async function fetchOllamaModels(instance: OllamaInstance): Promise<OllamaModel[]> {
  try {
    const response = await fetch(`${instance.baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data: OllamaServiceInfo = await response.json();

    return data.models || [];
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    return [];
  }
}

/**
 * 获取当前激活实例的模型列表
 */
export async function getActiveInstanceModels(): Promise<OllamaModel[]> {
  const activeInstance = getActiveOllamaInstance();

  if (!activeInstance) {return [];}

  return fetchOllamaModels(activeInstance);
}

/**
 * 运行模型
 */
export async function runOllamaModel(
  instance: OllamaInstance,
  modelName: string,
  options?: {
    stream?: boolean;
    keep_alive?: string;
  }
): Promise<Response> {
  const response = await fetch(`${instance.baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      stream: options?.stream ?? false,
      keep_alive: options?.keep_alive ?? '5m',
      options: {
        num_ctx: 2048,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to run model: ${response.statusText}`);
  }

  return response;
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `ollama_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * 从配置获取默认实例（向后兼容）
 */
export function getDefaultOllamaInstance(): OllamaInstance | null {
  const ollamaConfig = loadConfig();

  // 如果有激活实例，返回激活实例
  if (ollamaConfig.activeInstanceId) {
    return getActiveOllamaInstance();
  }

  // 否则从环境变量创建默认实例
  if (config.ai.OLLAMA_HOST && config.ai.OLLAMA_PORT) {
    return {
      id: 'default',
      name: 'Default (from env)',
      host: config.ai.OLLAMA_HOST,
      port: config.ai.OLLAMA_PORT,
      baseUrl: `http://${config.ai.OLLAMA_HOST}:${config.ai.OLLAMA_PORT}`,
      enabled: true,
      status: 'unknown',
    };
  }

  return null;
}

/**
 * 获取 Ollama 基础 URL（向后兼容）
 */
export function getOllamaBaseUrl(): string {
  const activeInstance = getActiveOllamaInstance();

  if (activeInstance) {
    return activeInstance.baseUrl;
  }

  // 向后兼容：使用环境变量
  return `http://${config.ai.OLLAMA_HOST}:${config.ai.OLLAMA_PORT}`;
}
