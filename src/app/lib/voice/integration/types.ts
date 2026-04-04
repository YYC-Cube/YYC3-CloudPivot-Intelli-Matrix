/**
 * @file types.ts
 * @description YYC³ 音乐组件集成类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { EmotionType } from '../core/types';

export type DMusicEmotion = 'happy' | 'energetic' | 'calm' | 'sad' | 'neutral' | 'love';

export interface DMusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url?: string;
  coverUrl?: string;
  emotion?: DMusicEmotion;
  tags?: string[];
}

export interface DMusicPlayerState {
  currentTrack: DMusicTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  playlist: DMusicTrack[];
  playlistIndex: number;
  audioEnergy: number;
}

export interface DMusicVoiceCommand {
  command: string;
  action: keyof DMusicPlayerActions;
  params?: Record<string, unknown>;
  aliases: string[];
}

export interface DMusicPlayerActions {
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  like: () => void;
  openPlaylist: () => void;
  openComments: () => void;
  openCommunity: () => void;
  openAnalytics: () => void;
  openLyricsCreator: () => void;
  openLeaderboard: () => void;
}

export interface DMusicIntegrationConfig {
  enableVoiceControl: boolean;
  enableEmotionSync: boolean;
  enableLyricsCreation: boolean;
  enableEmotionVisualization: boolean;
  wakeWordEnabled: boolean;
  language: 'zh' | 'en';
}

export const EMOTION_TO_DMUSIC: Record<EmotionType, DMusicEmotion> = {
  happy: 'happy',
  sad: 'sad',
  angry: 'energetic',
  fear: 'calm',
  surprise: 'energetic',
  disgust: 'neutral',
  neutral: 'neutral',
};

export const DMUSIC_VOICE_COMMANDS_ZH: DMusicVoiceCommand[] = [
  { command: '播放', action: 'play', aliases: ['开始', '继续', '放音乐'] },
  { command: '暂停', action: 'pause', aliases: ['停止', '停'] },
  { command: '下一首', action: 'next', aliases: ['下一曲', '跳过', '下一个'] },
  { command: '上一首', action: 'previous', aliases: ['上一曲', '前一首', '上一个'] },
  { command: '随机播放', action: 'toggleShuffle', aliases: ['随机', '乱序'] },
  { command: '循环', action: 'toggleRepeat', aliases: ['重复', '单曲循环'] },
  { command: '音量大', action: 'setVolume', params: { volume: 0.9 }, aliases: ['大声点', '大点声'] },
  { command: '音量小', action: 'setVolume', params: { volume: 0.3 }, aliases: ['小声点', '小点声'] },
  { command: '静音', action: 'toggleMute', aliases: ['取消静音', '声音开关'] },
  { command: '喜欢', action: 'like', aliases: ['点赞', '收藏', '爱心'] },
  { command: '播放列表', action: 'openPlaylist', aliases: ['列表', '歌单'] },
  { command: '评论', action: 'openComments', aliases: ['看评论', '评论区'] },
  { command: '社区', action: 'openCommunity', aliases: ['动态', '社区动态'] },
  { command: '分析', action: 'openAnalytics', aliases: ['数据分析', '统计'] },
  { command: '创作', action: 'openLyricsCreator', aliases: ['AI歌词', '写歌', '歌词创作'] },
  { command: '排行', action: 'openLeaderboard', aliases: ['排行榜', '榜单'] },
];

export const DMUSIC_VOICE_COMMANDS_EN: DMusicVoiceCommand[] = [
  { command: 'play', action: 'play', aliases: ['start', 'resume', 'music'] },
  { command: 'pause', action: 'pause', aliases: ['stop', 'halt'] },
  { command: 'next', action: 'next', aliases: ['skip', 'next track'] },
  { command: 'previous', action: 'previous', aliases: ['prev', 'last track'] },
  { command: 'shuffle', action: 'toggleShuffle', aliases: ['random', 'mix'] },
  { command: 'repeat', action: 'toggleRepeat', aliases: ['loop', 'cycle'] },
  { command: 'volume up', action: 'setVolume', params: { volume: 0.9 }, aliases: ['louder', 'increase volume'] },
  { command: 'volume down', action: 'setVolume', params: { volume: 0.3 }, aliases: ['quieter', 'decrease volume'] },
  { command: 'mute', action: 'toggleMute', aliases: ['unmute', 'sound toggle'] },
  { command: 'like', action: 'like', aliases: ['favorite', 'heart', 'love'] },
  { command: 'playlist', action: 'openPlaylist', aliases: ['queue', 'song list'] },
  { command: 'comments', action: 'openComments', aliases: ['show comments'] },
  { command: 'community', action: 'openCommunity', aliases: ['feed', 'social'] },
  { command: 'analytics', action: 'openAnalytics', aliases: ['stats', 'statistics'] },
  { command: 'create', action: 'openLyricsCreator', aliases: ['ai lyrics', 'write song'] },
  { command: 'leaderboard', action: 'openLeaderboard', aliases: ['rankings', 'top charts'] },
];

export const DMUSIC_EMOTION_PALETTES: Record<DMusicEmotion, { primary: string; secondary: string; glow: string }> = {
  happy:     { primary: '#FFD700', secondary: '#FFA500', glow: 'rgba(255,215,0,0.5)' },
  energetic: { primary: '#FF4500', secondary: '#FF6347', glow: 'rgba(255,69,0,0.5)' },
  calm:      { primary: '#00CED1', secondary: '#48D1CC', glow: 'rgba(0,206,209,0.5)' },
  sad:       { primary: '#6495ED', secondary: '#4169E1', glow: 'rgba(100,149,237,0.5)' },
  neutral:   { primary: '#8B5CF6', secondary: '#7C3AED', glow: 'rgba(139,92,246,0.5)' },
  love:      { primary: '#FF69B4', secondary: '#FF1493', glow: 'rgba(255,105,180,0.5)' },
};
