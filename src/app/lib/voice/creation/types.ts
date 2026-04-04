/**
 * @file types.ts
 * @description YYC³ 语音创作类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';

export interface LyricsTemplate {
  id: string;
  name: string;
  genre: 'pop' | 'rock' | 'ballad' | 'electronic' | 'folk' | 'rap';
  structure: string[];
  emotion: EmotionType;
  language: 'zh' | 'en';
}

export interface LyricsGenerationOptions {
  theme?: string;
  emotion?: EmotionType;
  genre?: LyricsTemplate['genre'];
  language?: 'zh' | 'en';
  verses: number;
  includeChorus: boolean;
  rhymeScheme?: 'AABB' | 'ABAB' | 'ABBA' | 'free';
}

export interface GeneratedLyrics {
  id: string;
  title: string;
  content: {
    verse: string[];
    chorus?: string[];
    bridge?: string[];
    outro?: string;
  };
  emotion: EmotionType;
  genre: LyricsTemplate['genre'];
  createdAt: number;
}

export interface VoiceCreationSession {
  id: string;
  type: 'lyrics' | 'melody' | 'full';
  status: 'idle' | 'recording' | 'processing' | 'completed';
  inputText?: string;
  generatedContent?: GeneratedLyrics;
  audioUrl?: string;
  createdAt: number;
}

export const LYRICS_TEMPLATES: LyricsTemplate[] = [
  {
    id: 'pop-love',
    name: '流行情歌',
    genre: 'pop',
    structure: ['verse', 'verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus'],
    emotion: 'happy',
    language: 'zh',
  },
  {
    id: 'ballad-sad',
    name: '抒情慢歌',
    genre: 'ballad',
    structure: ['verse', 'chorus', 'verse', 'chorus', 'bridge', 'chorus', 'outro'],
    emotion: 'sad',
    language: 'zh',
  },
  {
    id: 'rock-energy',
    name: '摇滚激情',
    genre: 'rock',
    structure: ['verse', 'verse', 'chorus', 'verse', 'chorus', 'solo', 'chorus'],
    emotion: 'angry',
    language: 'zh',
  },
  {
    id: 'electronic-dance',
    name: '电子舞曲',
    genre: 'electronic',
    structure: ['intro', 'verse', 'build', 'drop', 'verse', 'drop', 'outro'],
    emotion: 'happy',
    language: 'zh',
  },
  {
    id: 'folk-story',
    name: '民谣故事',
    genre: 'folk',
    structure: ['verse', 'verse', 'chorus', 'verse', 'chorus', 'verse'],
    emotion: 'neutral',
    language: 'zh',
  },
  {
    id: 'rap-flow',
    name: '说唱Flow',
    genre: 'rap',
    structure: ['intro', 'verse', 'hook', 'verse', 'hook', 'verse', 'outro'],
    emotion: 'angry',
    language: 'zh',
  },
];

export const EMOTION_KEYWORDS: Record<EmotionType, string[]> = {
  happy: ['快乐', '幸福', '阳光', '微笑', '甜蜜', '美好', '希望', '梦想', 'happy', 'joy', 'love'],
  sad: ['悲伤', '孤独', '离别', '思念', '眼泪', '遗憾', '回忆', '失落', 'sad', 'lonely', 'miss'],
  angry: ['愤怒', '反抗', '战斗', '力量', '燃烧', '冲击', '打破', '冲破', 'angry', 'fight', 'fire'],
  fear: ['恐惧', '黑暗', '深渊', '迷失', '颤抖', '未知', '危险', '警告', 'fear', 'dark', 'danger'],
  surprise: ['惊喜', '奇迹', '意外', '发现', '震撼', '惊叹', '不可思议', 'surprise', 'amazing', 'wonder'],
  disgust: ['厌恶', '虚伪', '谎言', '背叛', '面具', '伪装', '揭露', 'disgust', 'fake', 'lie'],
  neutral: ['平静', '宁静', '思考', '远方', '旅程', '时光', '岁月', '故事', 'calm', 'peace', 'time'],
};
