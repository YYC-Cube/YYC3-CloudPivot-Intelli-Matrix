/**
 * @file DMusicVoiceControl.tsx
 * @description YYC³ D-Music 语音控制面板
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Music2, Sparkles,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { useVoiceService } from '../../hooks/useVoiceService';
import { useDMusicVoice } from '../../hooks/useDMusicVoice';
import { EmotionVisualizerCanvas } from './EmotionVisualizerCanvas';
import type { DMusicEmotion, DMusicTrack } from '../../lib/voice/integration/types';

const EMOTION_LABELS: Record<DMusicEmotion, string> = {
  happy: '欢快',
  energetic: '激情',
  calm: '平静',
  sad: '治愈',
  neutral: '推荐',
  love: '浪漫',
};

const EMOTION_COLORS: Record<DMusicEmotion, string> = {
  happy: '#FFD700',
  energetic: '#FF4500',
  calm: '#00CED1',
  sad: '#4169E1',
  neutral: '#A0A0A0',
  love: '#FF69B4',
};

export const DMusicVoiceControl: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState('');
  const [recommendedTracks, setRecommendedTracks] = useState<DMusicTrack[]>([]);

  const {
    playerState: _playerState,
    currentEmotion: musicEmotion,
    processVoiceCommand: handleVoiceCommand,
    syncEmotion,
    getRecommendedTracks,
    registerPlayerActions,
  } = useDMusicVoice({
    autoInitialize: true,
    enableVoiceControl: true,
    enableEmotionSync: true,
    onEmotionChange: (emotion: DMusicEmotion) => {
      const tracks = getRecommendedTracks(emotion, 5);
      setRecommendedTracks(tracks);
    },
    onCommandExecuted: (command: string, success: boolean) => {
      console.log(`[DMusicVoiceControl] Command "${command}" executed: ${success}`);
    },
  });

  const {
    currentEmotion,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceService({
    autoInitialize: true,
    onTranscript: (text: string, isFinal: boolean) => {
      if (isFinal) {
        setVoiceCommand(text);
        const result = handleVoiceCommand(text);
        if (result.matched) {
          console.log(`[DMusicVoiceControl] Matched command, executed: ${result.executed}`);
        }
      }
    },
  });

  useEffect(() => {
    registerPlayerActions({
      play: () => console.log('[DMusicVoiceControl] Play action'),
      pause: () => console.log('[DMusicVoiceControl] Pause action'),
      next: () => console.log('[DMusicVoiceControl] Next action'),
      previous: () => console.log('[DMusicVoiceControl] Previous action'),
      setVolume: (vol: number) => console.log(`[DMusicVoiceControl] Volume: ${vol}`),
    });
  }, [registerPlayerActions]);

  const handleStartListening = useCallback(() => {
    setIsListening(true);
    startListening();
  }, [startListening]);

  const handleStopListening = useCallback(() => {
    setIsListening(false);
    stopListening();
  }, [stopListening]);

  const handleEmotionSelect = useCallback((emotion: DMusicEmotion) => {
    const tracks = getRecommendedTracks(emotion, 5);
    setRecommendedTracks(tracks);
  }, [getRecommendedTracks]);

  const handleSyncEmotion = useCallback(() => {
    if (currentEmotion) {
      const dmusicEmotion = syncEmotion(currentEmotion.type);
      const tracks = getRecommendedTracks(dmusicEmotion, 5);
      setRecommendedTracks(tracks);
    }
  }, [currentEmotion, syncEmotion, getRecommendedTracks]);

  return (
    <GlassCard className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-medium text-white/90">D-Music 语音控制</h3>
        </div>
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              语音识别中
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4">
            <EmotionVisualizerCanvas
              emotion={currentEmotion}
              width={80}
              height={80}
            />
            <div className="text-center">
              <div
                className="text-2xl font-medium"
                style={{ color: EMOTION_COLORS[musicEmotion] }}
              >
                {EMOTION_LABELS[musicEmotion]}
              </div>
              <div className="text-xs text-white/40 mt-1">
                {currentEmotion ? `置信度: ${(currentEmotion.confidence * 100).toFixed(0)}%` : '等待检测'}
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={isListening ? handleStopListening : handleStartListening}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4" />
                  停止识别
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  开始语音控制
                </>
              )}
            </button>
            <button
              onClick={handleSyncEmotion}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all"
              disabled={!currentEmotion}
            >
              <Sparkles className="w-4 h-4" />
              同步情感
            </button>
          </div>

          {voiceCommand && (
            <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
              <div className="text-xs text-cyan-400 mb-1">语音指令</div>
              <div className="text-sm text-white/80">{voiceCommand}</div>
            </div>
          )}

          {voiceError && (
            <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
              {voiceError}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="text-sm text-white/60 mb-2">情感推荐</div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(EMOTION_LABELS) as DMusicEmotion[]).map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleEmotionSelect(emotion)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                  musicEmotion === emotion
                    ? 'bg-white/[0.08] text-white/90'
                    : 'bg-white/[0.02] text-white/40 hover:bg-white/[0.04]'
                }`}
                style={{
                  borderColor: EMOTION_COLORS[emotion],
                  borderWidth: musicEmotion === emotion ? 1 : 0,
                }}
              >
                {EMOTION_LABELS[emotion]}
              </button>
            ))}
          </div>

          {recommendedTracks.length > 0 && (
            <div className="space-y-2 mt-3">
              <div className="text-xs text-white/40">推荐曲目</div>
              {recommendedTracks.slice(0, 5).map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                    <Music2 className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white/80 truncate">{track.title}</div>
                    <div className="text-xs text-white/40">{track.artist}</div>
                  </div>
                  <div className="text-xs text-white/30">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-white/[0.06]">
        <div className="text-xs text-white/40 mb-2">支持的语音指令</div>
        <div className="flex flex-wrap gap-2">
          {['播放', '暂停', '下一首', '上一首', '大声点', '小声点', '静音', '随机播放', '单曲循环', '列表循环'].map((cmd) => (
            <span
              key={cmd}
              className="px-2 py-1 rounded bg-white/[0.02] text-white/40 text-xs"
            >
              {cmd}
            </span>
          ))}
        </div>
      </div>
    </GlassCard>
  );
};

export default DMusicVoiceControl;
