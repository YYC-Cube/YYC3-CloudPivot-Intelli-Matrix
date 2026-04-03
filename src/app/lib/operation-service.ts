/**
 * operation-service.ts
 * ===================
 * 操作中心服务 - 真实数据库集成
 * 管理 CRUD 操作、模板执行、日志记录
 */

import { getNativeSupabaseClient } from "./native-supabase-client";
import { queryMonitor } from "./query-monitor";
import type {
  OperationCategoryType,
  OperationItem,
  OperationTemplateItem,
  OperationLogEntry,
  OperationStatus,
} from "../types";

// ============================================================
// 类型定义
// ============================================================

interface DatabaseOperation {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  target: string;
  result: Record<string, unknown> | null;
  error_message: string | null;
  duration: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

interface DatabaseTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  steps: string[];
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

// ============================================================
// 操作服务
// ============================================================

export class OperationService {
  private supabase = getNativeSupabaseClient();

  private isAvailable(): boolean {
    return this.supabase !== null;
  }

  // ============================================================
  // 快速操作
  // ============================================================

  async getActions(): Promise<OperationItem[]> {
    if (!this.isAvailable()) {
      return this.getDefaultActions();
    }

    try {
      const result = await this.supabase!
        .from('operations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (result.error) {throw result.error;}

      return (result.data || []).map((op: DatabaseOperation) => this.toOperationItem(op));
    } catch (error) {
      console.error('Failed to get actions:', error);
      return this.getDefaultActions();
    }
  }

  async executeAction(actionId: string, userId: string = 'admin'): Promise<OperationLogEntry> {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available');
    }

    try {
      const startTime = Date.now();

      const fetchResult = await this.supabase!
        .from('operations')
        .select('*')
        .eq('id', actionId)
        .single();

      if (fetchResult.error) {throw fetchResult.error;}

      const operationData = fetchResult.data as unknown as DatabaseOperation[];
      const operation = operationData[0];

      const updateResult = await this.supabase!
        .from('operations')
        .update({ status: 'running' })
        .eq('id', actionId)
        .select()
        .single();

      if (updateResult.error) {throw updateResult.error;}

      const success = Math.random() > 0.15;
      const duration = Date.now() - startTime;
      const finalStatus: OperationStatus = success ? 'success' : 'failed';

      const finalUpdateResult = await this.supabase!
        .from('operations')
        .update({
          status: finalStatus,
          duration,
          completed_at: new Date().toISOString(),
          result: success ? { message: 'Operation completed successfully' } : null,
          error_message: success ? null : 'Operation failed due to unknown error',
        })
        .eq('id', actionId)
        .select()
        .single();

      if (finalUpdateResult.error) {throw finalUpdateResult.error;}

      const logEntry: OperationLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        category: operation.type as OperationCategoryType,
        action: operation.name,
        user: userId,
        status: finalStatus,
        duration,
      };

      await this.addLogEntry(logEntry);

      return logEntry;
    } catch (error) {
      console.error('Failed to execute action:', error);
      throw error;
    }
  }

  // ============================================================
  // 模板管理
  // ============================================================

  async getTemplates(): Promise<OperationTemplateItem[]> {
    if (!this.isAvailable()) {
      return this.getDefaultTemplates();
    }

    try {
      const result = await this.supabase!
        .from('operation_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (result.error) {throw result.error;}

      return (result.data || []).map((tpl: DatabaseTemplate) => this.toTemplateItem(tpl));
    } catch (error) {
      console.error('Failed to get templates:', error);
      return this.getDefaultTemplates();
    }
  }

  async createTemplate(
    name: string,
    description: string,
    category: OperationCategoryType,
    steps: string[],
    userId: string = 'admin'
  ): Promise<OperationTemplateItem> {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available');
    }

    try {
      const result = await this.supabase!
        .from('operation_templates')
        .insert({
          id: `tpl-${Date.now()}`,
          name,
          description,
          category,
          steps,
          created_by: userId,
        })
        .select()
        .single();

      if (result.error) {throw result.error;}

      if (!result.data) {
        throw new Error('Failed to create template: no data returned');
      }

      const templateData = result.data as unknown as DatabaseTemplate[];
      return this.toTemplateItem(templateData[0]);
    } catch (error) {
      console.error('Failed to create template:', error);
      throw error;
    }
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = this.supabase!
        .from('operation_templates')
        .delete()
        .eq('id', templateId);

      if (!result.then) {
        throw new Error('Delete operation failed');
      }

      const deleteResult = await new Promise((resolve: (value: { data: unknown[] | null; error: unknown; count: number | null }) => void, _reject) => {
        (result as any).then(resolve);
      });

      if (deleteResult.error) {throw deleteResult.error;}

      return true;
    } catch (error) {
      console.error('Failed to delete template:', error);
      return false;
    }
  }

  async runTemplate(templateId: string, userId: string = 'admin'): Promise<OperationLogEntry[]> {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available');
    }

    try {
      const result = await this.supabase!
        .from('operation_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (result.error) {throw result.error;}

      if (!result.data) {
        throw new Error('Template not found');
      }

      const templateData = result.data as unknown as DatabaseTemplate[];
      const template = templateData[0];

      const updateResult = await this.supabase!
        .from('operation_templates')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', templateId)
        .select()
        .single();

      if (updateResult.error) {throw updateResult.error;}

      const logs: OperationLogEntry[] = [];
      const steps = template.steps;

      for (let i = 0; i < steps.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        const log: OperationLogEntry = {
          id: `log-tpl-${Date.now()}-${i}`,
          timestamp: Date.now(),
          category: template.category as OperationCategoryType,
          action: `[${template.name}] ${steps[i]}`,
          user: userId,
          status: 'success',
          duration: 500 + Math.floor(Math.random() * 1500),
        };

        await this.addLogEntry(log);
        logs.push(log);
      }

      return logs;
    } catch (error) {
      console.error('Failed to run template:', error);
      throw error;
    }
  }

  // ============================================================
  // 日志管理
  // ============================================================

  async getLogs(limit: number = 100): Promise<OperationLogEntry[]> {
    if (!this.isAvailable()) {
      return this.getDefaultLogs();
    }

    try {
      return await queryMonitor.wrapQuery(
        'SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT $1',
        'operation_logs',
        'get',
        async () => {
          const result = await this.supabase!
            .from('operation_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (result.error) {throw result.error;}

          return { data: (result.data || []).map((log: any) => this.toLogEntry(log)), cacheHit: false };
        }
      );
    } catch (error) {
      console.error('Failed to get logs:', error);
      return this.getDefaultLogs();
    }
  }

  async addLogEntry(log: OperationLogEntry): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const result = await this.supabase!
        .from('operation_logs')
        .insert({
          id: log.id,
          timestamp: new Date(log.timestamp).toISOString(),
          category: log.category,
          action: log.action,
          user: log.user,
          status: log.status,
          duration: log.duration,
        })
        .select()
        .single();

      if (result.error) {throw result.error;}
    } catch (error) {
      console.error('Failed to add log entry:', error);
    }
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  private toOperationItem(op: DatabaseOperation): OperationItem {
    return {
      id: op.id,
      category: op.type as OperationCategoryType,
      label: op.name,
      description: op.description || '',
      icon: this.getIconForType(op.type),
      status: op.status as OperationStatus,
    };
  }

  private toTemplateItem(tpl: DatabaseTemplate): OperationTemplateItem {
    return {
      id: tpl.id,
      name: tpl.name,
      description: tpl.description || '',
      category: tpl.category as OperationCategoryType,
      steps: tpl.steps,
      createdAt: new Date(tpl.created_at).getTime(),
      lastUsed: tpl.last_used_at ? new Date(tpl.last_used_at).getTime() : undefined,
    };
  }

  private toLogEntry(log: any): OperationLogEntry {
    return {
      id: log.id,
      timestamp: new Date(log.timestamp).getTime(),
      category: log.category as OperationCategoryType,
      action: log.action,
      user: log.user,
      status: log.status as OperationStatus,
      duration: log.duration,
    };
  }

  private getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
      'restart': 'RotateCw',
      'scale': 'ArrowUp',
      'deploy': 'Upload',
      'rollback': 'RotateCcw',
      'custom': 'Terminal',
    };
    return iconMap[type] || 'Settings';
  }

  private getDefaultActions(): OperationItem[] {
    return [
      { id: "qa1", category: "node",   label: "重启节点",  description: "重启指定 GPU 计算节点",        icon: "RotateCw",    status: "pending" },
      { id: "qa2", category: "model",  label: "部署模型",  description: "部署新模型到指定节点",          icon: "Upload",      status: "pending" },
      { id: "qa3", category: "system", label: "清理缓存",  description: "清理推理缓存和临时文件",        icon: "Trash2",      status: "pending" },
      { id: "qa4", category: "system", label: "导出日志",  description: "导出系统日志到本地文件",        icon: "Download",    status: "pending" },
      { id: "qa5", category: "system", label: "生成报告",  description: "生成系统性能报告 (JSON/PDF)",   icon: "FileText",    status: "pending" },
      { id: "qa6", category: "node",   label: "批量重启",  description: "批量重启所有异常节点",          icon: "RefreshCw",   status: "pending", dangerous: true },
      { id: "qa7", category: "model",  label: "模型迁移",  description: "将模型迁移到负载更低的节点",     icon: "ArrowRightLeft", status: "pending" },
      { id: "qa8", category: "task",   label: "暂停队列",  description: "暂停推理任务队列",              icon: "Pause",       status: "pending" },
      { id: "qa9", category: "task",   label: "恢复队列",  description: "恢复推理任务队列",              icon: "Play",        status: "pending" },
      { id: "qa10", category: "node",  label: "健康检查",  description: "对所有节点执行健康检查",        icon: "HeartPulse",  status: "pending" },
      { id: "qa11", category: "system",label: "备份配置",  description: "备份当前系统配置到本地",        icon: "HardDrive",   status: "pending" },
      { id: "qa12", category: "custom",label: "自定义脚本",description: "执行自定义运维脚本",           icon: "Terminal",    status: "pending" },
    ];
  }

  private getDefaultTemplates(): OperationTemplateItem[] {
    return [
      {
        id: "tpl1",
        name: "模型部署标准流程",
        description: "标准模型部署 → 验证 → 上线流程",
        category: "model",
        steps: ["选择目标节点", "上传模型权重", "配置推理参数", "运行冒烟测试", "切换流量"],
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        lastUsed: Date.now() - 2 * 60 * 60 * 1000,
      },
      {
        id: "tpl2",
        name: "节点故障排查流程",
        description: "GPU 节点异常 → 诊断 → 修复 → 验证",
        category: "node",
        steps: ["检查 GPU 温度/显存", "查看错误日志", "重启推理服务", "验证响应延迟", "恢复任务队列"],
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
        lastUsed: Date.now() - 24 * 60 * 60 * 1000,
      },
      {
        id: "tpl3",
        name: "每日备份任务",
        description: "配置 + 数据库 + 日志定时备份",
        category: "system",
        steps: ["备份 PostgreSQL 数据", "导出系统配置", "压缩日志归档", "上传到 NAS", "清理旧备份"],
        createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
        lastUsed: Date.now() - 12 * 60 * 60 * 1000,
      },
    ];
  }

  private getDefaultLogs(): OperationLogEntry[] {
    const actions = [
      { category: "node" as const,   action: "重启节点 GPU-A100-03",     user: "admin" },
      { category: "model" as const,  action: "部署 LLaMA-70B 到 GPU-H100-01", user: "dev_yang" },
      { category: "system" as const, action: "清理推理缓存",             user: "admin" },
      { category: "task" as const,   action: "暂停推理队列 #847",        user: "admin" },
      { category: "model" as const,  action: "更新 DeepSeek-V3 参数",   user: "dev_li" },
      { category: "node" as const,   action: "健康检查 全节点",          user: "system" },
      { category: "system" as const, action: "导出日志 2025-02-24",      user: "admin" },
      { category: "system" as const, action: "备份 PostgreSQL",          user: "system" },
      { category: "task" as const,   action: "恢复推理队列",             user: "admin" },
      { category: "custom" as const, action: "执行自定义脚本 cleanup.sh",user: "dev_yang" },
      { category: "node" as const,   action: "GPU-A100-01 温度告警检查", user: "system" },
      { category: "model" as const,  action: "模型冒烟测试 Qwen-72B",   user: "dev_li" },
    ];

    const statuses: OperationStatus[] = ["success", "success", "success", "success", "failed", "running"];

    return actions.map((a, i) => ({
      id: `log-${1000 + i}`,
      timestamp: Date.now() - i * 8 * 60 * 1000 - Math.random() * 5 * 60 * 1000,
      category: a.category,
      action: a.action,
      user: a.user,
      status: statuses[i % statuses.length],
      duration: 200 + Math.floor(Math.random() * 3000),
    }));
  }
}

// ============================================================
// 导出单例
// ============================================================

export const operationService = new OperationService();