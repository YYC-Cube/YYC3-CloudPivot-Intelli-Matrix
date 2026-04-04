/**
 * @file 情感音乐推荐服务
 * @description 基于情绪分析的音乐推荐引擎
 * @author YYC³ Team
 * @version 2.0.0
 */

import type { 
  MusicSong, 
  MusicMood, 
  MusicActivity, 
  MusicEmotionProfile, 
  MusicRecommendation 
} from './types';
import { getAllSongs } from './MusicData';

const MOOD_BPM_MAP: Record<MusicMood, { min: number; max: number }> = {
  happy: { min: 100, max: 140 },
  sad: { min: 60, max: 90 },
  energetic: { min: 120, max: 180 },
  calm: { min: 60, max: 100 },
  romantic: { min: 70, max: 110 },
  melancholy: { min: 60, max: 85 },
  upbeat: { min: 110, max: 150 },
  peaceful: { min: 50, max: 90 },
};

const ACTIVITY_ENERGY_MAP: Record<MusicActivity, 'low' | 'medium' | 'high'> = {
  focus: 'low',
  relax: 'low',
  exercise: 'high',
  sleep: 'low',
  party: 'high',
  commute: 'medium',
  morning: 'medium',
  evening: 'low',
};

const EMOTION_TO_MOOD_MAP: Record<string, MusicMood[]> = {
  happy: ['happy', 'upbeat', 'energetic'],
  sad: ['sad', 'melancholy', 'peaceful'],
  angry: ['energetic', 'upbeat'],
  fearful: ['calm', 'peaceful'],
  surprised: ['upbeat', 'energetic'],
  disgusted: ['calm', 'peaceful'],
  neutral: ['calm', 'peaceful'],
};

class EmotionMusicService {
  private songDatabase: MusicSong[] = [];
  private recentlyPlayed: Set<string> = new Set();

  constructor() {
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.songDatabase = this.getDefaultSongs();
  }

  private getDefaultSongs(): MusicSong[] {
    return getAllSongs();
  }

  recommendByEmotion(
    emotionProfile: MusicEmotionProfile,
    options?: {
      activity?: MusicActivity;
      excludeRecent?: boolean;
      limit?: number;
    }
  ): MusicRecommendation {
    const { activity, excludeRecent = true, limit = 10 } = options || {};

    const dominantEmotion = this.getDominantEmotion(emotionProfile);
    const preferredMoods = EMOTION_TO_MOOD_MAP[dominantEmotion] || ['calm'];
    const targetEnergy = activity ? ACTIVITY_ENERGY_MAP[activity] : undefined;

    let candidates = this.songDatabase.filter((song) => {
      if (excludeRecent && this.recentlyPlayed.has(song.id)) {
        return false;
      }
      if (song.mood && !preferredMoods.includes(song.mood)) {
        return false;
      }
      if (targetEnergy && song.energy !== targetEnergy) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      candidates = this.songDatabase.filter((song) => {
        if (targetEnergy && song.energy !== targetEnergy) {
          return false;
        }
        return true;
      });
    }

    candidates = this.sortByRelevance(candidates, emotionProfile);

    const selectedSongs = candidates.slice(0, limit);

    const reason = this.generateRecommendationReason(dominantEmotion, activity);

    return {
      songs: selectedSongs,
      reason,
      emotionProfile,
      timestamp: new Date(),
    };
  }

  recommendByMood(mood: MusicMood, limit: number = 10): MusicSong[] {
    const bpmRange = MOOD_BPM_MAP[mood];
    
    const candidates = this.songDatabase.filter((song) => {
      if (song.mood === mood) {return true;}
      if (song.bpm && song.bpm >= bpmRange.min && song.bpm <= bpmRange.max) {
        return true;
      }
      return false;
    });

    return candidates.slice(0, limit);
  }

  recommendByActivity(activity: MusicActivity, limit: number = 10): MusicSong[] {
    const targetEnergy = ACTIVITY_ENERGY_MAP[activity];
    
    const candidates = this.songDatabase.filter(
      (song) => song.energy === targetEnergy
    );

    return candidates.slice(0, limit);
  }

  searchSongs(query: string): MusicSong[] {
    const lowerQuery = query.toLowerCase();
    
    return this.songDatabase.filter(
      (song) =>
        song.title.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery) ||
        song.album.toLowerCase().includes(lowerQuery) ||
        song.genre?.toLowerCase().includes(lowerQuery)
    );
  }

  getSongById(id: string): MusicSong | undefined {
    return this.songDatabase.find((song) => song.id === id);
  }

  getAllSongs(): MusicSong[] {
    return [...this.songDatabase];
  }

  markAsPlayed(songId: string): void {
    this.recentlyPlayed.add(songId);
    if (this.recentlyPlayed.size > 50) {
      const firstItem = this.recentlyPlayed.values().next().value;
      if (firstItem) {
        this.recentlyPlayed.delete(firstItem);
      }
    }
  }

  private getDominantEmotion(profile: MusicEmotionProfile): string {
    let maxScore = 0;
    let dominantEmotion = 'neutral';

    for (const [emotion, score] of Object.entries(profile)) {
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    return dominantEmotion;
  }

  private sortByRelevance(
    songs: MusicSong[],
    profile: MusicEmotionProfile
  ): MusicSong[] {
    return songs.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, profile);
      const scoreB = this.calculateRelevanceScore(b, profile);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(song: MusicSong, profile: MusicEmotionProfile): number {
    let score = 0;

    if (song.mood && profile[song.mood as keyof MusicEmotionProfile] !== undefined) {
      score += profile[song.mood as keyof MusicEmotionProfile] * 10;
    }

    if (song.energy === 'low' && (profile.calm > 0.5 || profile.sad > 0.5)) {
      score += 5;
    }
    if (song.energy === 'high' && (profile.energetic > 0.5 || profile.happy > 0.5)) {
      score += 5;
    }

    return score;
  }

  private generateRecommendationReason(emotion: string, activity?: MusicActivity): string {
    const emotionReasons: Record<string, string> = {
      happy: '检测到您心情愉快，为您推荐欢快的音乐',
      sad: '为您推荐一些舒缓的音乐，希望能带来慰藉',
      angry: '为您推荐一些能释放情绪的音乐',
      fearful: '为您推荐平静的音乐，帮助放松心情',
      surprised: '为您推荐一些充满活力的音乐',
      disgusted: '为您推荐一些清新的音乐',
      neutral: '根据您的偏好为您推荐音乐',
    };

    let reason = emotionReasons[emotion] || emotionReasons.neutral;

    if (activity) {
      const activityTexts: Record<MusicActivity, string> = {
        focus: '专注模式',
        relax: '放松时刻',
        exercise: '运动时光',
        sleep: '睡前时光',
        party: '派对氛围',
        commute: '通勤路上',
        morning: '清晨时光',
        evening: '傍晚时分',
      };
      reason += `，适合${activityTexts[activity]}`;
    }

    return reason;
  }
}

export const emotionMusicService = new EmotionMusicService();
export { EmotionMusicService };
