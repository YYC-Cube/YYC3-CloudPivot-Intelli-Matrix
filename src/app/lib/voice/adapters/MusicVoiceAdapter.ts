/**
 * @file MusicVoiceAdapter.ts
 * @description YYC³ D-Music 音乐模块语音适配器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 */

import { VoiceService } from '../core/VoiceService';
import type { SpeechRecognitionResult, EmotionAnalysisResult, VoiceProfile } from '../core/types';
import { WakeWordDetector } from './WakeWordDetector';
import { CommandRouter } from './CommandRouter';
import type { VoiceAdapterConfig } from './types';
import type { VoiceCommand } from '../core/types';
import { DEFAULT_ADAPTER_CONFIG } from './types';
import {
  getMusicVoiceProfile,
  MUSIC_VOICE_COMMANDS,
} from '../profiles/musicProfiles';

export interface MusicPlayerState {
  isPlaying: boolean;
  currentTrack: string | null;
  volume: number;
  isShuffle: boolean;
  repeatMode: 'none' | 'one' | 'all';
  currentTime: number;
  duration: number;
}

export interface MusicVoiceAdapterEvents {
  onCommand?: (action: string, params?: Record<string, unknown>) => void;
  onStateChange?: (state: MusicPlayerState) => void;
  onEmotionChange?: (emotion: EmotionAnalysisResult) => void;
  onWakeWord?: () => void;
  onLyricsRequest?: () => void;
  onCreateRequest?: () => void;
}

export class MusicVoiceAdapter {
  private voiceService: VoiceService;
  private wakeWordDetector: WakeWordDetector;
  private commandRouter: CommandRouter;
  private config: VoiceAdapterConfig;
  private currentScene: 'dj' | 'narrator' | 'companion' | 'announcer' = 'companion';
  private playerState: MusicPlayerState = {
    isPlaying: false,
    currentTrack: null,
    volume: 0.7,
    isShuffle: false,
    repeatMode: 'none',
    currentTime: 0,
    duration: 0,
  };
  private events: MusicVoiceAdapterEvents = {};
  private isInitialized: boolean = false;

  constructor(config?: Partial<VoiceAdapterConfig>) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.voiceService = new VoiceService({ language: this.config.language === 'zh' ? 'zh-CN' : 'en-US' });
    this.wakeWordDetector = new WakeWordDetector({
      words: this.config.language === 'zh' ? ['音乐', '播放器'] : ['music', 'player'],
      sensitivity: 0.8,
      cooldown: 2000,
    });
    this.commandRouter = new CommandRouter({ fuzzyMatch: true, minConfidence: 0.7 });
    this.setupMusicCommands();
  }

  private setupMusicCommands(): void {
    const commands: VoiceCommand[] = MUSIC_VOICE_COMMANDS[this.config.language].map((cmd) => ({
      id: cmd.action,
      command: cmd.cmd,
      aliases: cmd.aliases,
      description: cmd.description,
      action: () => this.executeMusicAction(cmd.action),
      category: 'music',
    }));

    this.commandRouter.registerCommands(commands);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {return true;}

    const voiceInitialized = await this.voiceService.initialize();
    if (!voiceInitialized) {
      console.warn('[MusicVoiceAdapter] Voice service initialization failed');
    }

    this.wakeWordDetector.onDetected((result) => {
      if (result.detected) {
        this.handleWakeWord();
      }
    });

    if (this.config.wakeWordEnabled) {
      this.wakeWordDetector.enable();
    }

    const profile = getMusicVoiceProfile(this.currentScene);
    if (profile) {
      this.voiceService.setProfile(profile);
    }

    this.isInitialized = true;
    return true;
  }

  private handleWakeWord(): void {
    this.wakeWordDetector.playWakeSound();
    this.events.onWakeWord?.();
    this.startListening();
  }

  setScene(scene: 'dj' | 'narrator' | 'companion' | 'announcer'): void {
    this.currentScene = scene;
    const profile = getMusicVoiceProfile(scene);
    if (profile) {
      this.voiceService.setProfile(profile);
    }
  }

  getScene(): string {
    return this.currentScene;
  }

  updatePlayerState(state: Partial<MusicPlayerState>): void {
    this.playerState = { ...this.playerState, ...state };
    this.events.onStateChange?.(this.playerState);
  }

  getPlayerState(): MusicPlayerState {
    return { ...this.playerState };
  }

  startListening(): void {
    this.voiceService.startListening(
      (result) => this.handleSpeechResult(result),
      (error) => this.handleError(error)
    );
  }

  stopListening(): void {
    this.voiceService.stopListening();
  }

  private handleSpeechResult(result: SpeechRecognitionResult): void {
    const wakeResult = this.wakeWordDetector.detect(result.transcript);

    if (wakeResult.detected) {
      return;
    }

    const commandMatch = this.commandRouter.match(result.transcript);

    if (commandMatch.matched && commandMatch.command) {
      this.commandRouter.execute(commandMatch.command);
      return;
    }

    if (result.emotion) {
      this.events.onEmotionChange?.(result.emotion);
    }
  }

  private executeMusicAction(action: string): void {
    switch (action) {
      case 'play':
        this.playerState.isPlaying = true;
        break;
      case 'pause':
        this.playerState.isPlaying = false;
        break;
      case 'next':
      case 'previous':
        break;
      case 'volumeUp':
        this.playerState.volume = Math.min(1, this.playerState.volume + 0.1);
        break;
      case 'volumeDown':
        this.playerState.volume = Math.max(0, this.playerState.volume - 0.1);
        break;
      case 'mute':
        this.playerState.volume = this.playerState.volume > 0 ? 0 : 0.7;
        break;
      case 'shuffle':
        this.playerState.isShuffle = !this.playerState.isShuffle;
        break;
      case 'repeat': {
        const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.playerState.repeatMode);
        this.playerState.repeatMode = modes[(currentIndex + 1) % 3];
        break;
      }
      case 'like':
      case 'dislike':
      case 'playlist':
      case 'leaderboard':
      case 'comments':
      case 'community':
      case 'analytics':
        break;
      case 'create':
        this.events.onCreateRequest?.();
        break;
    }

    this.events.onCommand?.(action);
    this.events.onStateChange?.(this.playerState);
  }

  private handleError(error: Error): void {
    console.error('[MusicVoiceAdapter] Error:', error);
  }

  async speak(text: string): Promise<void> {
    await this.voiceService.speak(text);
  }

  async announceTrack(trackName: string, artist?: string): Promise<void> {
    const profile = getMusicVoiceProfile('announcer');
    if (profile) {
      this.voiceService.setProfile(profile);
    }

    const announcement = artist
      ? `正在播放：${trackName}，演唱者：${artist}`
      : `正在播放：${trackName}`;

    await this.voiceService.speak(announcement);

    const currentProfile = getMusicVoiceProfile(this.currentScene);
    if (currentProfile) {
      this.voiceService.setProfile(currentProfile);
    }
  }

  async speakWithScene(text: string, scene?: 'dj' | 'narrator' | 'companion' | 'announcer'): Promise<void> {
    const targetScene = scene || this.currentScene;
    const profile = getMusicVoiceProfile(targetScene);

    if (profile) {
      await this.voiceService.speakWithProfile(text, profile);
    } else {
      await this.voiceService.speak(text);
    }
  }

  registerCommand(command: VoiceCommand): void {
    this.commandRouter.registerCommand(command);
  }

  on(events: MusicVoiceAdapterEvents): void {
    this.events = { ...this.events, ...events };
  }

  getProfile(): VoiceProfile | null {
    return this.voiceService.getProfile();
  }

  isListening(): boolean {
    return this.voiceService.getIsListening();
  }

  destroy(): void {
    this.voiceService.destroy();
    this.wakeWordDetector.disable();
    this.commandRouter.clear();
    this.isInitialized = false;
  }
}

export default MusicVoiceAdapter;
