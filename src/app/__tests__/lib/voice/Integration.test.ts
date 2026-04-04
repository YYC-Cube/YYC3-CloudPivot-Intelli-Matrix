/**
 * @file Integration.test.ts
 * @description YYC³ 语音服务集成测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VoiceService } from '../../../lib/voice/core/VoiceService';
import { DMusicIntegration } from '../../../lib/voice/integration/DMusicIntegration';
import type { DMusicEmotion } from '../../../lib/voice/integration/types';

describe('Voice Service Integration Tests', () => {
  let voiceService: VoiceService;
  let dmusicIntegration: DMusicIntegration;

  beforeEach(() => {
    voiceService = new VoiceService();
    dmusicIntegration = new DMusicIntegration({
      enableVoiceControl: true,
      enableEmotionSync: true,
      language: 'zh',
    });
  });

  afterEach(() => {
    voiceService.destroy();
    dmusicIntegration.reset();
  });

  describe('DMusicIntegration', () => {
    it('should create instance with default config', () => {
      const integration = new DMusicIntegration();
      const config = integration.getConfig();
      expect(config.enableVoiceControl).toBe(true);
      expect(config.enableEmotionSync).toBe(true);
      expect(config.language).toBe('zh');
    });

    it('should create instance with custom config', () => {
      const integration = new DMusicIntegration({
        language: 'en',
        enableEmotionVisualization: false,
      });
      const config = integration.getConfig();
      expect(config.language).toBe('en');
      expect(config.enableEmotionVisualization).toBe(false);
    });

    it('should return voice commands for Chinese', () => {
      const commands = dmusicIntegration.getVoiceCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands[0].command).toBe('播放');
    });

    it('should return voice commands for English', () => {
      const integration = new DMusicIntegration({ language: 'en' });
      const commands = integration.getVoiceCommands();
      expect(commands.length).toBeGreaterThan(0);
      expect(commands[0].command).toBe('play');
    });

    it('should process voice command and execute action', () => {
      const mockPlay = vi.fn();
      dmusicIntegration.registerPlayerActions({ play: mockPlay });

      const result = dmusicIntegration.processVoiceCommand('播放');
      expect(result.matched).toBe(true);
      expect(result.executed).toBe(true);
      expect(mockPlay).toHaveBeenCalled();
    });

    it('should process voice command with alias', () => {
      const mockPause = vi.fn();
      dmusicIntegration.registerPlayerActions({ pause: mockPause });

      const result = dmusicIntegration.processVoiceCommand('停止');
      expect(result.matched).toBe(true);
      expect(result.executed).toBe(true);
      expect(mockPause).toHaveBeenCalled();
    });

    it('should handle setVolume command with parameter', () => {
      const mockSetVolume = vi.fn();
      dmusicIntegration.registerPlayerActions({ setVolume: mockSetVolume });

      const result = dmusicIntegration.processVoiceCommand('音量大');
      expect(result.matched).toBe(true);
      expect(result.executed).toBe(true);
      expect(mockSetVolume).toHaveBeenCalledWith(0.9);
    });

    it('should return false for unmatched command', () => {
      const result = dmusicIntegration.processVoiceCommand('未知命令');
      expect(result.matched).toBe(false);
    });

    it('should return false when voice control disabled', () => {
      const integration = new DMusicIntegration({ enableVoiceControl: false });
      const result = integration.processVoiceCommand('播放');
      expect(result.matched).toBe(false);
    });

    it('should sync emotion from voice service to D-Music', () => {
      const emotionCallback = vi.fn();
      dmusicIntegration.setEmotionCallback(emotionCallback);

      const dmusicEmotion = dmusicIntegration.syncEmotion('happy');
      expect(dmusicEmotion).toBe('happy');
      expect(emotionCallback).toHaveBeenCalledWith('happy');
    });

    it('should map angry emotion to energetic', () => {
      const dmusicEmotion = dmusicIntegration.syncEmotion('angry');
      expect(dmusicEmotion).toBe('energetic');
    });

    it('should map fear emotion to calm', () => {
      const dmusicEmotion = dmusicIntegration.syncEmotion('fear');
      expect(dmusicEmotion).toBe('calm');
    });

    it('should return emotion palette', () => {
      const palette = dmusicIntegration.getEmotionPalette('happy');
      expect(palette.primary).toBe('#FFD700');
      expect(palette.secondary).toBe('#FFA500');
    });

    it('should return recommended tracks by emotion', () => {
      const tracks = dmusicIntegration.getRecommendedTracks('happy', 5);
      expect(tracks.length).toBe(5);
      expect(tracks[0].emotion).toBe('happy');
    });

    it('should create emotion-based playlist', () => {
      const tracks = dmusicIntegration.createEmotionBasedPlaylist('calm');
      expect(tracks.length).toBe(20);
      expect(tracks[0].emotion).toBe('calm');

      const state = dmusicIntegration.getPlayerState();
      expect(state.playlist.length).toBe(20);
    });

    it('should analyze track emotion from tags', () => {
      const track = {
        id: 'test-1',
        title: 'Test Song',
        artist: 'Artist',
        duration: 180,
        tags: ['rock', 'energetic'],
      };
      const emotion = dmusicIntegration.analyzeTrackEmotion(track);
      expect(emotion).toBe('energetic');
    });

    it('should analyze track emotion from title', () => {
      const track = {
        id: 'test-2',
        title: 'Happy Day',
        artist: 'Artist',
        duration: 180,
      };
      const emotion = dmusicIntegration.analyzeTrackEmotion(track);
      expect(emotion).toBe('happy');
    });

    it('should update and get player state', () => {
      dmusicIntegration.updatePlayerState({
        isPlaying: true,
        volume: 0.8,
      });

      const state = dmusicIntegration.getPlayerState();
      expect(state.isPlaying).toBe(true);
      expect(state.volume).toBe(0.8);
    });

    it('should call state change callback', () => {
      const stateCallback = vi.fn();
      dmusicIntegration.setStateCallback(stateCallback);

      dmusicIntegration.updatePlayerState({ isPlaying: true });
      expect(stateCallback).toHaveBeenCalled();
    });

    it('should call command executed callback', () => {
      const commandCallback = vi.fn();
      dmusicIntegration.setCommandCallback(commandCallback);
      dmusicIntegration.registerPlayerActions({ play: vi.fn() });

      dmusicIntegration.processVoiceCommand('播放');
      expect(commandCallback).toHaveBeenCalledWith('播放', true);
    });

    it('should reset to default state', () => {
      dmusicIntegration.updatePlayerState({
        isPlaying: true,
        volume: 0.5,
      });

      dmusicIntegration.reset();
      const state = dmusicIntegration.getPlayerState();
      expect(state.isPlaying).toBe(false);
      expect(state.volume).toBe(0.7);
    });
  });

  describe('VoiceService + DMusicIntegration', () => {
    it('should integrate voice service with D-Music', () => {
      const mockPlay = vi.fn();
      dmusicIntegration.registerPlayerActions({ play: mockPlay });

      expect(voiceService).toBeDefined();
      expect(dmusicIntegration).toBeDefined();
    });

    it('should handle emotion flow from voice to music', () => {
      const emotionCallback = vi.fn();
      dmusicIntegration.setEmotionCallback(emotionCallback);

      const emotion = dmusicIntegration.syncEmotion('happy');
      expect(emotion).toBe('happy');

      const tracks = dmusicIntegration.getRecommendedTracks(emotion, 3);
      expect(tracks.length).toBe(3);
      expect(tracks[0].emotion).toBe('happy');
    });

    it('should handle command flow from voice to music', () => {
      const mockNext = vi.fn();
      const mockPrevious = vi.fn();
      dmusicIntegration.registerPlayerActions({
        next: mockNext,
        previous: mockPrevious,
      });

      const result1 = dmusicIntegration.processVoiceCommand('下一首');
      expect(result1.matched).toBe(true);
      expect(mockNext).toHaveBeenCalled();

      const result2 = dmusicIntegration.processVoiceCommand('上一首');
      expect(result2.matched).toBe(true);
      expect(mockPrevious).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing player action gracefully', () => {
      const result = dmusicIntegration.processVoiceCommand('播放');
      expect(result.matched).toBe(true);
      expect(result.executed).toBe(false);
    });

    it('should handle empty playlist', () => {
      const state = dmusicIntegration.getPlayerState();
      expect(state.playlist).toEqual([]);
      expect(state.currentTrack).toBeNull();
    });

    it('should handle unknown emotion palette', () => {
      const palette = dmusicIntegration.getEmotionPalette('unknown' as DMusicEmotion);
      expect(palette.primary).toBe('#8B5CF6');
    });

    it('should handle track without emotion or tags', () => {
      const track = {
        id: 'test-3',
        title: 'Unknown Song',
        artist: 'Artist',
        duration: 180,
      };
      const emotion = dmusicIntegration.analyzeTrackEmotion(track);
      expect(emotion).toBe('neutral');
    });
  });
});
