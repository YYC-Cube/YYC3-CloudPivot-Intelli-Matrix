/**
 * @file musicProfiles.ts
 * @description YYC³ 音乐模块语音档案配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 */

import type { VoiceProfile } from '../core/types';

export interface MusicVoiceProfile extends VoiceProfile {
  scene: 'dj' | 'narrator' | 'companion' | 'announcer';
  description: string;
}

export const MUSIC_VOICE_PROFILES: MusicVoiceProfile[] = [
  {
    id: 'dj-voice',
    name: 'DJ模式',
    pitch: 1.0,
    rate: 1.1,
    volume: 1.0,
    lang: 'zh-CN',
    scene: 'dj',
    description: '活力四射的DJ风格，适合播放列表介绍',
    style: 'cheerful',
  },
  {
    id: 'narrator-voice',
    name: '旁白模式',
    pitch: 1.0,
    rate: 0.9,
    volume: 0.9,
    lang: 'zh-CN',
    scene: 'narrator',
    description: '沉稳的旁白风格，适合歌词朗读和故事讲述',
    style: 'calm',
  },
  {
    id: 'companion-voice',
    name: '陪伴模式',
    pitch: 1.05,
    rate: 1.0,
    volume: 0.95,
    lang: 'zh-CN',
    scene: 'companion',
    description: '温暖的陪伴风格，适合日常音乐推荐',
    style: 'warm',
  },
  {
    id: 'announcer-voice',
    name: '播报模式',
    pitch: 1.0,
    rate: 1.0,
    volume: 1.0,
    lang: 'zh-CN',
    scene: 'announcer',
    description: '专业的播报风格，适合歌曲信息播报',
    style: 'professional',
  },
];

export const MUSIC_VOICE_COMMANDS = {
  zh: [
    { cmd: '播放', aliases: ['开始', '继续'], action: 'play', description: '播放音乐' },
    { cmd: '暂停', aliases: ['停止', '停'], action: 'pause', description: '暂停音乐' },
    { cmd: '下一首', aliases: ['下一曲', '跳过'], action: 'next', description: '下一首歌' },
    { cmd: '上一首', aliases: ['上一曲', '返回'], action: 'previous', description: '上一首歌' },
    { cmd: '喜欢', aliases: ['收藏', '点赞'], action: 'like', description: '点赞歌曲' },
    { cmd: '不喜欢', aliases: ['取消收藏'], action: 'dislike', description: '取消点赞' },
    { cmd: '随机播放', aliases: ['随机', 'shuffle'], action: 'shuffle', description: '切换随机' },
    { cmd: '循环播放', aliases: ['循环', 'repeat'], action: 'repeat', description: '切换循环' },
    { cmd: '音量大', aliases: ['大声点', '大点声'], action: 'volumeUp', description: '增大音量' },
    { cmd: '音量小', aliases: ['小声点', '小点声'], action: 'volumeDown', description: '减小音量' },
    { cmd: '静音', aliases: ['消音'], action: 'mute', description: '静音切换' },
    { cmd: '播放列表', aliases: ['列表', '歌单'], action: 'playlist', description: '打开列表' },
    { cmd: '创作', aliases: ['写歌', 'AI歌词'], action: 'create', description: 'AI歌词创作' },
    { cmd: '排行', aliases: ['排行榜', '榜单'], action: 'leaderboard', description: '排行榜' },
    { cmd: '评论', aliases: ['看评论'], action: 'comments', description: '打开评论' },
    { cmd: '社区', aliases: ['动态'], action: 'community', description: '社区动态' },
    { cmd: '分析', aliases: ['数据分析', '统计'], action: 'analytics', description: '数据分析' },
  ],
  en: [
    { cmd: 'play', aliases: ['start', 'resume'], action: 'play', description: 'Play music' },
    { cmd: 'pause', aliases: ['stop'], action: 'pause', description: 'Pause music' },
    { cmd: 'next', aliases: ['skip', 'next track'], action: 'next', description: 'Next track' },
    { cmd: 'previous', aliases: ['back', 'previous track'], action: 'previous', description: 'Previous track' },
    { cmd: 'like', aliases: ['favorite', 'love'], action: 'like', description: 'Like song' },
    { cmd: 'dislike', aliases: ['unlike'], action: 'dislike', description: 'Dislike song' },
    { cmd: 'shuffle', aliases: ['random'], action: 'shuffle', description: 'Toggle shuffle' },
    { cmd: 'repeat', aliases: ['loop'], action: 'repeat', description: 'Toggle repeat' },
    { cmd: 'volume up', aliases: ['louder'], action: 'volumeUp', description: 'Increase volume' },
    { cmd: 'volume down', aliases: ['quieter'], action: 'volumeDown', description: 'Decrease volume' },
    { cmd: 'mute', aliases: ['silence'], action: 'mute', description: 'Toggle mute' },
    { cmd: 'playlist', aliases: ['queue', 'list'], action: 'playlist', description: 'Open playlist' },
    { cmd: 'create', aliases: ['write lyrics', 'AI lyrics'], action: 'create', description: 'AI Lyrics' },
    { cmd: 'leaderboard', aliases: ['ranking', 'top'], action: 'leaderboard', description: 'Rankings' },
    { cmd: 'comments', aliases: ['comment'], action: 'comments', description: 'Comments' },
    { cmd: 'community', aliases: ['feed'], action: 'community', description: 'Community' },
    { cmd: 'analytics', aliases: ['stats', 'analysis'], action: 'analytics', description: 'Analytics' },
  ],
};

export function getMusicVoiceProfile(scene: string): MusicVoiceProfile | undefined {
  return MUSIC_VOICE_PROFILES.find((p) => p.scene === scene);
}

export function getMusicVoiceProfiles(): MusicVoiceProfile[] {
  return MUSIC_VOICE_PROFILES;
}

export const DEFAULT_MUSIC_PROFILE = MUSIC_VOICE_PROFILES[2];
