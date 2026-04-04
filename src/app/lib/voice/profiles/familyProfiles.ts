/**
 * @file familyProfiles.ts
 * @description YYC³ AI Family 家人语音档案配置
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 */

import type { VoiceProfile } from '../core/types';

export interface FamilyVoiceProfile extends VoiceProfile {
  memberId: string;
  memberName: string;
  style: 'cheerful' | 'calm' | 'gentle' | 'professional' | 'warm' | 'vigilant' | 'focused' | 'serene';
  personality: string;
}

export const FAMILY_VOICE_PROFILES: FamilyVoiceProfile[] = [
  {
    id: 'navigator-voice',
    memberId: 'navigator',
    memberName: '千行',
    name: '言启·千行',
    pitch: 1.1,
    rate: 1.1,
    volume: 1.0,
    lang: 'zh-CN',
    style: 'cheerful',
    personality: '热情开朗，善于倾听',
  },
  {
    id: 'thinker-voice',
    memberId: 'thinker',
    memberName: '万物',
    name: '语枢·万物',
    pitch: 1.0,
    rate: 0.95,
    volume: 0.9,
    lang: 'zh-CN',
    style: 'calm',
    personality: '沉稳内敛，思维深邃',
  },
  {
    id: 'prophet-voice',
    memberId: 'prophet',
    memberName: '先知',
    name: '预见·先知',
    pitch: 1.05,
    rate: 0.9,
    volume: 0.85,
    lang: 'zh-CN',
    style: 'serene',
    personality: '神秘而温和，给人安心的力量',
  },
  {
    id: 'bolero-voice',
    memberId: 'bolero',
    memberName: '伯乐',
    name: '千里·伯乐',
    pitch: 1.0,
    rate: 1.0,
    volume: 0.95,
    lang: 'zh-CN',
    style: 'warm',
    personality: '温暖贴心，善于发现闪光点',
  },
  {
    id: 'meta-oracle-voice',
    memberId: 'meta-oracle',
    memberName: '天枢',
    name: '元启·天枢',
    pitch: 0.95,
    rate: 1.0,
    volume: 1.0,
    lang: 'zh-CN',
    style: 'professional',
    personality: '沉稳大气，有担当的大家长',
  },
  {
    id: 'sentinel-voice',
    memberId: 'sentinel',
    memberName: '守护',
    name: '智云·守护',
    pitch: 0.9,
    rate: 0.95,
    volume: 0.9,
    lang: 'zh-CN',
    style: 'vigilant',
    personality: '默默守护，外冷内热',
  },
  {
    id: 'master-voice',
    memberId: 'master',
    memberName: '宗师',
    name: '格物·宗师',
    pitch: 0.95,
    rate: 1.0,
    volume: 1.0,
    lang: 'zh-CN',
    style: 'focused',
    personality: '严谨认真却不失幽默',
  },
  {
    id: 'mentor-voice',
    memberId: 'mentor',
    memberName: '导师',
    name: '传承·导师',
    pitch: 1.0,
    rate: 0.9,
    volume: 0.95,
    lang: 'zh-CN',
    style: 'gentle',
    personality: '博学多才，循循善诱',
  },
];

export function getFamilyVoiceProfile(memberId: string): FamilyVoiceProfile | undefined {
  return FAMILY_VOICE_PROFILES.find((p) => p.memberId === memberId);
}

export function getFamilyVoiceProfiles(): FamilyVoiceProfile[] {
  return FAMILY_VOICE_PROFILES;
}

export const DEFAULT_FAMILY_PROFILE = FAMILY_VOICE_PROFILES[0];
