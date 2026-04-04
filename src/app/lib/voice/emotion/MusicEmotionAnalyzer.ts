/**
 * @file MusicEmotionAnalyzer.ts
 * @description YYC³ 音乐情感分析器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';
import type { MusicFeatures, MusicEmotionResult, PlaylistAnalysis, MusicEmotionMapping } from './types';
import { MUSIC_EMOTION_MAPPINGS } from './types';

export class MusicEmotionAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;

  async initialize(): Promise<boolean> {
    if (typeof window === 'undefined') {return false;}

    try {
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      return true;
    } catch {
      return false;
    }
  }

  analyzeFeatures(features: MusicFeatures): MusicEmotionResult {
    const emotionScores = this.calculateEmotionScores(features);
    const sortedEmotions = Object.entries(emotionScores)
      .sort(([, a], [, b]) => b - a);

    const primaryEmotion = sortedEmotions[0][0] as EmotionType;
    const secondaryEmotion = sortedEmotions[1][0] as EmotionType;
    const confidence = sortedEmotions[0][1];

    const mood = this.determineMood(features);
    const tags = this.generateTags(features, primaryEmotion);

    return {
      primaryEmotion,
      secondaryEmotion: sortedEmotions[1][1] > 0.3 ? secondaryEmotion : undefined,
      confidence,
      features,
      mood,
      tags,
    };
  }

  private calculateEmotionScores(features: MusicFeatures): Record<EmotionType, number> {
    const scores: Record<EmotionType, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      fear: 0,
      surprise: 0,
      disgust: 0,
      neutral: 0,
    };

    for (const mapping of MUSIC_EMOTION_MAPPINGS) {
      const score = this.calculateMappingScore(features, mapping);
      scores[mapping.emotion] = score;
    }

    return scores;
  }

  private calculateMappingScore(features: MusicFeatures, mapping: MusicEmotionMapping): number {
    let score = 0;
    let factors = 0;

    const [tempoMin, tempoMax] = mapping.tempoRange;
    if (features.tempo >= tempoMin && features.tempo <= tempoMax) {
      const tempoCenter = (tempoMin + tempoMax) / 2;
      const tempoDiff = Math.abs(features.tempo - tempoCenter);
      const tempoRange = (tempoMax - tempoMin) / 2;
      score += 1 - (tempoDiff / tempoRange);
    }
    factors++;

    const [energyMin, energyMax] = mapping.energyRange;
    if (features.energy >= energyMin && features.energy <= energyMax) {
      score += 1;
    }
    factors++;

    const [valenceMin, valenceMax] = mapping.valenceRange;
    if (features.valence >= valenceMin && features.valence <= valenceMax) {
      score += 1;
    }
    factors++;

    if (mapping.modes.includes(features.mode)) {
      score += 1;
    }
    factors++;

    return score / factors;
  }

  private determineMood(features: MusicFeatures): MusicEmotionResult['mood'] {
    if (features.tempo > 120 && features.energy > 0.7) {
      return 'energetic';
    }

    if (features.valence > 0.7 && features.energy > 0.5) {
      return 'upbeat';
    }

    if (features.valence < 0.3 && features.energy < 0.5) {
      return 'melancholic';
    }

    if (features.energy < 0.4 && features.tempo < 100) {
      return 'calm';
    }

    if (features.valence > 0.5 && features.energy < 0.6 && features.mode === 'major') {
      return 'romantic';
    }

    if (features.valence < 0.4 && features.mode === 'minor') {
      return 'dark';
    }

    return 'calm';
  }

  private generateTags(features: MusicFeatures, emotion: EmotionType): string[] {
    const tags: string[] = [];

    const mapping = MUSIC_EMOTION_MAPPINGS.find((m) => m.emotion === emotion);
    if (mapping) {
      tags.push(...mapping.keywords.slice(0, 3));
    }

    if (features.tempo > 140) {tags.push('fast');}
    if (features.tempo < 80) {tags.push('slow');}
    if (features.energy > 0.8) {tags.push('high-energy');}
    if (features.danceability > 0.7) {tags.push('danceable');}
    if (features.acousticness > 0.7) {tags.push('acoustic');}
    if (features.instrumentalness > 0.5) {tags.push('instrumental');}

    return [...new Set(tags)].slice(0, 8);
  }

  analyzePlaylist(tracks: MusicFeatures[], name: string = 'Playlist'): PlaylistAnalysis {
    if (tracks.length === 0) {
      return {
        id: `playlist-${Date.now()}`,
        name,
        trackCount: 0,
        averageFeatures: this.getDefaultFeatures(),
        dominantEmotions: [],
        moodDistribution: {},
        recommendations: [],
        createdAt: Date.now(),
      };
    }

    const averageFeatures = this.calculateAverageFeatures(tracks);
    const emotionCounts: Record<EmotionType, number> = {
      happy: 0, sad: 0, angry: 0, fear: 0, surprise: 0, disgust: 0, neutral: 0,
    };
    const moodDistribution: Record<string, number> = {};

    for (const track of tracks) {
      const result = this.analyzeFeatures(track);
      emotionCounts[result.primaryEmotion]++;
      moodDistribution[result.mood] = (moodDistribution[result.mood] || 0) + 1;
    }

    const dominantEmotions = Object.entries(emotionCounts)
      .filter(([, count]) => count > tracks.length * 0.1)
      .sort(([, a], [, b]) => b - a)
      .map(([emotion]) => emotion as EmotionType)
      .slice(0, 3);

    const recommendations = this.generateRecommendations(averageFeatures, dominantEmotions);

    return {
      id: `playlist-${Date.now()}`,
      name,
      trackCount: tracks.length,
      averageFeatures,
      dominantEmotions,
      moodDistribution,
      recommendations,
      createdAt: Date.now(),
    };
  }

  private calculateAverageFeatures(tracks: MusicFeatures[]): MusicFeatures {
    const sum = tracks.reduce(
      (acc, track) => ({
        tempo: acc.tempo + track.tempo,
        energy: acc.energy + track.energy,
        danceability: acc.danceability + track.danceability,
        valence: acc.valence + track.valence,
        acousticness: acc.acousticness + track.acousticness,
        instrumentalness: acc.instrumentalness + track.instrumentalness,
        loudness: acc.loudness + track.loudness,
        majorCount: acc.majorCount + (track.mode === 'major' ? 1 : 0),
      }),
      {
        tempo: 0, energy: 0, danceability: 0, valence: 0,
        acousticness: 0, instrumentalness: 0, loudness: 0, majorCount: 0,
      }
    );

    const count = tracks.length;
    return {
      tempo: sum.tempo / count,
      energy: sum.energy / count,
      danceability: sum.danceability / count,
      valence: sum.valence / count,
      acousticness: sum.acousticness / count,
      instrumentalness: sum.instrumentalness / count,
      loudness: sum.loudness / count,
      mode: sum.majorCount > count / 2 ? 'major' : 'minor',
      key: 'C',
    };
  }

  private getDefaultFeatures(): MusicFeatures {
    return {
      tempo: 120,
      energy: 0.5,
      danceability: 0.5,
      valence: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.5,
      loudness: -10,
      mode: 'major',
      key: 'C',
    };
  }

  private generateRecommendations(features: MusicFeatures, dominantEmotions: EmotionType[]): string[] {
    const recommendations: string[] = [];

    if (dominantEmotions.includes('happy')) {
      recommendations.push('适合运动、派对场景');
    }
    if (dominantEmotions.includes('sad')) {
      recommendations.push('适合深夜独处、雨天时光');
    }
    if (features.energy > 0.7) {
      recommendations.push('适合健身、跑步');
    }
    if (features.energy < 0.4) {
      recommendations.push('适合工作、学习、冥想');
    }
    if (features.danceability > 0.7) {
      recommendations.push('适合舞蹈、社交活动');
    }
    if (features.acousticness > 0.6) {
      recommendations.push('适合安静环境、放松时刻');
    }

    return recommendations.length > 0 ? recommendations : ['适合日常聆听'];
  }

  getRecommendedTracks(emotion: EmotionType, count: number = 10): MusicFeatures[] {
    const mapping = MUSIC_EMOTION_MAPPINGS.find((m) => m.emotion === emotion);
    if (!mapping) {return [];}

    const tracks: MusicFeatures[] = [];
    const [tempoMin, tempoMax] = mapping.tempoRange;
    const [energyMin, energyMax] = mapping.energyRange;
    const [valenceMin, valenceMax] = mapping.valenceRange;

    for (let i = 0; i < count; i++) {
      tracks.push({
        tempo: tempoMin + Math.random() * (tempoMax - tempoMin),
        energy: energyMin + Math.random() * (energyMax - energyMin),
        danceability: 0.3 + Math.random() * 0.7,
        valence: valenceMin + Math.random() * (valenceMax - valenceMin),
        acousticness: Math.random(),
        instrumentalness: Math.random(),
        loudness: -20 + Math.random() * 20,
        mode: mapping.modes[Math.floor(Math.random() * mapping.modes.length)],
        key: ['C', 'D', 'E', 'F', 'G', 'A', 'B'][Math.floor(Math.random() * 7)],
      });
    }

    return tracks;
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }
  }
}

export default MusicEmotionAnalyzer;
