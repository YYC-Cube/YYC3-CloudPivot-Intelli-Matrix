/**
 * OllamaConfigPanel.tsx
 * =====================
 * Ollama 配置管理面板
 * 
 * 功能：
 * - 自动扫描识别 Ollama 服务
 * - API 配置动态管理（增删改查）
 * - 模型列表动态加载
 * - 服务健康检查
 * - 多实例支持
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Edit2,
  Zap,
  Globe,
} from 'lucide-react';
import {
  addOllamaInstance,
  updateOllamaInstance,
  removeOllamaInstance,
  setActiveOllamaInstance,
  getActiveOllamaInstance,
  getAllOllamaInstances,
  discoverOllamaServices,
  healthCheckOllamaInstance,
  fetchOllamaModels,
  resetOllamaConfig,
  type OllamaInstance,
  type OllamaModel,
} from '../lib/ollama-config';
import { useI18n } from '../hooks/useI18n';

// ============================================================
// 子组件
// ============================================================

interface InstanceCardProps {
  instance: OllamaInstance;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (instance: OllamaInstance) => void;
  onDelete: (id: string) => void;
  onHealthCheck: (instance: OllamaInstance) => void;
}

function InstanceCard({ instance, isActive, onActivate, onEdit, onDelete, onHealthCheck }: InstanceCardProps) {
  const { t } = useI18n();
  const [isHealthChecking, setIsHealthChecking] = useState(false);

  const handleHealthCheck = useCallback(async () => {
    setIsHealthChecking(true);
    await onHealthCheck(instance);
    setIsHealthChecking(false);
  }, [instance, onHealthCheck]);

  const statusColor = instance.status === 'online' ? 'text-green-400' :
    instance.status === 'offline' ? 'text-red-400' : 'text-gray-400';

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${isActive ? 'border-cyan-400 bg-cyan-950/20' : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
        }`}
      onClick={() => onActivate(instance.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${instance.status === 'online' ? 'bg-green-400' :
            instance.status === 'offline' ? 'bg-red-400' : 'bg-gray-400'
            }`} />
          <div>
            <h3 className="text-lg font-semibold text-white">
              {instance.name}
            </h3>
            <p className="text-sm text-gray-400">
              {instance.host}:{instance.port}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <div className="px-2 py-1 bg-cyan-500 text-white text-xs rounded">
              {t('ollama.active')}
            </div>
          )}

          <button
            onClick={handleHealthCheck}
            disabled={isHealthChecking}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title={t('ollama.healthCheck')}
          >
            {isHealthChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={() => onEdit(instance)}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title={t('ollama.edit')}
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(instance.id)}
            className="p-2 hover:bg-red-900/50 text-red-400 rounded transition-colors"
            title={t('ollama.delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">
            {instance.baseUrl}
          </span>
        </div>

        <div className={`flex items-center gap-1 ${statusColor}`}>
          {instance.status === 'online' && <CheckCircle className="w-4 h-4" />}
          {instance.status === 'offline' && <XCircle className="w-4 h-4" />}
          <span className="capitalize">
            {t(`ollama.status.${instance.status}`)}
          </span>
        </div>
      </div>

      {instance.lastHealthCheck && (
        <div className="mt-2 text-xs text-gray-500">
          {t('ollama.lastCheck', {
            time: new Date(instance.lastHealthCheck).toLocaleString()
          })}
        </div>
      )}
    </div>
  );
}

interface ModelListProps {
  models: OllamaModel[];
  loading: boolean;
}

function ModelList({ models, loading }: ModelListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">{t('ollama.loadingModels')}</span>
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Server className="w-12 h-12 mx-auto mb-2 text-gray-600" />
        <p>{t('ollama.noModels')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {models.map((model) => (
        <div
          key={model.name}
          className="p-3 bg-gray-800/50 rounded border border-gray-700 hover:border-cyan-500/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="font-medium text-white">{model.name}</span>
            </div>
            <span className="text-sm text-gray-400">
              {(model.size / 1024 / 1024).toFixed(2)} GB
            </span>
          </div>

          {model.details && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {model.details.parent_model && (
                <div>{t('ollama.parentModel')}: {model.details.parent_model}</div>
              )}
              {model.details.format && (
                <div>{t('ollama.format')}: {model.details.format}</div>
              )}
              {model.details.quantization_level && (
                <div>{t('ollama.quantization')}: {model.details.quantization_level}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export function OllamaConfigPanel() {
  const { t } = useI18n();
  const [instances, setInstances] = useState<OllamaInstance[]>([]);
  const [activeInstance, setActiveInstance] = useState<OllamaInstance | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInstance, setEditingInstance] = useState<OllamaInstance | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(() => {
    const allInstances = getAllOllamaInstances();
    const active = getActiveOllamaInstance();
    setInstances(allInstances);
    setActiveInstance(active);
  }, []);

  // 自动扫描
  const handleAutoDiscover = useCallback(async () => {
    setScanning(true);
    try {
      const discovered = await discoverOllamaServices();

      // 合并发现的实例（避免重复）
      const existingIds = new Set(instances.map(i => i.id));
      const newInstances = discovered.filter(d => !existingIds.has(d.id));

      if (newInstances.length > 0) {
        newInstances.forEach(instance => addOllamaInstance(instance));
        await loadConfig();
      }
    } catch (error) {
      console.error('Auto discovery failed:', error);
    } finally {
      setScanning(false);
    }
  }, [instances]);

  // 健康检查
  const handleHealthCheck = useCallback(async (instance: OllamaInstance) => {
    await healthCheckOllamaInstance(instance);
    await loadConfig();
  }, []);

  // 激活实例
  const handleActivate = useCallback(async (id: string) => {
    setActiveOllamaInstance(id);
    await loadConfig();
  }, []);

  // 删除实例
  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm(t('ollama.confirmDelete'))) {
      await removeOllamaInstance(id);
      await loadConfig();

      // 如果删除的是当前激活实例，清空模型列表
      if (activeInstance?.id === id) {
        setActiveInstance(null);
        setModels([]);
      }
    }
  }, [activeInstance]);

  // 编辑实例
  const handleEdit = useCallback((instance: OllamaInstance) => {
    setEditingInstance(instance);
    setShowEditModal(true);
  }, []);

  // 加载模型列表
  const handleLoadModels = useCallback(async (instance: OllamaInstance) => {
    setLoadingModels(true);
    try {
      const modelList = await fetchOllamaModels(instance);
      setModels(modelList);
    } catch (error) {
      console.error('Failed to load models:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // 添加实例
  const handleAddInstance = useCallback(async (newInstance: Omit<OllamaInstance, 'id' | 'status' | 'lastHealthCheck'>) => {
    await addOllamaInstance(newInstance);
    await loadConfig();
    setShowAddModal(false);
  }, []);

  // 更新实例
  const handleUpdateInstance = useCallback(async (updates: Partial<OllamaInstance>) => {
    if (!editingInstance) {return;}

    await updateOllamaInstance(editingInstance.id, updates);
    await loadConfig();
    setShowEditModal(false);
    setEditingInstance(null);
  }, [editingInstance]);

  // 搜索过滤
  const filteredInstances = instances.filter(instance =>
    instance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    instance.host.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          {t('ollama.title')}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoDiscover}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>{t('ollama.autoDiscover')}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('ollama.addInstance')}</span>
          </button>

          <button
            onClick={() => resetOllamaConfig()}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            {t('ollama.reset')}
          </button>
        </div>
      </div>

      {/* 搜索框 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t('ollama.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white placeholder-gray-500"
        />
      </div>

      {/* 实例列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            isActive={activeInstance?.id === instance.id}
            onActivate={handleActivate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onHealthCheck={handleHealthCheck}
          />
        ))}
      </div>

      {/* 模型列表 */}
      {activeInstance && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {t('ollama.models')} - {activeInstance.name}
            </h3>
            <button
              onClick={() => handleLoadModels(activeInstance)}
              disabled={loadingModels}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors disabled:opacity-50"
            >
              {loadingModels ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span>{t('ollama.refreshModels')}</span>
            </button>
          </div>

          <ModelList models={models} loading={loadingModels} />
        </div>
      )}

      {/* 添加实例模态框 */}
      {showAddModal && (
        <AddInstanceModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddInstance}
        />
      )}

      {/* 编辑实例模态框 */}
      {showEditModal && editingInstance && (
        <EditInstanceModal
          instance={editingInstance}
          onClose={() => {
            setShowEditModal(false);
            setEditingInstance(null);
          }}
          onUpdate={handleUpdateInstance}
        />
      )}
    </div>
  );
}

// ============================================================
// 子组件：添加实例模态框
// ============================================================

interface AddInstanceModalProps {
  onClose: () => void;
  onAdd: (instance: Omit<OllamaInstance, 'id' | 'status' | 'lastHealthCheck'>) => void;
}

function AddInstanceModal({ onClose, onAdd }: AddInstanceModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: '',
    host: 'localhost',
    port: 11434,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.host && formData.port) {
      onAdd({
        name: formData.name,
        host: formData.host,
        port: formData.port,
        baseUrl: `http://${formData.host}:${formData.port}`,
        enabled: true,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">
          {t('ollama.addInstance')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.instanceName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
              placeholder={t('ollama.namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.host')}
            </label>
            <input
              type="text"
              required
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
              placeholder="localhost"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.port')}
            </label>
            <input
              type="number"
              required
              min={1}
              max={65535}
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
              placeholder="11434"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
            >
              {t('common.add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 子组件：编辑实例模态框
// ============================================================

interface EditInstanceModalProps {
  instance: OllamaInstance;
  onClose: () => void;
  onUpdate: (updates: Partial<OllamaInstance>) => void;
}

function EditInstanceModal({ instance, onClose, onUpdate }: EditInstanceModalProps) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    name: instance.name,
    host: instance.host,
    port: instance.port,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      name: formData.name,
      host: formData.host,
      port: formData.port,
      baseUrl: `http://${formData.host}:${formData.port}`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">
          {t('ollama.editInstance')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.instanceName')}
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.host')}
            </label>
            <input
              type="text"
              required
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('ollama.port')}
            </label>
            <input
              type="number"
              required
              min={1}
              max={65535}
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
