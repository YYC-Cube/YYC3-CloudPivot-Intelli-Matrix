/**
 * @file FamilyVoicePanel.tsx
 * @description YYC³ AI Family 语音面板 - 集成新版语音服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import React, { useState, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, Play, Pause,
  Sliders, ChevronUp,
} from 'lucide-react';
import { GlassCard } from '../GlassCard';
import { useVoiceService } from '../../hooks/useVoiceService';
import { EmotionVisualizerCanvas } from './EmotionVisualizerCanvas';
import { VoiceWaveformCanvas } from './VoiceWaveformCanvas';
import { FAMILY_MEMBERS, hexToRgb, type FamilyMember } from '../ai-family/shared';
import type { EmotionType } from '../../lib/voice/core/types';

interface VoiceProfile {
  id: string;
  name: string;
  pitch: number;
  rate: number;
  volume: number;
  lang: string;
}

const DEFAULT_PROFILES: VoiceProfile[] = FAMILY_MEMBERS.map((member, index) => ({
  id: member.id,
  name: member.shortName,
  pitch: 0.8 + (index % 4) * 0.15,
  rate: 0.9 + (index % 3) * 0.1,
  volume: 0.8,
  lang: 'zh-CN',
}));

const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: '#FFD700',
  sad: '#4169E1',
  angry: '#FF4500',
  fear: '#9932CC',
  surprise: '#00CED1',
  disgust: '#8B4513',
  neutral: '#A0A0A0',
};

export const FamilyVoicePanel: React.FC = () => {
  const [profiles, setProfiles] = useState<VoiceProfile[]>(DEFAULT_PROFILES);
  const [activeMember, setActiveMember] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const {
    isListening,
    isSpeaking,
    currentEmotion,
    interimTranscript,
    error,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  } = useVoiceService({
    autoInitialize: true,
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setTranscript(text);
      }
    },
  });

  const handlePlay = useCallback(async (member: FamilyMember, profile: VoiceProfile) => {
    if (isPlaying === member.id) {
      stopSpeaking();
      setIsPlaying(null);
      return;
    }

    setIsPlaying(member.id);
    const text = member.greeting || member.quote;
    await speak(text, {
      pitch: profile.pitch,
      rate: profile.rate,
      volume: profile.volume,
    });
    setIsPlaying(null);
  }, [isPlaying, speak, stopSpeaking]);

  const handleStartConversation = useCallback((memberId: string) => {
    setActiveMember(memberId);
    if (!isListening) {
      startListening();
    }
  }, [isListening, startListening]);

  const handleStopConversation = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    setActiveMember(null);
  }, [isListening, stopListening]);

  const updateProfile = useCallback((id: string, updates: Partial<VoiceProfile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-white/90">AI Family 语音系统</h2>
        <div className="flex items-center gap-2">
          {isListening && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 text-red-400 text-xs">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              录音中
            </span>
          )}
          {isSpeaking && (
            <span className="flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 text-xs">
              <Volume2 className="w-3 h-3" />
              播报中
            </span>
          )}
        </div>
      </div>

      {currentEmotion && (
        <div className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <EmotionVisualizerCanvas
            emotion={currentEmotion}
            width={60}
            height={60}
          />
          <div>
            <div className="text-sm text-white/80">
              当前情感: <span style={{ color: EMOTION_COLORS[currentEmotion.type] }}>
                {currentEmotion.type}
              </span>
            </div>
            <div className="text-xs text-white/40">
              置信度: {(currentEmotion.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {transcript && (
        <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
          <div className="text-xs text-cyan-400 mb-1">识别结果</div>
          <div className="text-sm text-white/80">{transcript}</div>
          {interimTranscript && (
            <div className="text-xs text-white/40 mt-1">{interimTranscript}</div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {FAMILY_MEMBERS.map((member) => {
          const profile = profiles.find(p => p.id === member.id) || DEFAULT_PROFILES[0];
          const rgb = hexToRgb(member.color);
          const isActive = activeMember === member.id;
          const isCurrentPlaying = isPlaying === member.id;
          const isExpanded = showSettings === member.id;

          return (
            <GlassCard
              key={member.id}
              className="p-0 overflow-hidden"
              glowColor={isActive || isCurrentPlaying ? `rgba(${rgb},0.2)` : undefined}
            >
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: `rgba(${rgb},0.15)`,
                      border: `1.5px solid rgba(${rgb},0.4)`,
                    }}
                  >
                    <member.icon className="w-4 h-4" style={{ color: member.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm truncate">{member.shortName}</div>
                    <div className="text-white/30 text-xs">
                      P:{profile.pitch.toFixed(1)} R:{profile.rate.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartConversation(member.id)}
                    className={`flex-1 p-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                    }`}
                    title={isActive ? '停止对话' : '语音对话'}
                  >
                    {isActive ? <MicOff className="w-4 h-4 mx-auto" /> : <Mic className="w-4 h-4 mx-auto" />}
                  </button>
                  <button
                    onClick={() => handlePlay(member, profile)}
                    className={`flex-1 p-2 rounded-lg transition-all ${
                      isCurrentPlaying
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                    }`}
                    title={isCurrentPlaying ? '停止' : '播放'}
                  >
                    {isCurrentPlaying ? <Pause className="w-4 h-4 mx-auto" /> : <Play className="w-4 h-4 mx-auto" />}
                  </button>
                  <button
                    onClick={() => setShowSettings(isExpanded ? null : member.id)}
                    className={`p-2 rounded-lg transition-all ${
                      isExpanded
                        ? 'bg-white/[0.08] text-white/60'
                        : 'text-white/20 hover:text-white/40'
                    }`}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">音高</span>
                        <span className="text-cyan-400">{profile.pitch.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={profile.pitch}
                        onChange={(e) => updateProfile(member.id, { pitch: parseFloat(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none bg-white/10 accent-cyan-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">语速</span>
                        <span className="text-cyan-400">{profile.rate.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={profile.rate}
                        onChange={(e) => updateProfile(member.id, { rate: parseFloat(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none bg-white/10 accent-cyan-400"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/40">音量</span>
                        <span className="text-cyan-400">{(profile.volume * 100).toFixed(0)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={profile.volume}
                        onChange={(e) => updateProfile(member.id, { volume: parseFloat(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none bg-white/10 accent-cyan-400"
                      />
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {activeMember && (
        <div className="flex justify-center">
          <VoiceWaveformCanvas
            isListening={isListening}
            width={300}
            height={60}
            onStartListening={startListening}
            onStopListening={handleStopConversation}
          />
        </div>
      )}
    </div>
  );
};

export default FamilyVoicePanel;
