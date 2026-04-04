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

// ============================================================
// 智能自测自连功能
// ============================================================

let autoDiscoveryTimer: ReturnType<typeof setInterval> | null = null;
let healthCheckTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 启动自动发现服务
 */
export function startAutoDiscovery(intervalMs: number = DEFAULT_DISCOVERY_INTERVAL): void {
  if (autoDiscoveryTimer) {
    clearInterval(autoDiscoveryTimer);
  }

  // 立即执行一次
  performAutoDiscovery();

  // 定时执行
  autoDiscoveryTimer = setInterval(performAutoDiscovery, intervalMs);
}

/**
 * 停止自动发现服务
 */
export function stopAutoDiscovery(): void {
  if (autoDiscoveryTimer) {
    clearInterval(autoDiscoveryTimer);
    autoDiscoveryTimer = null;
  }
}

/**
 * 执行自动发现
 */
async function performAutoDiscovery(): Promise<void> {
  const config = loadConfig();
  if (!config.autoDiscovery) {return;}

  try {
    const discovered = await discoverOllamaServices();
    const existingIds = new Set(config.instances.map(i => i.id));
    const newInstances = discovered.filter(d => !existingIds.has(d.id));

    if (newInstances.length > 0) {
      newInstances.forEach(instance => {
        config.instances.push(instance);
      });
      saveConfig();

      // 如果没有激活实例，自动激活第一个在线实例
      if (!config.activeInstanceId) {
        const onlineInstance = newInstances.find(i => i.status === 'online');
        if (onlineInstance) {
          config.activeInstanceId = onlineInstance.id;
          saveConfig();
        }
      }
    }
  } catch (error) {
    console.error('Auto discovery failed:', error);
  }
}

/**
 * 启动健康检查服务
 */
export function startHealthCheck(intervalMs: number = 30000): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
  }

  // 立即执行一次
  performHealthCheck();

  // 定时执行
  healthCheckTimer = setInterval(performHealthCheck, intervalMs);
}

/**
 * 停止健康检查服务
 */
export function stopHealthCheck(): void {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

/**
 * 执行健康检查
 */
async function performHealthCheck(): Promise<void> {
  const config = loadConfig();

  for (const instance of config.instances) {
    try {
      const response = await fetch(`${instance.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      const isOnline = response.ok;
      instance.status = isOnline ? 'online' : 'offline';
      instance.lastHealthCheck = new Date();
    } catch {
      instance.status = 'offline';
      instance.lastHealthCheck = new Date();
    }
  }

  saveConfig();
}

/**
 * 智能连接 - 自动选择最佳实例
 */
export async function smartConnect(): Promise<OllamaInstance | null> {
  const config = loadConfig();

  // 如果已有激活实例且在线，直接返回
  if (config.activeInstanceId) {
    const active = config.instances.find(i => i.id === config.activeInstanceId);
    if (active && active.status === 'online') {
      return active;
    }
  }

  // 执行一次快速扫描
  const discovered = await discoverOllamaServices();

  // 合并到配置中
  for (const instance of discovered) {
    const existing = config.instances.find(i => i.baseUrl === instance.baseUrl);
    if (!existing) {
      config.instances.push(instance);
    } else {
      existing.status = instance.status;
      existing.lastHealthCheck = instance.lastHealthCheck;
    }
  }

  // 选择第一个在线实例
  const onlineInstance = config.instances.find(i => i.status === 'online');
  if (onlineInstance) {
    config.activeInstanceId = onlineInstance.id;
    saveConfig();
    return onlineInstance;
  }

  saveConfig();
  return null;
}

/**
 * 获取连接状态摘要
 */
export function getConnectionSummary(): {
  totalInstances: number;
  onlineInstances: number;
  offlineInstances: number;
  activeInstance: OllamaInstance | null;
  autoDiscoveryEnabled: boolean;
} {
  const config = loadConfig();
  const onlineInstances = config.instances.filter(i => i.status === 'online').length;
  const offlineInstances = config.instances.filter(i => i.status === 'offline').length;

  return {
    totalInstances: config.instances.length,
    onlineInstances,
    offlineInstances,
    activeInstance: getActiveOllamaInstance(),
    autoDiscoveryEnabled: config.autoDiscovery,
  };
}

/**
 * 测试模型推理
 */
export async function testModelInference(
  instance: OllamaInstance,
  modelName: string,
  prompt: string = "Hello"
): Promise<{ success: boolean; response?: string; latency?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const response = await fetch(`${instance.baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelName,
        prompt,
        stream: false,
        options: {
          num_predict: 10,
        },
      }),
      signal: AbortSignal.timeout(30000),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}`, latency };
    }

    const data = await response.json();
    return { success: true, response: data.response, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    return { success: false, error: error instanceof Error ? error.message : String(error), latency };
  }
}

/**
 * 自动配置 Ollama（一键设置）
 */
export async function autoConfigureOllama(): Promise<{
  success: boolean;
  instance?: OllamaInstance;
  models?: OllamaModel[];
  error?: string;
}> {
  try {
    // 1. 智能连接
    const instance = await smartConnect();
    if (!instance) {
      return { success: false, error: '未找到可用的 Ollama 服务' };
    }

    // 2. 获取模型列表
    const models = await fetchOllamaModels(instance);

    // 3. 启动自动发现和健康检查
    startAutoDiscovery();
    startHealthCheck();

    return { success: true, instance, models };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * 设置自动发现开关
 */
export function setAutoDiscovery(enabled: boolean): void {
  const config = loadConfig();
  config.autoDiscovery = enabled;
  saveConfig();

  if (enabled) {
    startAutoDiscovery();
  } else {
    stopAutoDiscovery();
  }
}

/**
 * 清理所有定时器
 */
export function cleanup(): void {
  stopAutoDiscovery();
  stopHealthCheck();
}
