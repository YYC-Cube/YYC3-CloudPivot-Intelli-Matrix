/**
 * @file TTSEngine.ts
 * @description YYC³ 语音合成引擎 (Text-to-Speech)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @status stable
 */

import type { VoiceProfile, SpeakOptions, EmotionType } from './types';

const EMOTION_VOICE_STYLES: Record<EmotionType, { rate: number; pitch: number; volume: number }> = {
  happy: { rate: 1.1, pitch: 1.15, volume: 1.0 },
  sad: { rate: 0.85, pitch: 0.9, volume: 0.8 },
  angry: { rate: 1.2, pitch: 1.1, volume: 1.0 },
  fear: { rate: 0.9, pitch: 1.0, volume: 0.85 },
  surprise: { rate: 1.15, pitch: 1.2, volume: 1.0 },
  disgust: { rate: 0.95, pitch: 0.85, volume: 0.8 },
  neutral: { rate: 1.0, pitch: 1.0, volume: 0.9 },
};

const ROLE_VOICE_STYLES: Record<string, { rate: number; pitch: number; volume: number }> = {
  cheerful: { rate: 1.1, pitch: 1.15, volume: 1.0 },
  calm: { rate: 0.95, pitch: 1.0, volume: 0.9 },
  gentle: { rate: 0.9, pitch: 1.05, volume: 0.85 },
  professional: { rate: 1.0, pitch: 0.95, volume: 1.0 },
  warm: { rate: 0.95, pitch: 1.1, volume: 0.95 },
};

export class TTSEngine {
  private synthesis: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

  private isSpeaking = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.loadVoices();
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synthesis) {
      this.voices = this.synthesis.getVoices();
    }
  }

  isSupported(): boolean {
    return this.synthesis !== null;
  }

  getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  getChineseVoice(): SpeechSynthesisVoice | undefined {
    return this.voices.find((v) => v.lang.includes('zh')) || this.voices[0];
  }

  async speak(text: string, options?: SpeakOptions): Promise<void> {
    if (!this.synthesis) {
      console.warn('[TTSEngine] Speech synthesis not supported');
      return;
    }

    return new Promise((resolve, reject) => {
      this.synthesis!.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.rate = options?.rate ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      utterance.lang = options?.lang ?? 'zh-CN';

      if (options?.voice) {
        utterance.voice = options.voice;
      } else {
        const chineseVoice = this.getChineseVoice();
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
      }

      utterance.onend = () => {
        this.isSpeaking = false;
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        const error = new Error(`Speech synthesis error: ${event.error}`);
        options?.onError?.(error);
        reject(error);
      };

      this.isSpeaking = true;
      this.synthesis!.speak(utterance);
    });
  }

  async speakWithProfile(text: string, profile: VoiceProfile): Promise<void> {
    return this.speak(text, {
      pitch: profile.pitch,
      rate: profile.rate,
      volume: profile.volume,
      lang: profile.lang,
    });
  }

  async speakWithEmotion(text: string, emotion: EmotionType): Promise<void> {
    const style = EMOTION_VOICE_STYLES[emotion] || EMOTION_VOICE_STYLES.neutral;
    return this.speak(text, style);
  }

  async speakWithRole(text: string, roleStyle: keyof typeof ROLE_VOICE_STYLES): Promise<void> {
    const style = ROLE_VOICE_STYLES[roleStyle] || ROLE_VOICE_STYLES.warm;
    return this.speak(text, style);
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  pause(): void {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  getAvailableVoices(): { lang: string; name: string; localService: boolean }[] {
    return this.voices.map((v) => ({
      lang: v.lang,
      name: v.name,
      localService: v.localService,
    }));
  }
}

export default TTSEngine;
