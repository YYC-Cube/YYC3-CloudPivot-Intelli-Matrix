/**
 * @file 音乐空间类型定义
 * @description YYC³音乐空间核心类型系统
 * @author YYC³ Team
 * @version 1.0.0
 */

export interface MusicSong {
  id: string;
  title: string;
  artist: string;
  album: string;
  albumCover: string;
  duration: number;
  youtubeId?: string;
  audioUrl?: string;
  year?: number;
  genre?: string;
  bpm?: number;
  energy?: 'low' | 'medium' | 'high';
  mood?: MusicMood;
  isOriginal?: boolean;
  copyright?: string;
}

export type MusicMood = 
  | 'happy' 
  | 'sad' 
  | 'energetic' 
  | 'calm' 
  | 'romantic' 
  | 'melancholy' 
  | 'upbeat' 
  | 'peaceful';

export interface MusicPlaylist {
  id: string;
  name: string;
  description?: string;
  cover: string;
  songs: MusicSong[];
  mood?: MusicMood;
  activity?: MusicActivity;
  createdAt: Date;
  updatedAt: Date;
}

export type MusicActivity = 
  | 'focus' 
  | 'relax' 
  | 'exercise' 
  | 'sleep' 
  | 'party' 
  | 'commute'
  | 'morning'
  | 'evening';

export interface MusicEmotionProfile {
  happy: number;
  sad: number;
  energetic: number;
  calm: number;
  romantic: number;
  melancholy: number;
  upbeat: number;
  peaceful: number;
}

export interface MusicRecommendation {
  songs: MusicSong[];
  reason: string;
  emotionProfile: MusicEmotionProfile;
  timestamp: Date;
}

export interface MusicPlayerState {
  currentSong: MusicSong | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  repeat: 'off' | 'all' | 'one';
  shuffle: boolean;
  queue: MusicSong[];
  queueIndex: number;
}

export interface MusicVoiceCommand {
  command: 'play' | 'pause' | 'next' | 'previous' | 'volume_up' | 'volume_down' | 'search' | 'like' | 'share';
  params?: Record<string, string>;
  confidence: number;
}

export interface MusicVisualizationConfig {
  type: 'waveform' | 'spectrum' | 'particles' | 'emotion-ring' | 'circular';
  sensitivity: number;
  color: string;
  backgroundColor: string;
}

export interface MusicStats {
  totalPlayed: number;
  totalDuration: number;
  favoriteGenre: string;
  favoriteArtist: string;
  moodDistribution: MusicEmotionProfile;
  weeklyStats: {
    date: string;
    count: number;
    duration: number;
  }[];
}

export interface MusicChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  type: 'listen' | 'discover' | 'share' | 'create';
  completed: boolean;
  expiresAt?: Date;
}
