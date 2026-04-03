/**
 * retry-manager.ts
 * =================
 * 重试管理器
 *
 * 功能:
 * - 指数退避重试
 * - 可配置重试策略
 * - 错误分类处理
 * - 重试统计
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: (error: Error) => boolean;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export class RetryManager {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryableErrors: (error: Error) => {
      return this.isRetryableError(error);
    },
    onRetry: () => {},
  };

  private static isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    
    const retryablePatterns = [
      'network',
      'timeout',
      'econnrefused',
      'enotfound',
      'etimedout',
      '5xx',
      '503',
      '502',
      '504',
    ];

    return retryablePatterns.some(pattern => message.includes(pattern));
  }

  private static calculateDelay(
    attempt: number,
    options: Required<RetryOptions>
  ): number {
    const delay = Math.min(
      options.baseDelay * Math.pow(options.backoffFactor, attempt),
      options.maxDelay
    );
    
    return delay + Math.random() * 100;
  }

  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const mergedOptions = { ...RetryManager.DEFAULT_OPTIONS, ...options };
    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < mergedOptions.maxAttempts; attempt++) {
      try {
        const data = await fn();
        
        return {
          success: true,
          data,
          attempts: attempt + 1,
          totalTime: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error as Error;
        
        const isLastAttempt = attempt === mergedOptions.maxAttempts - 1;
        const isRetryable = mergedOptions.retryableErrors(lastError);

        if (isLastAttempt || !isRetryable) {
          return {
            success: false,
            error: lastError,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
          };
        }

        if (mergedOptions.onRetry) {
          mergedOptions.onRetry(attempt + 1, lastError);
        }

        const delay = RetryManager.calculateDelay(attempt, mergedOptions);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: mergedOptions.maxAttempts,
      totalTime: Date.now() - startTime,
    };
  }

  static async executeWithFallback<T>(
    primaryFn: () => Promise<T>,
    fallbackFn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const primaryResult = await RetryManager.execute(primaryFn, options);

    if (primaryResult.success) {
      return primaryResult;
    }

    try {
      const fallbackData = await fallbackFn();
      
      return {
        success: true,
        data: fallbackData,
        attempts: primaryResult.attempts + 1,
        totalTime: primaryResult.totalTime,
      };
    } catch (fallbackError) {
      return {
        success: false,
        error: fallbackError as Error,
        attempts: primaryResult.attempts + 1,
        totalTime: primaryResult.totalTime,
      };
    }
  }
}

export const retryManager = {
  execute: RetryManager.execute.bind(RetryManager),
  executeWithFallback: RetryManager.executeWithFallback.bind(RetryManager),
};