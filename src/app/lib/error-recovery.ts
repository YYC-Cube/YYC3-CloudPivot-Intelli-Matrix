/**
 * error-recovery.ts
 * =================
 * 错误恢复策略
 *
 * 功能:
 * - 错误分类
 * - 恢复策略选择
 * - 自动恢复执行
 * - 恢复历史记录
 */

export enum ErrorCategory {
  NETWORK = "network",
  DATABASE = "database",
  AUTHENTICATION = "authentication",
  VALIDATION = "validation",
  RUNTIME = "runtime",
  UNKNOWN = "unknown",
}

export enum RecoveryStrategy {
  RETRY = "retry",
  FALLBACK = "fallback",
  IGNORE = "ignore",
  LOG_ONLY = "log_only",
  ALERT = "alert",
}

export interface ErrorRecoveryConfig {
  category: ErrorCategory;
  strategy: RecoveryStrategy;
  maxRetries?: number;
  fallbackAction?: () => Promise<unknown>;
  alertThreshold?: number;
}

export interface RecoveryRecord {
  id: string;
  timestamp: number;
  error: Error;
  category: ErrorCategory;
  strategy: RecoveryStrategy;
  success: boolean;
  attempts: number;
}

export class ErrorRecovery {
  private static recoveryConfigs: Map<string, ErrorRecoveryConfig> = new Map();
  private static recoveryHistory: RecoveryRecord[] = [];
  private static errorCounts: Map<string, number> = new Map();

  static configureRecovery(
    errorPattern: string,
    config: ErrorRecoveryConfig
  ): void {
    ErrorRecovery.recoveryConfigs.set(errorPattern, config);
  }

  static categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes("database") || message.includes("sql")) {
      return ErrorCategory.DATABASE;
    }

    if (message.includes("auth") || message.includes("unauthorized")) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorCategory.VALIDATION;
    }

    if (message.includes("runtime") || message.includes("type")) {
      return ErrorCategory.RUNTIME;
    }

    return ErrorCategory.UNKNOWN;
  }

  static getRecoveryStrategy(error: Error): ErrorRecoveryConfig {
    const category = ErrorRecovery.categorizeError(error);

    for (const [pattern, config] of ErrorRecovery.recoveryConfigs.entries()) {
      if (error.message.toLowerCase().includes(pattern.toLowerCase())) {
        return config;
      }
    }

    const defaultStrategy: ErrorRecoveryConfig = {
      category,
      strategy: RecoveryStrategy.LOG_ONLY,
    };

    switch (category) {
      case ErrorCategory.NETWORK:
        defaultStrategy.strategy = RecoveryStrategy.RETRY;
        defaultStrategy.maxRetries = 3;
        break;
      case ErrorCategory.DATABASE:
        defaultStrategy.strategy = RecoveryStrategy.RETRY;
        defaultStrategy.maxRetries = 2;
        break;
      case ErrorCategory.VALIDATION:
        defaultStrategy.strategy = RecoveryStrategy.IGNORE;
        break;
      case ErrorCategory.AUTHENTICATION:
        defaultStrategy.strategy = RecoveryStrategy.ALERT;
        defaultStrategy.alertThreshold = 1;
        break;
    }

    return defaultStrategy;
  }

  static async recover(
    error: Error,
    action: () => Promise<unknown>
  ): Promise<{ success: boolean; result?: unknown; record: RecoveryRecord }> {
    const strategy = ErrorRecovery.getRecoveryStrategy(error);
    const recordId = `recovery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let attempts = 0;
    let success = false;
    let result: unknown;

    const record: RecoveryRecord = {
      id: recordId,
      timestamp: Date.now(),
      error,
      category: strategy.category,
      strategy: strategy.strategy,
      success: false,
      attempts: 0,
    };

    try {
      switch (strategy.strategy) {
        case RecoveryStrategy.RETRY:
          for (let i = 0; i < (strategy.maxRetries || 3); i++) {
            attempts++;
            try {
              result = await action();
              success = true;
              break;
            } catch (retryError) {
              if (i === (strategy.maxRetries || 3) - 1) {
                throw retryError;
              }
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
          }
          break;

        case RecoveryStrategy.FALLBACK:
          if (strategy.fallbackAction) {
            result = await strategy.fallbackAction();
            success = true;
          }
          break;

        case RecoveryStrategy.IGNORE:
          success = true;
          break;

        case RecoveryStrategy.LOG_ONLY:
          console.error(`[ErrorRecovery] ${strategy.category}: ${error.message}`);
          break;

        case RecoveryStrategy.ALERT: {
          ErrorRecovery.incrementErrorCount(error.message);
          const count = ErrorRecovery.getErrorCount(error.message);
          if (strategy.alertThreshold && count >= strategy.alertThreshold) {
            console.error(`[ErrorRecovery] ALERT: Error occurred ${count} times: ${error.message}`);
          }
          break;
        }
      }
    } catch (recoveryError) {
      console.error(`[ErrorRecovery] Recovery failed:`, recoveryError);
    }

    record.success = success;
    record.attempts = attempts;

    ErrorRecovery.recoveryHistory.push(record);
    ErrorRecovery.cleanupHistory();

    return { success, result, record };
  }

  private static incrementErrorCount(errorKey: string): void {
    const count = ErrorRecovery.errorCounts.get(errorKey) || 0;
    ErrorRecovery.errorCounts.set(errorKey, count + 1);
  }

  private static getErrorCount(errorKey: string): number {
    return ErrorRecovery.errorCounts.get(errorKey) || 0;
  }

  static getRecoveryHistory(limit: number = 100): RecoveryRecord[] {
    return ErrorRecovery.recoveryHistory.slice(-limit);
  }

  static getErrorCounts(): Map<string, number> {
    return new Map(ErrorRecovery.errorCounts);
  }

  private static cleanupHistory(): void {
    const maxHistorySize = 1000;
    if (ErrorRecovery.recoveryHistory.length > maxHistorySize) {
      ErrorRecovery.recoveryHistory = ErrorRecovery.recoveryHistory.slice(-maxHistorySize);
    }
  }

  static clearHistory(): void {
    ErrorRecovery.recoveryHistory = [];
    ErrorRecovery.errorCounts.clear();
  }
}

export const errorRecovery = {
  configureRecovery: ErrorRecovery.configureRecovery.bind(ErrorRecovery),
  recover: ErrorRecovery.recover.bind(ErrorRecovery),
  getRecoveryHistory: ErrorRecovery.getRecoveryHistory.bind(ErrorRecovery),
  getErrorCounts: ErrorRecovery.getErrorCounts.bind(ErrorRecovery),
  clearHistory: ErrorRecovery.clearHistory.bind(ErrorRecovery),
};