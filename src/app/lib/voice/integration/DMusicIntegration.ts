/**
 * @file DMusicIntegration.ts
 * @description YYC³ D-Music组件集成适配器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';
import type {
  DMusicEmotion,
  DMusicTrack,
  DMusicPlayerState,
  DMusicPlayerActions,
  DMusicIntegrationConfig,
  DMusicVoiceCommand,
} from './types';
import { EMOTION_TO_DMUSIC, DMUSIC_VOICE_COMMANDS_ZH, DMUSIC_VOICE_COMMANDS_EN, DMUSIC_EMOTION_PALETTES } from './types';

export class DMusicIntegration {
  private config: DMusicIntegrationConfig;
  private playerState: DMusicPlayerState;
  private playerActions: Partial<DMusicPlayerActions> = {};
  private onEmotionChange?: (emotion: DMusicEmotion) => void;
  private onCommandExecuted?: (command: string, success: boolean) => void;
  private onStateChange?: (state: DMusicPlayerState) => void;

  constructor(config?: Partial<DMusicIntegrationConfig>) {
    this.config = {
      enableVoiceControl: true,
      enableEmotionSync: true,
      enableLyricsCreation: true,
      enableEmotionVisualization: true,
      wakeWordEnabled: true,
      language: 'zh',
      ...config,
    };

    this.playerState = this.getDefaultState();
  }

  private getDefaultState(): DMusicPlayerState {
    return {
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.7,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'none',
      playlist: [],
      playlistIndex: 0,
      audioEnergy: 0,
    };
  }

  registerPlayerActions(actions: Partial<DMusicPlayerActions>): void {
    this.playerActions = { ...this.playerActions, ...actions };
  }

  updatePlayerState(state: Partial<DMusicPlayerState>): void {
    this.playerState = { ...this.playerState, ...state };
    this.onStateChange?.(this.playerState);
  }

  getPlayerState(): DMusicPlayerState {
    return { ...this.playerState };
  }

  setEmotionCallback(callback: (emotion: DMusicEmotion) => void): void {
    this.onEmotionChange = callback;
  }

  setCommandCallback(callback: (command: string, success: boolean) => void): void {
    this.onCommandExecuted = callback;
  }

  setStateCallback(callback: (state: DMusicPlayerState) => void): void {
    this.onStateChange = callback;
  }

  getVoiceCommands(): DMusicVoiceCommand[] {
    return this.config.language === 'zh' ? DMUSIC_VOICE_COMMANDS_ZH : DMUSIC_VOICE_COMMANDS_EN;
  }

  processVoiceCommand(transcript: string): { matched: boolean; command?: DMusicVoiceCommand; executed?: boolean } {
    if (!this.config.enableVoiceControl) {
      return { matched: false };
    }

    const commands = this.getVoiceCommands();
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const cmd of commands) {
      const commandMatch = normalizedTranscript.includes(cmd.command.toLowerCase());
      const aliasMatch = cmd.aliases.some((alias) => normalizedTranscript.includes(alias.toLowerCase()));

      if (commandMatch || aliasMatch) {
        const executed = this.executeCommand(cmd);
        this.onCommandExecuted?.(cmd.command, executed);
        return { matched: true, command: cmd, executed };
      }
    }

    return { matched: false };
  }

  private executeCommand(cmd: DMusicVoiceCommand): boolean {
    const action = this.playerActions[cmd.action];
    if (!action) {
      return false;
    }

    try {
      if (cmd.params) {
        if (cmd.action === 'setVolume' && typeof cmd.params.volume === 'number') {
          (action as (volume: number) => void)(cmd.params.volume);
        } else {
          (action as () => void)();
        }
      } else {
        (action as () => void)();
      }
      return true;
    } catch {
      return false;
    }
  }

  syncEmotion(emotion: EmotionType): DMusicEmotion {
    const dmusicEmotion = EMOTION_TO_DMUSIC[emotion];
    this.onEmotionChange?.(dmusicEmotion);
    return dmusicEmotion;
  }

  getEmotionPalette(emotion: DMusicEmotion): { primary: string; secondary: string; glow: string } {
    return DMUSIC_EMOTION_PALETTES[emotion] || DMUSIC_EMOTION_PALETTES.neutral;
  }

  getRecommendedTracks(emotion: DMusicEmotion, count: number = 10): DMusicTrack[] {
    const emotionKeywords: Record<DMusicEmotion, string[]> = {
      happy: ['欢快', '阳光', '活力'],
      energetic: ['激情', '动感', '摇滚'],
      calm: ['轻音乐', '放松', '冥想'],
      sad: ['治愈', '温暖', '抒情'],
      neutral: ['流行', '经典', '推荐'],
      love: ['情歌', '浪漫', '甜蜜'],
    };

    const keywords = emotionKeywords[emotion] || emotionKeywords.neutral;
    const tracks: DMusicTrack[] = [];

    for (let i = 0; i < count; i++) {
      const keyword = keywords[i % keywords.length];
      tracks.push({
        id: `track-${emotion}-${i}`,
        title: `${keyword}歌曲 ${i + 1}`,
        artist: 'D-Music',
        duration: 180 + Math.floor(Math.random() * 120),
        emotion,
        tags: [keyword, emotion],
      });
    }

    return tracks;
  }

  createEmotionBasedPlaylist(emotion: DMusicEmotion, _name?: string): DMusicTrack[] {
    const tracks = this.getRecommendedTracks(emotion, 20);
    this.updatePlayerState({
      playlist: tracks,
      playlistIndex: 0,
    });
    return tracks;
  }

  analyzeTrackEmotion(track: DMusicTrack): DMusicEmotion {
    if (track.emotion) {
      return track.emotion;
    }

    const title = track.title.toLowerCase();
    const tags = track.tags?.map((t) => t.toLowerCase()) || [];

    const emotionKeywords: Record<DMusicEmotion, string[]> = {
      happy: ['快乐', '欢快', '阳光', 'happy', 'joy', '阳光'],
      energetic: ['激情', '动感', '摇滚', 'energetic', 'rock', 'dance'],
      calm: ['轻音乐', '放松', '冥想', 'calm', 'peaceful', 'relax'],
      sad: ['治愈', '温暖', '抒情', 'sad', 'ballad', 'slow'],
      neutral: ['流行', '经典', '推荐', 'pop', 'classic'],
      love: ['情歌', '浪漫', '甜蜜', 'love', 'romantic', 'heart'],
    };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      if (keywords.some((kw) => title.includes(kw) || tags.includes(kw))) {
        return emotion as DMusicEmotion;
      }
    }

    return 'neutral';
  }

  getConfig(): DMusicIntegrationConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<DMusicIntegrationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.playerState = this.getDefaultState();
    this.playerActions = {};
  }
}

export default DMusicIntegration;
