/**
 * ai-suggestion-service.ts
 * =======================
 * AI 辅助决策服务 - 真实数据库集成
 * 管理异常模式检测、AI 推荐生成、应用/忽略
 */

import { getNativeSupabaseClient } from "./native-supabase-client";
import type {
  DetectedPattern,
  AIRecommendation,
  PatternSeverity,
} from "../types";

// ============================================================
// 类型定义
// ============================================================

interface DatabasePattern {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  source: string;
  metric: string;
  detected_at: string;
  occurrences: number;
  trend: string;
  resolved: boolean;
  resolved_at: string | null;
}

interface DatabaseRecommendation {
  id: string;
  pattern_id: string;
  action: string;
  description: string;
  impact: string;
  confidence: number;
  auto_executable: boolean;
  applied: boolean;
  result: Record<string, unknown> | null;
  created_at: string;
  applied_at: string | null;
}

// ============================================================
// AI 建议服务
// ============================================================

export class AISuggestionService {
  private supabase = getNativeSupabaseClient();

  private isAvailable(): boolean {
    return this.supabase !== null;
  }

  // ============================================================
  // 模式检测
  // ============================================================

  async getPatterns(): Promise<DetectedPattern[]> {
    if (!this.isAvailable()) {
      return this.getDefaultPatterns();
    }

    try {
      const result = await this.supabase!
        .from('ai_patterns')
        .select('*')
        .eq('resolved', false)
        .order('detected_at', { ascending: false });

      if (result.error) {throw result.error;}

      return (result.data || []).map((p: DatabasePattern) => this.toPattern(p));
    } catch (error) {
      console.error('Failed to get patterns:', error);
      return this.getDefaultPatterns();
    }
  }

  async createPattern(
    type: string,
    severity: PatternSeverity,
    title: string,
    description: string,
    source: string,
    metric: string,
    occurrences: number = 1,
    trend: string = 'stable'
  ): Promise<DetectedPattern> {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available');
    }

    try {
      const result = await this.supabase!
        .from('ai_patterns')
        .insert({
          id: `pat-${Date.now()}`,
          type,
          severity,
          title,
          description,
          source,
          metric,
          detected_at: new Date().toISOString(),
          occurrences,
          trend,
          resolved: false,
        })
        .select()
        .single();

      if (result.error) {throw result.error;}

      if (!result.data) {
        throw new Error('Failed to create pattern: no data returned');
      }

      const patternData = result.data as unknown as DatabasePattern[];
      return this.toPattern(patternData[0]);
    } catch (error) {
      console.error('Failed to create pattern:', error);
      throw error;
    }
  }

  async resolvePattern(patternId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.supabase!
        .from('ai_patterns')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', patternId)
        .select()
        .single();

      if (result.error) {throw result.error;}

      return true;
    } catch (error) {
      console.error('Failed to resolve pattern:', error);
      return false;
    }
  }

  // ============================================================
  // 推荐管理
  // ============================================================

  async getRecommendations(): Promise<AIRecommendation[]> {
    if (!this.isAvailable()) {
      return this.getDefaultRecommendations();
    }

    try {
      const result = await this.supabase!
        .from('ai_suggestions')
        .select('*')
        .eq('applied', false)
        .order('confidence', { ascending: false });

      if (result.error) {throw result.error;}

      return (result.data || []).map((r: DatabaseRecommendation) => this.toRecommendation(r));
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  async createRecommendation(
    patternId: string,
    action: string,
    description: string,
    impact: string,
    confidence: number,
    autoExecutable: boolean
  ): Promise<AIRecommendation> {
    if (!this.isAvailable()) {
      throw new Error('Supabase client not available');
    }

    try {
      const result = await this.supabase!
        .from('ai_suggestions')
        .insert({
          id: `rec-${Date.now()}`,
          pattern_id: patternId,
          action,
          description,
          impact,
          confidence,
          auto_executable: autoExecutable,
          applied: false,
        })
        .select()
        .single();

      if (result.error) {throw result.error;}

      if (!result.data) {
        throw new Error('Failed to create recommendation: no data returned');
      }

      const recData = result.data as unknown as DatabaseRecommendation[];
      return this.toRecommendation(recData[0]);
    } catch (error) {
      console.error('Failed to create recommendation:', error);
      throw error;
    }
  }

  async applyRecommendation(recId: string, result?: Record<string, unknown>): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const fetchResult = await this.supabase!
        .from('ai_suggestions')
        .select('*')
        .eq('id', recId)
        .single();

      if (fetchResult.error) {throw fetchResult.error;}

      const updateResult = await this.supabase!
        .from('ai_suggestions')
        .update({
          applied: true,
          applied_at: new Date().toISOString(),
          result: result || { success: true },
        })
        .eq('id', recId)
        .select()
        .single();

      if (updateResult.error) {throw updateResult.error;}

      return true;
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
      return false;
    }
  }

  async dismissRecommendation(recId: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = this.supabase!
        .from('ai_suggestions')
        .delete()
        .eq('id', recId);

      if (!result.then) {
        throw new Error('Delete operation failed');
      }

      const deleteResult = await new Promise((resolve: (value: { data: unknown[] | null; error: unknown; count: number | null }) => void, _reject) => {
        (result as any).then(resolve);
      });

      if (deleteResult.error) {throw deleteResult.error;}

      return true;
    } catch (error) {
      console.error('Failed to dismiss recommendation:', error);
      return false;
    }
  }

  // ============================================================
  // AI 分析
  // ============================================================

  async runAnalysis(): Promise<{ patterns: DetectedPattern[]; recommendations: AIRecommendation[] }> {
    if (!this.isAvailable()) {
      return {
        patterns: this.getDefaultPatterns(),
        recommendations: this.getDefaultRecommendations(),
      };
    }

    try {
      const patterns = await this.getPatterns();
      const recommendations = await this.getRecommendations();

      return { patterns, recommendations };
    } catch (error) {
      console.error('Failed to run analysis:', error);
      return {
        patterns: this.getDefaultPatterns(),
        recommendations: this.getDefaultRecommendations(),
      };
    }
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  private toPattern(p: DatabasePattern): DetectedPattern {
    return {
      id: p.id,
      type: p.type as DetectedPattern['type'],
      severity: p.severity as PatternSeverity,
      title: p.title,
      description: p.description,
      source: p.source,
      metric: p.metric,
      detectedAt: new Date(p.detected_at).getTime(),
      occurrences: p.occurrences,
      trend: p.trend as DetectedPattern['trend'],
    };
  }

  private toRecommendation(r: DatabaseRecommendation): AIRecommendation {
    return {
      id: r.id,
      patternId: r.pattern_id,
      action: r.action,
      description: r.description,
      impact: r.impact as AIRecommendation['impact'],
      confidence: r.confidence,
      autoExecutable: r.auto_executable,
      applied: r.applied,
    };
  }

  private getDefaultPatterns(): DetectedPattern[] {
    const now = Date.now();

    return [
      {
        id: "pat-1",
        type: "latency_spike",
        severity: "high",
        title: "GPU-A100-03 推理延迟持续异常",
        description: "过去 1 小时内连续 3 次延迟 > 2000ms，平均延迟 2,450ms",
        source: "GPU-A100-03",
        metric: "2,450ms > 2,000ms 阈值",
        detectedAt: now - 15 * 60000,
        occurrences: 3,
        trend: "rising",
      },
      {
        id: "pat-2",
        type: "memory_pressure",
        severity: "medium",
        title: "GPU-A100-03 显存压力过大",
        description: "显存使用率持续 89%+ ，接近 OOM 阈值",
        source: "GPU-A100-03",
        metric: "89% > 85% 阈值",
        detectedAt: now - 30 * 60000,
        occurrences: 5,
        trend: "stable",
      },
      {
        id: "pat-3",
        type: "storage_near_full",
        severity: "medium",
        title: "NAS 存储空间接近阈值",
        description: "NAS-Storage-01 已使用 85.8%，预计 7 天后达到 90% 告警线",
        source: "NAS-Storage-01",
        metric: "85.8% → 预计 7 天达 90%",
        detectedAt: now - 2 * 3600000,
        occurrences: 1,
        trend: "rising",
      },
      {
        id: "pat-4",
        type: "gpu_overheat",
        severity: "critical",
        title: "GPU-H100-02 温度过高",
        description: "GPU 核心温度 85°C，超过安全阈值 80°C，风扇已满速运行",
        source: "GPU-H100-02",
        metric: "85°C > 80°C 安全阈值",
        detectedAt: now - 5 * 60000,
        occurrences: 2,
        trend: "rising",
      },
      {
        id: "pat-5",
        type: "throughput_drop",
        severity: "low",
        title: "推理吞吐量波动",
        description: "最近 30 分钟 Token 吞吐量下降 12.3%，可能受任务调度影响",
        source: "集群整体",
        metric: "138K/s → 121K/s (↓12.3%)",
        detectedAt: now - 20 * 60000,
        occurrences: 1,
        trend: "declining",
      },
    ];
  }

  private getDefaultRecommendations(): AIRecommendation[] {
    return [
      {
        id: "rec-1",
        patternId: "pat-1",
        action: "迁移模型到 GPU-A100-07",
        description: "GPU-A100-07 当前负载 15%，迁移 LLaMA-70B 后预计延迟降至 800ms",
        impact: "high",
        confidence: 92,
        autoExecutable: true,
      },
      {
        id: "rec-2",
        patternId: "pat-1",
        action: "重启 GPU-A100-03 推理服务",
        description: "重启推理服务以清理内存碎片，预计恢复延迟到正常水平",
        impact: "medium",
        confidence: 78,
        autoExecutable: true,
      },
      {
        id: "rec-3",
        patternId: "pat-2",
        action: "启用动态显存分配",
        description: "减小 batch_size 从 32 到 16，降低显存占用约 30%",
        impact: "medium",
        confidence: 85,
        autoExecutable: true,
      },
      {
        id: "rec-4",
        patternId: "pat-3",
        action: "清理历史日志归档",
        description: "删除 30 天前的推理日志，预计释放 8.2GB 空间",
        impact: "low",
        confidence: 95,
        autoExecutable: true,
      },
      {
        id: "rec-5",
        patternId: "pat-3",
        action: "扩容 NAS 存储卷",
        description: "从 48TB 扩容到 64TB，需要手动操作 RAID 配置",
        impact: "high",
        confidence: 88,
        autoExecutable: false,
      },
      {
        id: "rec-6",
        patternId: "pat-4",
        action: "降低 GPU-H100-02 工作频率",
        description: "将 GPU 频率从 1.8GHz 降至 1.5GHz，温度预计下降 10°C",
        impact: "high",
        confidence: 90,
        autoExecutable: true,
      },
      {
        id: "rec-7",
        patternId: "pat-4",
        action: "将任务从 GPU-H100-02 迁出",
        description: "临时将所有推理任务迁移到其他节点，让 GPU 冷却",
        impact: "high",
        confidence: 95,
        autoExecutable: true,
      },
      {
        id: "rec-8",
        patternId: "pat-5",
        action: "启用动态负载均衡",
        description: "开启跨节点负载均衡，自动将任务分配到空闲节点",
        impact: "medium",
        confidence: 72,
        autoExecutable: true,
      },
    ];
  }
}

// ============================================================
// 导出单例
// ============================================================

export const aiSuggestionService = new AISuggestionService();