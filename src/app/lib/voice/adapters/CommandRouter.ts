/**
 * @file CommandRouter.ts
 * @description YYC³ 语音命令路由器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 */

import type { CommandMatch } from './types';
import type { VoiceCommand } from '../core/types';

export interface CommandRouterConfig {
  commands: VoiceCommand[];
  fuzzyMatch: boolean;
  minConfidence: number;
}

export class CommandRouter {
  private commands: Map<string, VoiceCommand> = new Map();
  private fuzzyMatch: boolean;
  private minConfidence: number;

  constructor(config?: Partial<CommandRouterConfig>) {
    this.fuzzyMatch = config?.fuzzyMatch ?? true;
    this.minConfidence = config?.minConfidence ?? 0.7;

    if (config?.commands) {
      this.registerCommands(config.commands);
    }
  }

  registerCommand(command: VoiceCommand): void {
    this.commands.set(command.id, command);
  }

  registerCommands(commands: VoiceCommand[]): void {
    commands.forEach((cmd) => this.registerCommand(cmd));
  }

  unregisterCommand(commandId: string): void {
    this.commands.delete(commandId);
  }

  getCommands(): VoiceCommand[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: string): VoiceCommand[] {
    return Array.from(this.commands.values()).filter((cmd) => cmd.category === category);
  }

  match(transcript: string): CommandMatch {
    const lowerTranscript = transcript.toLowerCase().trim();

    for (const [id, cmd] of this.commands) {
      const lowerCommand = cmd.command.toLowerCase();

      if (lowerTranscript === lowerCommand) {
        return {
          matched: true,
          command: id,
          action: cmd.action.name,
          confidence: 1.0,
        };
      }

      if (lowerTranscript.includes(lowerCommand)) {
        return {
          matched: true,
          command: id,
          action: cmd.action.name,
          confidence: 0.9,
        };
      }

      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          const lowerAlias = alias.toLowerCase();
          if (lowerTranscript.includes(lowerAlias)) {
            return {
              matched: true,
              command: id,
              action: cmd.action.name,
              confidence: 0.85,
            };
          }
        }
      }
    }

    if (this.fuzzyMatch) {
      return this.fuzzyMatchCommand(lowerTranscript);
    }

    return { matched: false, confidence: 0 };
  }

  private fuzzyMatchCommand(transcript: string): CommandMatch {
    let bestMatch: CommandMatch = { matched: false, confidence: 0 };

    for (const [id, cmd] of this.commands) {
      const similarity = this.calculateSimilarity(transcript, cmd.command.toLowerCase());

      if (similarity > bestMatch.confidence && similarity >= this.minConfidence) {
        bestMatch = {
          matched: true,
          command: id,
          action: cmd.action.name,
          confidence: similarity,
        };
      }

      if (cmd.aliases) {
        for (const alias of cmd.aliases) {
          const aliasSimilarity = this.calculateSimilarity(transcript, alias.toLowerCase());
          if (aliasSimilarity > bestMatch.confidence && aliasSimilarity >= this.minConfidence) {
            bestMatch = {
              matched: true,
              command: id,
              action: cmd.action.name,
              confidence: aliasSimilarity,
            };
          }
        }
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(a: string, b: string): number {
    if (a === b) {return 1;}
    if (a.length === 0 || b.length === 0) {return 0;}

    const matrix: number[][] = [];

    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[a.length][b.length];
    const maxLength = Math.max(a.length, b.length);
    return 1 - distance / maxLength;
  }

  execute(commandId: string): boolean {
    const command = this.commands.get(commandId);
    if (command) {
      command.action();
      return true;
    }
    return false;
  }

  clear(): void {
    this.commands.clear();
  }
}

export default CommandRouter;
