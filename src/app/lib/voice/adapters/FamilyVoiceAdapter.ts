/**
 * @file FamilyVoiceAdapter.ts
 * @description YYC³ AI Family 语音适配器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-04
 */

import { VoiceService } from '../core/VoiceService';
import type { SpeechRecognitionResult, EmotionAnalysisResult, VoiceProfile } from '../core/types';
import { WakeWordDetector } from './WakeWordDetector';
import { CommandRouter } from './CommandRouter';
import type { VoiceAdapterConfig, ConversationMessage } from './types';
import type { VoiceCommand } from '../core/types';
import { DEFAULT_ADAPTER_CONFIG } from './types';
import {
  getFamilyVoiceProfile,
  getFamilyVoiceProfiles,
} from '../profiles/familyProfiles';

export interface FamilyVoiceAdapterEvents {
  onMessage?: (message: ConversationMessage) => void;
  onMemberChange?: (memberId: string) => void;
  onEmotionChange?: (emotion: EmotionAnalysisResult) => void;
  onWakeWord?: () => void;
}

export class FamilyVoiceAdapter {
  private voiceService: VoiceService;
  private wakeWordDetector: WakeWordDetector;
  private commandRouter: CommandRouter;
  private config: VoiceAdapterConfig;
  private currentMemberId: string = 'navigator';
  private conversationHistory: ConversationMessage[] = [];
  private events: FamilyVoiceAdapterEvents = {};
  private isInitialized: boolean = false;

  constructor(config?: Partial<VoiceAdapterConfig>) {
    this.config = { ...DEFAULT_ADAPTER_CONFIG, ...config };
    this.voiceService = new VoiceService({ language: 'zh-CN' });
    this.wakeWordDetector = new WakeWordDetector({
      words: ['小语', '小雨', '你好小语', '嘿小语'],
      sensitivity: 0.8,
      cooldown: 2000,
    });
    this.commandRouter = new CommandRouter({ fuzzyMatch: true, minConfidence: 0.7 });
    this.setupDefaultCommands();
  }

  private setupDefaultCommands(): void {
    const commands: VoiceCommand[] = [
      {
        id: 'switch-member',
        command: '切换家人',
        aliases: ['换人', '切换角色', '换个家人'],
        description: '切换当前对话的家人',
        action: () => this.cycleMember(),
        category: 'navigation',
      },
      {
        id: 'repeat',
        command: '再说一遍',
        aliases: ['重复', '再说一次'],
        description: '重复上一条消息',
        action: () => this.repeatLastMessage(),
        category: 'conversation',
      },
      {
        id: 'clear-history',
        command: '清空对话',
        aliases: ['清除历史', '重新开始'],
        description: '清空对话历史',
        action: () => this.clearHistory(),
        category: 'conversation',
      },
      {
        id: 'show-profile',
        command: '查看档案',
        aliases: ['档案', '个人资料'],
        description: '查看当前家人档案',
        action: () => this.showCurrentProfile(),
        category: 'info',
      },
      {
        id: 'help',
        command: '帮助',
        aliases: ['指令', '怎么用'],
        description: '显示帮助信息',
        action: () => this.showHelp(),
        category: 'info',
      },
    ];

    this.commandRouter.registerCommands(commands);
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {return true;}

    const voiceInitialized = await this.voiceService.initialize();
    if (!voiceInitialized) {
      console.warn('[FamilyVoiceAdapter] Voice service initialization failed');
    }

    this.wakeWordDetector.onDetected((result) => {
      if (result.detected) {
        this.handleWakeWord();
      }
    });

    if (this.config.wakeWordEnabled) {
      this.wakeWordDetector.enable();
    }

    this.isInitialized = true;
    return true;
  }

  private handleWakeWord(): void {
    this.wakeWordDetector.playWakeSound();
    this.events.onWakeWord?.();
    this.startListening();
  }

  setCurrentMember(memberId: string): void {
    const profile = getFamilyVoiceProfile(memberId);
    if (profile) {
      this.currentMemberId = memberId;
      this.voiceService.setProfile(profile);
      this.events.onMemberChange?.(memberId);
    }
  }

  getCurrentMember(): string {
    return this.currentMemberId;
  }

  cycleMember(): void {
    const profiles = getFamilyVoiceProfiles();
    const currentIndex = profiles.findIndex((p) => p.memberId === this.currentMemberId);
    const nextIndex = (currentIndex + 1) % profiles.length;
    this.setCurrentMember(profiles[nextIndex].memberId);
  }

  startListening(): void {
    this.voiceService.startListening(
      (result) => this.handleSpeechResult(result),
      (error) => this.handleError(error)
    );
  }

  stopListening(): void {
    this.voiceService.stopListening();
  }

  private handleSpeechResult(result: SpeechRecognitionResult): void {
    const wakeResult = this.wakeWordDetector.detect(result.transcript);

    if (wakeResult.detected) {
      return;
    }

    const commandMatch = this.commandRouter.match(result.transcript);

    if (commandMatch.matched && commandMatch.command) {
      this.commandRouter.execute(commandMatch.command);
      return;
    }

    this.addToHistory('user', result.transcript, result.emotion?.type);

    if (result.emotion) {
      this.events.onEmotionChange?.(result.emotion);
    }

    this.events.onMessage?.({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: result.transcript,
      timestamp: Date.now(),
      emotion: result.emotion?.type,
    });
  }

  private handleError(error: Error): void {
    console.error('[FamilyVoiceAdapter] Error:', error);
  }

  async speak(text: string, memberId?: string): Promise<void> {
    const targetMember = memberId || this.currentMemberId;
    const profile = getFamilyVoiceProfile(targetMember);

    if (profile) {
      await this.voiceService.speakWithProfile(text, profile);
    } else {
      await this.voiceService.speak(text);
    }

    this.addToHistory('assistant', text);
    this.events.onMessage?.({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: text,
      timestamp: Date.now(),
    });
  }

  async speakWithEmotion(text: string, emotion: string): Promise<void> {
    await this.voiceService.speakWithEmotion(text, emotion as any);
    this.addToHistory('assistant', text, emotion);
  }

  private addToHistory(role: 'user' | 'assistant', content: string, emotion?: string): void {
    this.conversationHistory.push({
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role,
      content,
      timestamp: Date.now(),
      emotion,
    });

    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
  }

  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  private repeatLastMessage(): void {
    const lastMessage = this.conversationHistory
      .filter((m) => m.role === 'assistant')
      .pop();
    if (lastMessage) {
      this.speak(lastMessage.content);
    }
  }

  private showCurrentProfile(): void {
    const profile = getFamilyVoiceProfile(this.currentMemberId);
    if (profile) {
      this.speak(`当前是${profile.memberName}，${profile.personality}`);
    }
  }

  private showHelp(): void {
    const commands = this.commandRouter.getCommands();
    const helpText = commands.map((c) => c.command).join('、');
    this.speak(`可以使用的指令有：${helpText}`);
  }

  registerCommand(command: VoiceCommand): void {
    this.commandRouter.registerCommand(command);
  }

  on(events: FamilyVoiceAdapterEvents): void {
    this.events = { ...this.events, ...events };
  }

  getProfile(): VoiceProfile | null {
    return this.voiceService.getProfile();
  }

  isListening(): boolean {
    return this.voiceService.getIsListening();
  }

  destroy(): void {
    this.voiceService.destroy();
    this.wakeWordDetector.disable();
    this.commandRouter.clear();
    this.conversationHistory = [];
    this.isInitialized = false;
  }
}

export default FamilyVoiceAdapter;
