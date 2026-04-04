/**
 * @file types.ts
 * @description YYC³ 统一语音服务类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @status stable
 */

export type EmotionType = 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'disgust' | 'neutral';

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceProfile {
  id: string;
  name: string;
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
  style?: 'cheerful' | 'calm' | 'gentle' | 'professional' | 'warm' | 'vigilant' | 'focused' | 'serene';
}

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  emotion?: EmotionAnalysisResult;
}

export interface EmotionAnalysisResult {
  type: EmotionType;
  confidence: number;
  audioFeatures: {
    pitch: number;
    energy: number;
    variation: number;
  };
}

export interface AudioFeatures {
  pitch: number;
  energy: number;
  variation: number;
  frequencyData: number[];
  timeDomainData: number[];
}

export interface SpeakOptions {
  pitch?: number;
  rate?: number;
  volume?: number;
  lang?: string;
  voice?: SpeechSynthesisVoice;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface VoiceServiceEvents {
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  onResult?: (result: SpeechRecognitionResult) => void;
  onError?: (error: Error) => void;
  onEmotionDetected?: (emotion: EmotionAnalysisResult) => void;
}

export interface VoiceCommand {
  id: string;
  command: string;
  aliases?: string[];
  description: string;
  action: () => void;
  category?: string;
}

export interface VoiceCommandResult {
  matched: boolean;
  command?: VoiceCommand;
  confidence: number;
  transcript: string;
}

export interface EmotionColorMapping {
  primary: string;
  secondary: string;
  gradient: string;
}

export const EMOTION_COLORS: Record<EmotionType, EmotionColorMapping> = {
  happy: {
    primary: '#FFD700',
    secondary: '#FFA500',
    gradient: 'from-yellow-500 to-amber-500',
  },
  sad: {
    primary: '#4169E1',
    secondary: '#1E90FF',
    gradient: 'from-blue-600 to-blue-400',
  },
  angry: {
    primary: '#DC143C',
    secondary: '#FF4500',
    gradient: 'from-red-600 to-orange-500',
  },
  fear: {
    primary: '#8B008B',
    secondary: '#9932CC',
    gradient: 'from-purple-800 to-purple-500',
  },
  surprise: {
    primary: '#00CED1',
    secondary: '#48D1CC',
    gradient: 'from-cyan-500 to-teal-400',
  },
  disgust: {
    primary: '#556B2F',
    secondary: '#6B8E23',
    gradient: 'from-olive-700 to-olive-500',
  },
  neutral: {
    primary: '#708090',
    secondary: '#A9A9A9',
    gradient: 'from-gray-600 to-gray-400',
  },
};

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
  language: 'zh-CN',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
};

export const DEFAULT_VOICE_PROFILE: VoiceProfile = {
  id: 'default',
  name: 'Default',
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
  lang: 'zh-CN',
};
