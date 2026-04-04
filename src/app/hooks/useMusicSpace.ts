/**
 * @file 音乐空间Hook
 * @description 整合语音控制、情感推荐、播放状态管理的综合Hook
 * @author YYC³ Team
 * @version 2.0.0 - 集成真实音频播放
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { 
  MusicSong, 
  MusicPlayerState, 
  MusicEmotionProfile,
  MusicRecommendation,
  MusicActivity,
  MusicMood,
} from '../lib/music/types';
import { emotionMusicService } from '../lib/music/EmotionMusicService';
import { audioPlayerService, type AudioAnalyzerData } from '../lib/music/AudioPlayerService';
import { useVoiceService } from './useVoiceService';

interface UseMusicSpaceOptions {
  autoPlay?: boolean;
  defaultActivity?: MusicActivity;
  onSongChange?: (song: MusicSong) => void;
  onEmotionDetected?: (profile: MusicEmotionProfile) => void;
}

interface UseMusicSpaceReturn {
  playerState: MusicPlayerState;
  recommendation: MusicRecommendation | null;
  isListening: boolean;
  analyzerData: AudioAnalyzerData | null;
  startVoiceControl: () => void;
  stopVoiceControl: () => void;
  playSong: (song: MusicSong, index?: number) => Promise<void>;
  pauseSong: () => void;
  resumeSong: () => Promise<void>;
  nextSong: () => Promise<void>;
  previousSong: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleMute: () => boolean;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  seekTo: (seconds: number) => void;
  seekToPercent: (percent: number) => void;
  searchSongs: (query: string) => MusicSong[];
  recommendByMood: (mood: MusicMood) => MusicSong[];
  recommendByActivity: (activity: MusicActivity) => MusicSong[];
  updateEmotionProfile: (profile: Partial<MusicEmotionProfile>) => void;
  setEqualizerPreset: (preset: string) => void;
  loadPlaylist: (songs: MusicSong[], startIndex?: number) => void;
}

const DEFAULT_EMOTION_PROFILE: MusicEmotionProfile = {
  happy: 0.2,
  sad: 0.1,
  energetic: 0.2,
  calm: 0.3,
  romantic: 0.1,
  melancholy: 0.05,
  upbeat: 0.05,
  peaceful: 0.1,
};

export function useMusicSpace(options: UseMusicSpaceOptions = {}): UseMusicSpaceReturn {
  const {
    autoPlay: _autoPlay = false,
    defaultActivity,
    onSongChange,
    onEmotionDetected,
  } = options;

  const [playerState, setPlayerState] = useState<MusicPlayerState>({
    currentSong: null,
    isPlaying: false,
    volume: 0.7,
    progress: 0,
    duration: 0,
    repeat: 'off',
    shuffle: false,
    queue: [],
    queueIndex: 0,
  });

  const [recommendation, setRecommendation] = useState<MusicRecommendation | null>(null);
  const [emotionProfile, setEmotionProfile] = useState<MusicEmotionProfile>(DEFAULT_EMOTION_PROFILE);
  const [isListening, setIsListening] = useState(false);
  const [analyzerData, setAnalyzerData] = useState<AudioAnalyzerData | null>(null);

  const isInitializedRef = useRef(false);

  const {
    isInitialized: _voiceInitialized,
    isListening: _voiceListening,
    startListening,
    stopListening,
    currentEmotion,
    transcript: _transcript,
  } = useVoiceService({
    autoInitialize: false,
    onEmotionDetected: (emotion) => {
      if (emotion) {
        updateEmotionProfileFromEmotion(emotion.type, emotion.confidence);
      }
    },
    onTranscript: (text) => {
      processVoiceCommand(text);
    },
  });

  useEffect(() => {
    if (isInitializedRef.current) {return;}
    isInitializedRef.current = true;

    audioPlayerService.on('onPlay', () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    });

    audioPlayerService.on('onPause', () => {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    });

    audioPlayerService.on('onTimeUpdate', (currentTime, duration) => {
      setPlayerState((prev) => ({
        ...prev,
        progress: currentTime,
        duration: duration,
      }));
    });

    audioPlayerService.on('onEnded', async () => {
      if (playerState.repeat === 'one') {
        await audioPlayerService.play();
      } else {
        await nextSong();
      }
    });

    audioPlayerService.on('onLoaded', (song) => {
      setPlayerState((prev) => ({
        ...prev,
        currentSong: song,
      }));
      onSongChange?.(song);
    });

    audioPlayerService.on('onError', (error) => {
      console.error('Audio playback error:', error);
    });

    audioPlayerService.startVisualization((data) => {
      setAnalyzerData(data);
    });

    return () => {
      audioPlayerService.stopVisualization();
    };
  }, [onSongChange, playerState.repeat]);

  const updateEmotionProfileFromEmotion = useCallback(
    (emotion: string, confidence: number) => {
      const emotionMap: Record<string, keyof MusicEmotionProfile> = {
        happy: 'happy',
        sad: 'sad',
        angry: 'energetic',
        fearful: 'calm',
        surprised: 'upbeat',
        neutral: 'calm',
      };

      const mappedEmotion = emotionMap[emotion] || 'calm';

      setEmotionProfile((prev) => {
        const newProfile = { ...prev };

        for (const key of Object.keys(newProfile) as (keyof MusicEmotionProfile)[]) {
          if (key === mappedEmotion) {
            newProfile[key] = Math.min(1, prev[key] + confidence * 0.3);
          } else {
            newProfile[key] = prev[key] * (1 - confidence * 0.3);
          }
        }

        const sum = Object.values(newProfile).reduce((a, b) => a + b, 0);
        for (const key of Object.keys(newProfile) as (keyof MusicEmotionProfile)[]) {
          newProfile[key] /= sum;
        }

        return newProfile;
      });
    },
    []
  );

  const processVoiceCommand = useCallback(
    (text: string) => {
      const lowerText = text.toLowerCase();

      const commandPatterns: { pattern: RegExp; action: () => void }[] = [
        {
          pattern: /播放|开始|继续/,
          action: () => {
            audioPlayerService.play();
          },
        },
        {
          pattern: /暂停|停止/,
          action: () => audioPlayerService.pause(),
        },
        {
          pattern: /下一首|下一个|跳过/,
          action: () => nextSong(),
        },
        {
          pattern: /上一首|上一个|返回/,
          action: () => previousSong(),
        },
        {
          pattern: /大声|音量大/,
          action: () => setVolume(Math.min(1, playerState.volume + 0.2)),
        },
        {
          pattern: /小声|音量小/,
          action: () => setVolume(Math.max(0, playerState.volume - 0.2)),
        },
      ];

      for (const { pattern, action } of commandPatterns) {
        if (pattern.test(lowerText)) {
          action();
          return;
        }
      }

      const searchMatch = lowerText.match(/播放(.+)的歌/);
      if (searchMatch) {
        const artist = searchMatch[1];
        const songs = emotionMusicService.searchSongs(artist);
        if (songs.length > 0) {
          playSong(songs[0]);
        }
      }

      const moodMatch = lowerText.match(/我想听(.+)的音乐|给我推荐(.+)的歌/);
      if (moodMatch) {
        const moodText = moodMatch[1] || moodMatch[2];
        const moodMap: Record<string, MusicMood> = {
          开心: 'happy',
          悲伤: 'sad',
          劲爆: 'energetic',
          安静: 'calm',
          浪漫: 'romantic',
          忧郁: 'melancholy',
          欢快: 'upbeat',
          平静: 'peaceful',
        };
        const mood = moodMap[moodText];
        if (mood) {
          const songs = emotionMusicService.recommendByMood(mood);
          if (songs.length > 0) {
            playSong(songs[0]);
          }
        }
      }
    },
    [playerState.volume]
  );

  const generateRecommendation = useCallback(() => {
    const newRecommendation = emotionMusicService.recommendByEmotion(emotionProfile, {
      activity: defaultActivity,
      excludeRecent: true,
      limit: 10,
    });

    setRecommendation(newRecommendation);

    if (playerState.queue.length === 0) {
      setPlayerState((prev) => ({
        ...prev,
        queue: newRecommendation.songs,
      }));
      audioPlayerService.setQueue(newRecommendation.songs);
    }

    onEmotionDetected?.(emotionProfile);
  }, [emotionProfile, defaultActivity, playerState.queue.length, onEmotionDetected]);

  useEffect(() => {
    generateRecommendation();
  }, []);

  useEffect(() => {
    if (currentEmotion) {
      updateEmotionProfileFromEmotion(currentEmotion.type, currentEmotion.confidence);
    }
  }, [currentEmotion, updateEmotionProfileFromEmotion]);

  const startVoiceControl = useCallback(() => {
    setIsListening(true);
    startListening();
  }, [startListening]);

  const stopVoiceControl = useCallback(() => {
    setIsListening(false);
    stopListening();
  }, [stopListening]);

  const playSong = useCallback(
    async (song: MusicSong, index?: number) => {
      await audioPlayerService.playSong(song, index);
      emotionMusicService.markAsPlayed(song.id);
      
      setPlayerState((prev) => ({
        ...prev,
        currentSong: song,
        isPlaying: true,
        queueIndex: index ?? prev.queueIndex,
      }));
    },
    []
  );

  const pauseSong = useCallback(() => {
    audioPlayerService.pause();
  }, []);

  const resumeSong = useCallback(async () => {
    await audioPlayerService.play();
  }, []);

  const nextSong = useCallback(async () => {
    const next = await audioPlayerService.next();
    if (next) {
      setPlayerState((prev) => ({
        ...prev,
        currentSong: next,
        queueIndex: audioPlayerService.getCurrentState().queueIndex || 0,
      }));
      emotionMusicService.markAsPlayed(next.id);
      onSongChange?.(next);
    }
  }, [onSongChange]);

  const previousSong = useCallback(async () => {
    const prevSong = await audioPlayerService.previous();
    if (prevSong) {
      setPlayerState((state) => ({
        ...state,
        currentSong: prevSong,
        queueIndex: audioPlayerService.getCurrentState().queueIndex || 0,
      }));
      onSongChange?.(prevSong);
    }
  }, [onSongChange]);

  const setVolume = useCallback((volume: number) => {
    audioPlayerService.setVolume(volume);
    setPlayerState((prev) => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  }, []);

  const toggleMute = useCallback(() => {
    const muted = audioPlayerService.toggleMute();
    return muted;
  }, []);

  const toggleShuffle = useCallback(() => {
    const shuffle = audioPlayerService.toggleShuffle();
    setPlayerState((prev) => ({
      ...prev,
      shuffle,
    }));
  }, []);

  const toggleRepeat = useCallback(() => {
    const repeat = audioPlayerService.toggleRepeat();
    setPlayerState((prev) => ({
      ...prev,
      repeat,
    }));
  }, []);

  const seekTo = useCallback((seconds: number) => {
    audioPlayerService.seekTo(seconds);
  }, []);

  const seekToPercent = useCallback((percent: number) => {
    audioPlayerService.seekToPercent(percent);
  }, []);

  const searchSongs = useCallback((query: string) => {
    return emotionMusicService.searchSongs(query);
  }, []);

  const recommendByMood = useCallback((mood: MusicMood) => {
    return emotionMusicService.recommendByMood(mood);
  }, []);

  const recommendByActivity = useCallback((activity: MusicActivity) => {
    return emotionMusicService.recommendByActivity(activity);
  }, []);

  const updateEmotionProfile = useCallback(
    (profile: Partial<MusicEmotionProfile>) => {
      setEmotionProfile((prev) => {
        const newProfile = { ...prev, ...profile };
        const sum = Object.values(newProfile).reduce((a, b) => a + b, 0);
        for (const key of Object.keys(newProfile) as (keyof MusicEmotionProfile)[]) {
          newProfile[key] /= sum;
        }
        return newProfile;
      });
    },
    []
  );

  const setEqualizerPreset = useCallback((preset: string) => {
    audioPlayerService.setEqualizerPreset(preset);
  }, []);

  const loadPlaylist = useCallback((songs: MusicSong[], startIndex: number = 0) => {
    audioPlayerService.setQueue(songs, startIndex);
    setPlayerState((prev) => ({
      ...prev,
      queue: songs,
      queueIndex: startIndex,
    }));
  }, []);

  return {
    playerState,
    recommendation,
    isListening,
    analyzerData,
    startVoiceControl,
    stopVoiceControl,
    playSong,
    pauseSong,
    resumeSong,
    nextSong,
    previousSong,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekTo,
    seekToPercent,
    searchSongs,
    recommendByMood,
    recommendByActivity,
    updateEmotionProfile,
    setEqualizerPreset,
    loadPlaylist,
  };
}

export default useMusicSpace;
