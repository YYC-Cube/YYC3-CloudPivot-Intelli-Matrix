/**
 * @file VoiceService.test.ts
 * @description YYC³ 统一语音服务单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VoiceService, STTEngine, TTSEngine, EmotionEngine } from '../../../lib/voice/core';

describe('VoiceService', () => {
  let voiceService: VoiceService;

  beforeEach(() => {
    voiceService = new VoiceService();
  });

  afterEach(() => {
    voiceService.destroy();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(voiceService).toBeInstanceOf(VoiceService);
      expect(voiceService.getConfig().language).toBe('zh-CN');
    });

    it('should create instance with custom config', () => {
      const customService = new VoiceService({ language: 'en-US' });
      expect(customService.getConfig().language).toBe('en-US');
      customService.destroy();
    });
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = voiceService.getConfig();
      expect(config).toHaveProperty('language');
      expect(config).toHaveProperty('continuous');
      expect(config).toHaveProperty('interimResults');
      expect(config).toHaveProperty('maxAlternatives');
    });
  });

  describe('updateConfig', () => {
    it('should update config', () => {
      voiceService.updateConfig({ language: 'en-US' });
      expect(voiceService.getConfig().language).toBe('en-US');
    });
  });
});

describe('STTEngine', () => {
  let sttEngine: STTEngine;

  beforeEach(() => {
    sttEngine = new STTEngine();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(sttEngine).toBeInstanceOf(STTEngine);
    });
  });

  describe('isSupported', () => {
    it('should return boolean', () => {
      const result = sttEngine.isSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getIsListening', () => {
    it('should return false initially', () => {
      expect(sttEngine.getIsListening()).toBe(false);
    });
  });

  describe('getConfig', () => {
    it('should return config', () => {
      const config = sttEngine.getConfig();
      expect(config).toHaveProperty('language');
    });
  });
});

describe('TTSEngine', () => {
  let ttsEngine: TTSEngine;

  beforeEach(() => {
    ttsEngine = new TTSEngine();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(ttsEngine).toBeInstanceOf(TTSEngine);
    });
  });

  describe('isSupported', () => {
    it('should return boolean', () => {
      const result = ttsEngine.isSupported();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getIsSpeaking', () => {
    it('should return false initially', () => {
      expect(ttsEngine.getIsSpeaking()).toBe(false);
    });
  });

  describe('stop', () => {
    it('should not throw when called', () => {
      expect(() => ttsEngine.stop()).not.toThrow();
    });
  });
});

describe('EmotionEngine', () => {
  let emotionEngine: EmotionEngine;

  beforeEach(() => {
    emotionEngine = new EmotionEngine();
  });

  afterEach(() => {
    emotionEngine.destroy();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(emotionEngine).toBeInstanceOf(EmotionEngine);
    });
  });

  describe('isInitialized', () => {
    it('should return false initially', () => {
      expect(emotionEngine.isInitialized()).toBe(false);
    });
  });

  describe('analyzeEmotion', () => {
    it('should return emotion result without initialization', () => {
      const result = emotionEngine.analyzeEmotion();
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('audioFeatures');
    });
  });

  describe('analyzeTextEmotion', () => {
    it('should detect happy emotion', () => {
      const result = emotionEngine.analyzeTextEmotion('今天真是太开心了！');
      expect(result).toBe('happy');
    });

    it('should detect sad emotion', () => {
      const result = emotionEngine.analyzeTextEmotion('我很难过');
      expect(result).toBe('sad');
    });

    it('should detect angry emotion', () => {
      const result = emotionEngine.analyzeTextEmotion('我很生气！');
      expect(result).toBe('angry');
    });

    it('should return neutral for unknown text', () => {
      const result = emotionEngine.analyzeTextEmotion('今天天气不错');
      expect(result).toBe('neutral');
    });
  });

  describe('fuseEmotions', () => {
    it('should fuse voice and text emotions', () => {
      const voiceEmotion = {
        type: 'happy' as const,
        confidence: 0.8,
        audioFeatures: { pitch: 350, energy: 70, variation: 20 },
      };
      const textEmotion = 'happy' as const;

      const result = emotionEngine.fuseEmotions(voiceEmotion, textEmotion);
      expect(result.type).toBe('happy');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return voice emotion when text is neutral', () => {
      const voiceEmotion = {
        type: 'happy' as const,
        confidence: 0.8,
        audioFeatures: { pitch: 350, energy: 70, variation: 20 },
      };
      const textEmotion = 'neutral' as const;

      const result = emotionEngine.fuseEmotions(voiceEmotion, textEmotion);
      expect(result.type).toBe('happy');
    });
  });

  describe('destroy', () => {
    it('should not throw when called', () => {
      expect(() => emotionEngine.destroy()).not.toThrow();
    });
  });
});
