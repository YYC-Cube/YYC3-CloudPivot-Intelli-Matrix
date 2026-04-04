/**
 * @file types.ts
 * @description YYC³ 可视化组件类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';

export interface VisualizationConfig {
  width: number;
  height: number;
  fps: number;
  responsive: boolean;
}

export interface EmotionVisualizerConfig extends VisualizationConfig {
  showLabels: boolean;
  showHistory: boolean;
  historyLength: number;
  transitionDuration: number;
  colorScheme: 'default' | 'warm' | 'cool' | 'neon';
}

export interface WaveformConfig extends VisualizationConfig {
  barCount: number;
  barWidth: number;
  barGap: number;
  smoothing: number;
  color: string;
  backgroundColor: string;
  mirror: boolean;
}

export interface EmotionHistoryEntry {
  emotion: EmotionType;
  confidence: number;
  timestamp: number;
  audioFeatures?: {
    pitch: number;
    energy: number;
    variation: number;
  };
}

export interface VisualizationState {
  isRunning: boolean;
  currentEmotion: EmotionType | null;
  emotionHistory: EmotionHistoryEntry[];
  audioLevel: number;
  frequencyData: Uint8Array | null;
}

export const EMOTION_VISUALIZER_COLORS: Record<EmotionType, { primary: string; secondary: string; glow: string }> = {
  happy: { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255, 215, 0, 0.5)' },
  sad: { primary: '#4169E1', secondary: '#1E90FF', glow: 'rgba(65, 105, 225, 0.5)' },
  angry: { primary: '#DC143C', secondary: '#FF4500', glow: 'rgba(220, 20, 60, 0.5)' },
  fear: { primary: '#8B008B', secondary: '#9932CC', glow: 'rgba(139, 0, 139, 0.5)' },
  surprise: { primary: '#00CED1', secondary: '#48D1CC', glow: 'rgba(0, 206, 209, 0.5)' },
  disgust: { primary: '#556B2F', secondary: '#6B8E23', glow: 'rgba(85, 107, 47, 0.5)' },
  neutral: { primary: '#00d4ff', secondary: '#0099cc', glow: 'rgba(0, 212, 255, 0.5)' },
};

export const DEFAULT_WAVEFORM_CONFIG: WaveformConfig = {
  width: 800,
  height: 200,
  fps: 60,
  responsive: true,
  barCount: 64,
  barWidth: 4,
  barGap: 2,
  smoothing: 0.8,
  color: '#00d4ff',
  backgroundColor: 'transparent',
  mirror: true,
};

export const DEFAULT_EMOTION_VISUALIZER_CONFIG: EmotionVisualizerConfig = {
  width: 400,
  height: 400,
  fps: 30,
  responsive: true,
  showLabels: true,
  showHistory: true,
  historyLength: 50,
  transitionDuration: 300,
  colorScheme: 'default',
};
