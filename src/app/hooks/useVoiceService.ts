/**
 * @file useVoiceService.ts
 * @description YYC³ 语音服务 React Hook
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VoiceService } from '../lib/voice/core/VoiceService';
import { EmotionEngine } from '../lib/voice/core/EmotionEngine';
import type { VoiceConfig, EmotionAnalysisResult } from '../lib/voice/core/types';

export interface UseVoiceServiceOptions extends Partial<VoiceConfig> {
  autoInitialize?: boolean;
  onEmotionDetected?: (result: EmotionAnalysisResult) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

export interface UseVoiceServiceReturn {
  isInitialized: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  currentEmotion: EmotionAnalysisResult | null;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string, options?: { rate?: number; pitch?: number; volume?: number }) => Promise<void>;
  stopSpeaking: () => void;
  analyzeEmotion: (text: string) => EmotionAnalysisResult;
  reset: () => void;
}

export function useVoiceService(options: UseVoiceServiceOptions = {}): UseVoiceServiceReturn {
  const {
    autoInitialize = true,
    onEmotionDetected,
    onTranscript,
    onError,
    ...voiceConfig
  } = options;

  const voiceServiceRef = useRef<VoiceService | null>(null);
  const emotionEngineRef = useRef<EmotionEngine | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionAnalysisResult | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoInitialize && !voiceServiceRef.current) {
      voiceServiceRef.current = new VoiceService(voiceConfig);
      emotionEngineRef.current = new EmotionEngine();
      setIsInitialized(true);
    }

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.destroy();
        voiceServiceRef.current = null;
      }
      emotionEngineRef.current = null;
    };
  }, [autoInitialize]);

  const startListening = useCallback(() => {
    if (!voiceServiceRef.current) {return;}

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    voiceServiceRef.current.startListening(
      (result: { transcript: string; isFinal: boolean }) => {
        setInterimTranscript(result.transcript);
        if (result.isFinal) {
          setTranscript(result.transcript);
          onTranscript?.(result.transcript, true);

          if (emotionEngineRef.current) {
            const emotionResult = emotionEngineRef.current.analyzeEmotion();
            setCurrentEmotion(emotionResult);
            onEmotionDetected?.(emotionResult);
          }
        } else {
          onTranscript?.(result.transcript, false);
        }
      },
      (err: Error) => {
        setError(err.message);
        setIsListening(false);
        onError?.(err);
      }
    );
    setIsListening(true);
  }, [onEmotionDetected, onTranscript, onError]);

  const stopListening = useCallback(() => {
    if (!voiceServiceRef.current) {return;}
    voiceServiceRef.current.stopListening();
    setIsListening(false);
  }, []);

  const speak = useCallback(async (
    text: string,
    speakOptions?: { rate?: number; pitch?: number; volume?: number }
  ) => {
    if (!voiceServiceRef.current) {return;}

    setIsSpeaking(true);
    setError(null);

    try {
      await voiceServiceRef.current.speak(text, {
        rate: speakOptions?.rate ?? 1,
        pitch: speakOptions?.pitch ?? 1,
        volume: speakOptions?.volume ?? 1,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Speech synthesis failed';
      setError(errorMessage);
      onError?.(new Error(errorMessage));
    } finally {
      setIsSpeaking(false);
    }
  }, [onError]);

  const stopSpeaking = useCallback(() => {
    if (!voiceServiceRef.current) {return;}
    voiceServiceRef.current.stopSpeaking();
    setIsSpeaking(false);
  }, []);

  const analyzeEmotion = useCallback((): EmotionAnalysisResult => {
    if (!emotionEngineRef.current) {
      return { type: 'neutral', confidence: 0.5, audioFeatures: { pitch: 0, energy: 0, variation: 0 } };
    }
    return emotionEngineRef.current.analyzeEmotion();
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setCurrentEmotion(null);
    setError(null);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  return {
    isInitialized,
    isListening,
    isSpeaking,
    currentEmotion,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    analyzeEmotion,
    reset,
  };
}

export default useVoiceService;
