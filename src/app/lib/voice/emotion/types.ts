/**
 * @file types.ts
 * @description YYC³ 音乐情感分析类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';

export interface MusicFeatures {
  tempo: number;
  energy: number;
  danceability: number;
  valence: number;
  acousticness: number;
  instrumentalness: number;
  loudness: number;
  mode: 'major' | 'minor';
  key: string;
}

export interface MusicEmotionResult {
  primaryEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  confidence: number;
  features: MusicFeatures;
  mood: 'upbeat' | 'melancholic' | 'energetic' | 'calm' | 'romantic' | 'dark';
  tags: string[];
}

export interface PlaylistAnalysis {
  id: string;
  name: string;
  trackCount: number;
  averageFeatures: MusicFeatures;
  dominantEmotions: EmotionType[];
  moodDistribution: Record<string, number>;
  recommendations: string[];
  createdAt: number;
}

export interface MusicEmotionMapping {
  emotion: EmotionType;
  tempoRange: [number, number];
  energyRange: [number, number];
  valenceRange: [number, number];
  modes: ('major' | 'minor')[];
  keywords: string[];
}

export const MUSIC_EMOTION_MAPPINGS: MusicEmotionMapping[] = [
  {
    emotion: 'happy',
    tempoRange: [100, 140],
    energyRange: [0.6, 1.0],
    valenceRange: [0.7, 1.0],
    modes: ['major'],
    keywords: ['欢快', '阳光', '活力', '积极', 'upbeat', 'cheerful'],
  },
  {
    emotion: 'sad',
    tempoRange: [60, 90],
    energyRange: [0.1, 0.5],
    valenceRange: [0.0, 0.4],
    modes: ['minor'],
    keywords: ['悲伤', '忧郁', '思念', '孤独', 'melancholy', 'lonely'],
  },
  {
    emotion: 'angry',
    tempoRange: [120, 180],
    energyRange: [0.7, 1.0],
    valenceRange: [0.1, 0.5],
    modes: ['minor'],
    keywords: ['愤怒', '激烈', '力量', '反抗', 'aggressive', 'intense'],
  },
  {
    emotion: 'fear',
    tempoRange: [80, 120],
    energyRange: [0.3, 0.7],
    valenceRange: [0.0, 0.3],
    modes: ['minor'],
    keywords: ['恐惧', '紧张', '悬疑', '黑暗', 'tense', 'dark'],
  },
  {
    emotion: 'surprise',
    tempoRange: [100, 150],
    energyRange: [0.5, 0.9],
    valenceRange: [0.5, 0.8],
    modes: ['major', 'minor'],
    keywords: ['惊喜', '震撼', '史诗', '壮阔', 'epic', 'dramatic'],
  },
  {
    emotion: 'disgust',
    tempoRange: [90, 130],
    energyRange: [0.4, 0.7],
    valenceRange: [0.2, 0.5],
    modes: ['minor'],
    keywords: ['厌恶', '讽刺', '批判', '黑暗', 'cynical', 'dark'],
  },
  {
    emotion: 'neutral',
    tempoRange: [80, 120],
    energyRange: [0.3, 0.6],
    valenceRange: [0.4, 0.6],
    modes: ['major', 'minor'],
    keywords: ['平静', '放松', '冥想', '氛围', 'calm', 'ambient'],
  },
];
