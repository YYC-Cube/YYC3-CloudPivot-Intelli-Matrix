/**
 * @file useDMusicVoice.ts
 * @description YYC³ D-Music 语音集成 Hook
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { DMusicIntegration } from '../lib/voice/integration/DMusicIntegration';
import type {
  DMusicEmotion,
  DMusicTrack,
  DMusicPlayerState,
  DMusicPlayerActions,
  DMusicIntegrationConfig,
} from '../lib/voice/integration/types';
import type { EmotionType } from '../lib/voice/core/types';

export interface UseDMusicVoiceOptions extends Partial<DMusicIntegrationConfig> {
  autoInitialize?: boolean;
  onEmotionChange?: (emotion: DMusicEmotion) => void;
  onCommandExecuted?: (command: string, success: boolean) => void;
  onStateChange?: (state: DMusicPlayerState) => void;
}

export interface UseDMusicVoiceReturn {
  isInitialized: boolean;
  playerState: DMusicPlayerState;
  currentEmotion: DMusicEmotion;
  processVoiceCommand: (transcript: string) => { matched: boolean; executed: boolean };
  syncEmotion: (emotion: EmotionType) => DMusicEmotion;
  getRecommendedTracks: (emotion: DMusicEmotion, count?: number) => DMusicTrack[];
  createEmotionBasedPlaylist: (emotion: DMusicEmotion) => DMusicTrack[];
  registerPlayerActions: (actions: Partial<DMusicPlayerActions>) => void;
  updatePlayerState: (state: Partial<DMusicPlayerState>) => void;
  getEmotionPalette: (emotion: DMusicEmotion) => { primary: string; secondary: string; glow: string };
  reset: () => void;
}

export function useDMusicVoice(options: UseDMusicVoiceOptions = {}): UseDMusicVoiceReturn {
  const {
    autoInitialize = true,
    onEmotionChange,
    onCommandExecuted,
    onStateChange,
    ...integrationConfig
  } = options;

  const integrationRef = useRef<DMusicIntegration | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [playerState, setPlayerState] = useState<DMusicPlayerState>({
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
  });
  const [currentEmotion, setCurrentEmotion] = useState<DMusicEmotion>('neutral');

  useEffect(() => {
    if (autoInitialize && !integrationRef.current) {
      integrationRef.current = new DMusicIntegration(integrationConfig);

      integrationRef.current.setEmotionCallback((emotion: DMusicEmotion) => {
        setCurrentEmotion(emotion);
        onEmotionChange?.(emotion);
      });

      integrationRef.current.setCommandCallback((command: string, success: boolean) => {
        onCommandExecuted?.(command, success);
      });

      integrationRef.current.setStateCallback((state: DMusicPlayerState) => {
        setPlayerState(state);
        onStateChange?.(state);
      });

      setIsInitialized(true);
    }

    return () => {
      if (integrationRef.current) {
        integrationRef.current.reset();
      }
    };
  }, [autoInitialize, integrationConfig, onEmotionChange, onCommandExecuted, onStateChange]);

  const processVoiceCommand = useCallback((transcript: string) => {
    if (!integrationRef.current) {
      return { matched: false, executed: false };
    }
    const result = integrationRef.current.processVoiceCommand(transcript);
    return {
      matched: result.matched,
      executed: result.executed ?? false,
    };
  }, []);

  const syncEmotion = useCallback((emotion: EmotionType): DMusicEmotion => {
    if (!integrationRef.current) {return 'neutral';}
    return integrationRef.current.syncEmotion(emotion);
  }, []);

  const getRecommendedTracks = useCallback((emotion: DMusicEmotion, count: number = 10) => {
    if (!integrationRef.current) {return [];}
    return integrationRef.current.getRecommendedTracks(emotion, count);
  }, []);

  const createEmotionBasedPlaylist = useCallback((emotion: DMusicEmotion) => {
    if (!integrationRef.current) {return [];}
    return integrationRef.current.createEmotionBasedPlaylist(emotion);
  }, []);

  const registerPlayerActions = useCallback((actions: Partial<DMusicPlayerActions>) => {
    if (!integrationRef.current) {return;}
    integrationRef.current.registerPlayerActions(actions);
  }, []);

  const updatePlayerState = useCallback((state: Partial<DMusicPlayerState>) => {
    if (!integrationRef.current) {return;}
    integrationRef.current.updatePlayerState(state);
  }, []);

  const getEmotionPalette = useCallback((emotion: DMusicEmotion) => {
    if (!integrationRef.current) {
      return { primary: '#8B5CF6', secondary: '#7C3AED', glow: 'rgba(139,92,246,0.5)' };
    }
    return integrationRef.current.getEmotionPalette(emotion);
  }, []);

  const reset = useCallback(() => {
    if (integrationRef.current) {
      integrationRef.current.reset();
    }
    setCurrentEmotion('neutral');
    setPlayerState({
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
    });
  }, []);

  return {
    isInitialized,
    playerState,
    currentEmotion,
    processVoiceCommand,
    syncEmotion,
    getRecommendedTracks,
    createEmotionBasedPlaylist,
    registerPlayerActions,
    updatePlayerState,
    getEmotionPalette,
    reset,
  };
}

export default useDMusicVoice;
