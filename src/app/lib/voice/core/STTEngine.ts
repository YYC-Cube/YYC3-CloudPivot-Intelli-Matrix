/**
 * @file STTEngine.ts
 * @description YYC³ 语音识别引擎 (Speech-to-Text)
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 * @status stable
 */

import type { VoiceConfig, SpeechRecognitionResult } from './types';

const DEFAULT_CONFIG: VoiceConfig = {
  language: 'zh-CN',
  continuous: false,
  interimResults: true,
  maxAlternatives: 1,
};

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    isFinal: boolean;
    [index: number]: {
      transcript: string;
      confidence: number;
    };
  }[];
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface ExtendedWindow extends Window {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export class STTEngine {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private config: VoiceConfig;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: Error) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;

  constructor(config?: Partial<VoiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize(): void {
    const extendedWindow = window as ExtendedWindow;
    const SpeechRecognitionAPI =
      extendedWindow.SpeechRecognition || extendedWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('[STTEngine] Web Speech API not supported in this environment');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
  }

  isSupported(): boolean {
    return this.recognition !== null;
  }

  isRestrictedEnvironment(): boolean {
    if (typeof window === 'undefined') {return true;}
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  }

  startListening(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: Error) => void
  ): void {
    if (!this.recognition || this.isListening) {return;}

    if (this.isRestrictedEnvironment()) {
      console.warn('[STTEngine] Speech recognition not available in restricted environment');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      const recognitionResult: SpeechRecognitionResult = {
        transcript: result[0].transcript.trim(),
        confidence: result[0].confidence,
        isFinal: result.isFinal,
      };
      this.onResultCallback?.(recognitionResult);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const error = new Error(`Speech recognition error: ${event.error}`);
      this.onErrorCallback?.(error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.onEndCallback?.();
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback?.();
    };

    try {
      this.recognition.start();
    } catch (error) {
      console.error('[STTEngine] Failed to start recognition:', error);
      this.isListening = false;
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  abort(): void {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  onStart(callback: () => void): void {
    this.onStartCallback = callback;
  }

  updateConfig(config: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }
}

export default STTEngine;
