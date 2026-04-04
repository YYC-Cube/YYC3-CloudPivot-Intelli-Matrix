/**
 * @file VoiceService.ts
 * @description YYC³ 统一语音服务入口 - 整合STT/TTS/情感分析能力
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @status stable
 */

import { STTEngine } from './STTEngine';
import { TTSEngine } from './TTSEngine';
import { EmotionEngine } from './EmotionEngine';
import type {
  VoiceConfig,
  VoiceProfile,
  SpeechRecognitionResult,
  EmotionAnalysisResult,
  SpeakOptions,
  VoiceServiceEvents,
  EmotionType,
} from './types';

export class VoiceService {
  private sttEngine: STTEngine;
  private ttsEngine: TTSEngine;
  private emotionEngine: EmotionEngine;
  private config: VoiceConfig;
  private currentProfile: VoiceProfile | null = null;
  private events: VoiceServiceEvents = {};

  constructor(config?: Partial<VoiceConfig>) {
    this.config = {
      language: config?.language ?? 'zh-CN',
      continuous: config?.continuous ?? false,
      interimResults: config?.interimResults ?? true,
      maxAlternatives: config?.maxAlternatives ?? 1,
    };

    this.sttEngine = new STTEngine(this.config);
    this.ttsEngine = new TTSEngine();
    this.emotionEngine = new EmotionEngine();
  }

  async initialize(): Promise<boolean> {
    const emotionInitialized = await this.emotionEngine.initialize();
    return emotionInitialized;
  }

  on(event: keyof VoiceServiceEvents, callback: NonNullable<VoiceServiceEvents[keyof VoiceServiceEvents]>): void {
    (this.events as Record<string, unknown>)[event] = callback;
  }

  off(event: keyof VoiceServiceEvents): void {
    delete (this.events as Record<string, unknown>)[event];
  }

  isSTTSupported(): boolean {
    return this.sttEngine.isSupported();
  }

  isTTSSupported(): boolean {
    return this.ttsEngine.isSupported();
  }

  isEmotionEngineInitialized(): boolean {
    return this.emotionEngine.isInitialized();
  }

  startListening(
    onResult?: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.sttEngine.isSupported()) {
      const error = new Error('Speech recognition not supported');
      onError?.(error);
      this.events.onError?.(error);
      return;
    }

    this.events.onListeningStart?.();

    this.sttEngine.startListening(
      (result) => {
        const emotion = this.emotionEngine.analyzeEmotion();
        const enrichedResult: SpeechRecognitionResult = {
          ...result,
          emotion,
        };

        onResult?.(enrichedResult);
        this.events.onResult?.(enrichedResult);

        if (emotion) {
          this.events.onEmotionDetected?.(emotion);
        }
      },
      (error) => {
        onError?.(error);
        this.events.onError?.(error);
      }
    );

    this.sttEngine.onEnd(() => {
      this.events.onListeningEnd?.();
    });
  }

  stopListening(): void {
    this.sttEngine.stopListening();
  }

  getIsListening(): boolean {
    return this.sttEngine.getIsListening();
  }

  async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!this.ttsEngine.isSupported()) {
      console.warn('[VoiceService] Speech synthesis not supported');
      return;
    }

    return this.ttsEngine.speak(text, options);
  }

  async speakWithProfile(text: string, profile: VoiceProfile): Promise<void> {
    this.currentProfile = profile;
    return this.ttsEngine.speakWithProfile(text, profile);
  }

  async speakWithEmotion(text: string, emotion: EmotionType): Promise<void> {
    return this.ttsEngine.speakWithEmotion(text, emotion);
  }

  async speakWithRole(text: string, roleStyle: 'cheerful' | 'calm' | 'gentle' | 'professional' | 'warm'): Promise<void> {
    return this.ttsEngine.speakWithRole(text, roleStyle);
  }

  stopSpeaking(): void {
    this.ttsEngine.stop();
  }

  getIsSpeaking(): boolean {
    return this.ttsEngine.getIsSpeaking();
  }

  analyzeEmotion(): EmotionAnalysisResult {
    return this.emotionEngine.analyzeEmotion();
  }

  analyzeTextEmotion(text: string): EmotionType {
    return this.emotionEngine.analyzeTextEmotion(text);
  }

  fuseEmotions(
    voiceEmotion: EmotionAnalysisResult,
    textEmotion: EmotionType,
    voiceWeight?: number
  ): EmotionAnalysisResult {
    return this.emotionEngine.fuseEmotions(voiceEmotion, textEmotion, voiceWeight);
  }

  setProfile(profile: VoiceProfile): void {
    this.currentProfile = profile;
  }

  getProfile(): VoiceProfile | null {
    return this.currentProfile;
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    this.sttEngine.updateConfig(this.config);
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  getAvailableVoices(): { lang: string; name: string; localService: boolean }[] {
    return this.ttsEngine.getAvailableVoices();
  }

  destroy(): void {
    this.sttEngine.stopListening();
    this.ttsEngine.stop();
    this.emotionEngine.destroy();
    this.events = {};
  }
}

export default VoiceService;

export { STTEngine } from './STTEngine';
export { TTSEngine } from './TTSEngine';
export { EmotionEngine } from './EmotionEngine';
export * from './types';
