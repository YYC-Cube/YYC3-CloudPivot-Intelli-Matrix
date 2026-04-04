/**
 * @file Adapters.test.ts
 * @description YYC³ 语音适配器单元测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WakeWordDetector } from '../../../lib/voice/adapters/WakeWordDetector';
import { CommandRouter } from '../../../lib/voice/adapters/CommandRouter';
import type { VoiceCommand } from '../../../lib/voice/core/types';

describe('WakeWordDetector', () => {
  let detector: WakeWordDetector;

  beforeEach(() => {
    detector = new WakeWordDetector();
  });

  afterEach(() => {
    detector.disable();
  });

  describe('constructor', () => {
    it('should create instance with default config', () => {
      expect(detector).toBeInstanceOf(WakeWordDetector);
      expect(detector.isEnabled()).toBe(false);
    });

    it('should create instance with custom config', () => {
      const customDetector = new WakeWordDetector({
        words: ['test'],
        sensitivity: 0.9,
        cooldown: 1000,
      });
      expect(customDetector.getWakeWords()).toContain('test');
      customDetector.disable();
    });
  });

  describe('enable/disable', () => {
    it('should enable detection', () => {
      detector.enable();
      expect(detector.isEnabled()).toBe(true);
    });

    it('should disable detection', () => {
      detector.enable();
      detector.disable();
      expect(detector.isEnabled()).toBe(false);
    });
  });

  describe('detect', () => {
    it('should not detect when disabled', () => {
      const result = detector.detect('小语');
      expect(result.detected).toBe(false);
    });

    it('should detect wake word when enabled', () => {
      detector.enable();
      const result = detector.detect('小语');
      expect(result.detected).toBe(true);
      expect(result.word).toBe('小语');
    });

    it('should detect wake word in sentence', () => {
      detector.enable();
      const result = detector.detect('你好小语，今天天气怎么样');
      expect(result.detected).toBe(true);
    });

    it('should not detect during cooldown', () => {
      detector.enable();
      detector.detect('小语');
      const result = detector.detect('小语');
      expect(result.detected).toBe(false);
    });

    it('should not detect unknown words', () => {
      detector.enable();
      const result = detector.detect('今天天气很好');
      expect(result.detected).toBe(false);
    });
  });

  describe('setWakeWords', () => {
    it('should set custom wake words', () => {
      detector.setWakeWords(['custom', 'test']);
      expect(detector.getWakeWords()).toEqual(['custom', 'test']);
    });
  });
});

describe('CommandRouter', () => {
  let router: CommandRouter;

  const testCommands: VoiceCommand[] = [
    {
      id: 'test-command',
      command: '测试命令',
      aliases: ['测试', 'test'],
      description: '测试用命令',
      action: () => {},
      category: 'test',
    },
    {
      id: 'play',
      command: '播放',
      aliases: ['开始', 'play'],
      description: '播放音乐',
      action: () => {},
      category: 'music',
    },
  ];

  beforeEach(() => {
    router = new CommandRouter();
  });

  afterEach(() => {
    router.clear();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(router).toBeInstanceOf(CommandRouter);
    });

    it('should create instance with commands', () => {
      const cmdRouter = new CommandRouter({ commands: testCommands });
      expect(cmdRouter.getCommands().length).toBe(2);
      cmdRouter.clear();
    });
  });

  describe('registerCommand', () => {
    it('should register a command', () => {
      router.registerCommand(testCommands[0]);
      expect(router.getCommands().length).toBe(1);
    });

    it('should register multiple commands', () => {
      router.registerCommands(testCommands);
      expect(router.getCommands().length).toBe(2);
    });
  });

  describe('unregisterCommand', () => {
    it('should unregister a command', () => {
      router.registerCommands(testCommands);
      router.unregisterCommand('test-command');
      expect(router.getCommands().length).toBe(1);
    });
  });

  describe('match', () => {
    beforeEach(() => {
      router.registerCommand({
        id: 'test',
        command: '测试',
        aliases: ['test'],
        description: '测试',
        action: () => {},
      });
    });

    it('should match exact command', () => {
      const result = router.match('测试');
      expect(result.matched).toBe(true);
      expect(result.command).toBe('test');
      expect(result.confidence).toBe(1.0);
    });

    it('should match command in sentence', () => {
      const result = router.match('请测试一下');
      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    it('should match alias', () => {
      const result = router.match('test');
      expect(result.matched).toBe(true);
      expect(result.confidence).toBe(0.85);
    });

    it('should not match unknown command', () => {
      const result = router.match('未知命令');
      expect(result.matched).toBe(false);
    });
  });

  describe('execute', () => {
    it('should execute command', () => {
      let executed = false;
      router.registerCommand({
        id: 'test',
        command: '测试',
        description: '测试',
        action: () => { executed = true; },
      });

      const result = router.execute('test');
      expect(result).toBe(true);
      expect(executed).toBe(true);
    });

    it('should return false for unknown command', () => {
      const executed = router.execute('unknown');
      expect(executed).toBe(false);
    });
  });

  describe('getCommandsByCategory', () => {
    it('should filter commands by category', () => {
      router.registerCommands(testCommands);
      const musicCommands = router.getCommandsByCategory('music');
      expect(musicCommands.length).toBe(1);
      expect(musicCommands[0].id).toBe('play');
    });
  });
});
