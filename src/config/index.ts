/**
 * @file: index.ts
 * @description: 配置管理入口文件
 * @author: YYC³ Team
 * @version: v1.0.0
 * @created: 2026-03-26
 */

export { config, ConfigLoader, ConfigError } from './config-loader';
export type { Config } from './env/env.config';
export { ENV_KEYS } from './env/env.config';

/**
 * 配置管理使用示例
 *
 * @example
 * ```typescript
 * import { config } from '@/config';
 *
 * // 使用配置
 * const apiUrl = config.api.API_BASE_URL;
 * const wsUrl = config.websocket.WS_URL;
 * const enableGhostMode = config.features.ENABLE_GHOST_MODE;
 *
 * // 检查功能开关
 * if (config.features.ENABLE_AI_ASSISTANT) {
 *   // 启用 AI 助手功能
 * }
 * ```
 */
