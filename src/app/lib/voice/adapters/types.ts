/**
 * @file types.ts
 * @description YYC³ 语音适配器类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

export interface WakeWordResult {
  detected: boolean;
  word?: string;
  confidence: number;
  timestamp: number;
}

export interface CommandMatch {
  matched: boolean;
  command?: string;
  action?: string;
  confidence: number;
}

export interface VoiceAdapterConfig {
  enabled: boolean;
  wakeWordEnabled: boolean;
  autoStart: boolean;
  language: 'zh' | 'en';
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  emotion?: string;
}

export const DEFAULT_ADAPTER_CONFIG: VoiceAdapterConfig = {
  enabled: true,
  wakeWordEnabled: true,
  autoStart: false,
  language: 'zh',
};
