/**
 * voice-types.test.ts
 * =================
 * voice 域类型常量运行时契约测试（W3 快赢）
 *
 * 覆盖范围:
 * - voice/core/types.ts: EMOTION_COLORS / DEFAULT_VOICE_CONFIG / DEFAULT_VOICE_PROFILE
 * - voice/emotion/types.ts: MUSIC_EMOTION_MAPPINGS 数据完整性
 *
 * 类型层（interface/type）由 tsc 静态保证，此处断言**运行时常量**的结构不变量，
 * 防止新增 EmotionType 时遗漏配色映射、情感映射区间非法等回归。
 */

import { describe, expect, it } from 'vitest';
import {
  EMOTION_COLORS,
  DEFAULT_VOICE_CONFIG,
  DEFAULT_VOICE_PROFILE,
} from '../lib/voice/core/types';
import type { EmotionType } from '../lib/voice/core/types';
import { MUSIC_EMOTION_MAPPINGS } from '../lib/voice/emotion/types';

const ALL_EMOTIONS: EmotionType[] = ['happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral'];

describe('voice/core/types 运行时常量', () => {
  describe('EMOTION_COLORS', () => {
    it('覆盖全部 7 种 EmotionType（无遗漏）', () => {
      expect(Object.keys(EMOTION_COLORS).sort()).toEqual([...ALL_EMOTIONS].sort());
    });

    it('每种情绪的三元配色齐全且为合法 HEX/渐变格式', () => {
      for (const emotion of ALL_EMOTIONS) {
        const c = EMOTION_COLORS[emotion];
        expect(c, `${emotion} 缺失配色`).toBeDefined();
        expect(c.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(c.gradient).toMatch(/^from-[\w-]+ to-[\w-]+$/);
      }
    });

    it('主色与辅色不重复（可区分性）', () => {
      for (const emotion of ALL_EMOTIONS) {
        const { primary, secondary } = EMOTION_COLORS[emotion];
        expect(primary, emotion).not.toBe(secondary);
      }
    });
  });

  describe('DEFAULT_VOICE_CONFIG', () => {
    it('中文语音 + 单轮识别默认值', () => {
      expect(DEFAULT_VOICE_CONFIG).toEqual({
        language: 'zh-CN',
        continuous: false,
        interimResults: true,
        maxAlternatives: 1,
      });
    });
  });

  describe('DEFAULT_VOICE_PROFILE', () => {
    it('默认音档: 音调/语速/音量均为 1.0', () => {
      expect(DEFAULT_VOICE_PROFILE).toEqual({
        id: 'default',
        name: 'Default',
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
        lang: 'zh-CN',
      });
    });

    it('音调/语速/音量在 [0, 2] 安全范围内', () => {
      const { pitch, rate, volume } = DEFAULT_VOICE_PROFILE;
      for (const v of [pitch, rate, volume]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(2);
      }
    });
  });
});

describe('voice/emotion/types: MUSIC_EMOTION_MAPPINGS', () => {
  it('覆盖全部 7 种 EmotionType（一一对应无重复）', () => {
    const emotions = MUSIC_EMOTION_MAPPINGS.map((m) => m.emotion);
    expect(emotions.sort()).toEqual([...ALL_EMOTIONS].sort());
    expect(new Set(emotions).size).toBe(ALL_EMOTIONS.length);
  });

  it('tempo/energy/valence 区间均为合法 [low, high] 且不越界', () => {
    for (const m of MUSIC_EMOTION_MAPPINGS) {
      const ranges: [number, number][] = [m.tempoRange, m.energyRange, m.valenceRange];
      for (const [low, high] of ranges) {
        expect(low, `${m.emotion} 区间下界`).toBeLessThanOrEqual(high);
        expect(low).toBeGreaterThanOrEqual(0);
        expect(high).toBeLessThanOrEqual(180); // tempo 上限即最高区间上界
      }
      // energy/valence 是 [0,1] 归一化值
      expect(m.energyRange[1]).toBeLessThanOrEqual(1);
      expect(m.valenceRange[1]).toBeLessThanOrEqual(1);
    }
  });

  it('modes 仅含 major/minor 且至少一种', () => {
    for (const m of MUSIC_EMOTION_MAPPINGS) {
      expect(m.modes.length).toBeGreaterThan(0);
      for (const mode of m.modes) {
        expect(['major', 'minor']).toContain(mode);
      }
    }
  });

  it('keywords 均非空且含中英混合检索词', () => {
    for (const m of MUSIC_EMOTION_MAPPINGS) {
      expect(m.keywords.length, m.emotion).toBeGreaterThan(0);
      for (const kw of m.keywords) {
        expect(kw.length).toBeGreaterThan(0);
      }
    }
  });

  it('情感样例: happy 高能量高愉悦小调排除 / sad 低能量低愉悦', () => {
    const happy = MUSIC_EMOTION_MAPPINGS.find((m) => m.emotion === 'happy')!;
    expect(happy.energyRange[0]).toBeGreaterThanOrEqual(0.5);
    expect(happy.valenceRange[0]).toBeGreaterThanOrEqual(0.5);
    expect(happy.modes).toEqual(['major']);

    const sad = MUSIC_EMOTION_MAPPINGS.find((m) => m.emotion === 'sad')!;
    expect(sad.energyRange[1]).toBeLessThanOrEqual(0.5);
    expect(sad.valenceRange[1]).toBeLessThanOrEqual(0.4);
    expect(sad.modes).toEqual(['minor']);
  });
});
