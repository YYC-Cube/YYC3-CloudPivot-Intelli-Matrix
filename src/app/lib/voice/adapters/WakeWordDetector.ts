/**
 * @file WakeWordDetector.ts
 * @description YYC³ 唤醒词检测器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { WakeWordResult } from './types';

export interface WakeWordConfig {
  words: string[];
  sensitivity: number;
  cooldown: number;
  onDetected?: (result: WakeWordResult) => void;
}

const DEFAULT_WAKE_WORDS = {
  zh: ['小语', '小雨', '你好小语', '嘿小语'],
  en: ['hey xiaoyu', 'hello xiaoyu', 'xiaoyu'],
};

export class WakeWordDetector {
  private wakeWords: string[];
  private sensitivity: number;
  private cooldown: number;
  private lastDetectionTime: number = 0;
  private onDetectedCallback?: (result: WakeWordResult) => void;
  private enabled: boolean = false;

  constructor(config?: Partial<WakeWordConfig>) {
    this.wakeWords = config?.words || [...DEFAULT_WAKE_WORDS.zh, ...DEFAULT_WAKE_WORDS.en];
    this.sensitivity = config?.sensitivity ?? 0.8;
    this.cooldown = config?.cooldown ?? 2000;
    this.onDetectedCallback = config?.onDetected;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setWakeWords(words: string[]): void {
    this.wakeWords = words;
  }

  getWakeWords(): string[] {
    return [...this.wakeWords];
  }

  detect(transcript: string): WakeWordResult {
    const now = Date.now();

    if (!this.enabled) {
      return { detected: false, confidence: 0, timestamp: now };
    }

    if (now - this.lastDetectionTime < this.cooldown) {
      return { detected: false, confidence: 0, timestamp: now };
    }

    const lowerTranscript = transcript.toLowerCase();

    for (const word of this.wakeWords) {
      const lowerWord = word.toLowerCase();
      if (lowerTranscript.includes(lowerWord)) {
        const confidence = this.calculateConfidence(lowerTranscript, lowerWord);
        const result: WakeWordResult = {
          detected: true,
          word,
          confidence,
          timestamp: now,
        };
        this.lastDetectionTime = now;
        this.onDetectedCallback?.(result);
        return result;
      }
    }

    return { detected: false, confidence: 0, timestamp: now };
  }

  private calculateConfidence(transcript: string, word: string): number {
    let confidence = 0.85;

    if (transcript.trim() === word) {
      confidence = 1.0;
    } else if (transcript.startsWith(word) || transcript.endsWith(word)) {
      confidence = 0.95;
    }

    return Math.min(confidence, this.sensitivity);
  }

  playWakeSound(): void {
    if (typeof window === 'undefined') {return;}

    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch {
      // Ignore audio errors
    }
  }

  onDetected(callback: (result: WakeWordResult) => void): void {
    this.onDetectedCallback = callback;
  }
}

export default WakeWordDetector;
