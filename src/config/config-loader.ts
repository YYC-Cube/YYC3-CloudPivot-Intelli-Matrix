/**
 * @file: config-loader.ts
 * @description: 配置加载器和验证器
 * @author: YYC³ Team
 * @version: v1.0.0
 * @created: 2026-03-26
 */

import type { Config } from './env/env.config';
import { ENV_KEYS } from './env/env.config';

/**
 * 配置错误类
 */
export class ConfigError extends Error {
  constructor(message: string, public key?: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * 环境变量解析器
 */
class EnvParser {
  /**
   * 获取字符串值
   */
  static getString(key: string, defaultValue?: string): string {
    const value = import.meta.env[key];
    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigError(`Missing required environment variable: ${key}`, key);
    }
    return value;
  }

  /**
   * 获取布尔值
   */
  static getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = import.meta.env[key];
    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigError(`Missing required environment variable: ${key}`, key);
    }
    return value === 'true' || value === '1';
  }

  /**
   * 获取数字值
   */
  static getNumber(key: string, defaultValue?: number): number {
    const value = import.meta.env[key];
    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigError(`Missing required environment variable: ${key}`, key);
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new ConfigError(`Invalid number value for environment variable: ${key}`, key);
    }
    return num;
  }

  /**
   * 获取枚举值
   */
  static getEnum<T extends string>(key: string, values: readonly T[], defaultValue?: T): T {
    const value = import.meta.env[key];
    if (value === undefined || value === null) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new ConfigError(`Missing required environment variable: ${key}`, key);
    }
    if (!values.includes(value as T)) {
      throw new ConfigError(
        `Invalid enum value for environment variable: ${key}. Expected one of: ${values.join(', ')}`,
        key
      );
    }
    return value as T;
  }
}

/**
 * 配置验证器
 */
class ConfigValidator {
  /**
   * 验证 URL 格式
   */
  static validateUrl(url: string, key: string): void {
    try {
      new URL(url);
    } catch {
      throw new ConfigError(`Invalid URL format for environment variable: ${key}`, key);
    }
  }

  /**
   * 验证 WebSocket URL 格式
   */
  static validateWebSocketUrl(url: string, key: string): void {
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      throw new ConfigError(
        `Invalid WebSocket URL format for environment variable: ${key}. Must start with ws:// or wss://`,
        key
      );
    }
  }

  /**
   * 验证端口号
   */
  static validatePort(port: number, key: string): void {
    if (port < 1 || port > 65535) {
      throw new ConfigError(
        `Invalid port number for environment variable: ${key}. Must be between 1 and 65535`,
        key
      );
    }
  }

  /**
   * 验证 IP 地址
   */
  static validateIP(ip: string, key: string): void {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      throw new ConfigError(`Invalid IP address format for environment variable: ${key}`, key);
    }
    const parts = ip.split('.');
    for (const part of parts) {
      const num = Number(part);
      if (num < 0 || num > 255) {
        throw new ConfigError(`Invalid IP address format for environment variable: ${key}`, key);
      }
    }
  }

  /**
   * 验证文件路径
   */
  static validateFilePath(path: string, key: string): void {
    if (!path || path.trim() === '') {
      throw new ConfigError(`Invalid file path for environment variable: ${key}`, key);
    }
  }

  /**
   * 验证 Cron 表达式
   */
  static validateCron(cron: string, key: string): void {
    const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
    if (!cronRegex.test(cron)) {
      throw new ConfigError(`Invalid cron expression for environment variable: ${key}`, key);
    }
  }
}

/**
 * 配置加载器
 */
export class ConfigLoader {
  private static instance: Config;
  private static loaded = false;

  /**
   * 加载配置
   */
  static load(): Config {
    if (this.loaded) {
      return this.instance;
    }

    try {
      this.instance = {
        app: this.loadAppConfig(),
        features: this.loadFeatureFlags(),
        api: this.loadApiConfig(),
        websocket: this.loadWebSocketConfig(),
        logging: this.loadLoggingConfig(),
        database: this.loadDatabaseConfig(),
        redis: this.loadRedisConfig(),
        ai: this.loadAIModelConfig(),
        network: this.loadNetworkConfig(),
        monitoring: this.loadMonitoringConfig(),
        mcp: this.loadMCPConfig(),
        domain: this.loadDomainConfig(),
        ports: this.loadPortMappingConfig(),
        cloudpivot: this.loadCloudPivotMatrixConfig(),
        cache: this.loadCacheConfig(),
        rateLimit: this.loadRateLimitConfig(),
        ssl: this.loadSSLConfig(),
        security: this.loadSecurityConfig(),
        backup: this.loadBackupConfig(),
        nfs: this.loadNFSConfig(),
        healthCheck: this.loadHealthCheckConfig(),
        devTools: this.loadDevToolsConfig(),
      };

      this.loaded = true;
      return this.instance;
    } catch (error) {
      if (error instanceof ConfigError) {
        console.error(`Configuration Error: ${error.message}`);
        throw error;
      }
      throw new ConfigError(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取配置实例
   */
  static getInstance(): Config {
    if (!this.loaded) {
      return this.load();
    }
    return this.instance;
  }

  /**
   * 加载应用配置
   */
  private static loadAppConfig() {
    const config = {
      APP_NAME: EnvParser.getString(ENV_KEYS.APP.APP_NAME, 'YYC³ CloudPivot Intelli-Matrix'),
      APP_VERSION: EnvParser.getString(ENV_KEYS.APP.APP_VERSION, '0.0.1'),
      APP_URL: EnvParser.getString(ENV_KEYS.APP.APP_URL, 'http://localhost:3118'),
      DEFAULT_THEME: EnvParser.getString(ENV_KEYS.APP.DEFAULT_THEME, 'cyberpunk'),
      DEFAULT_LANGUAGE: EnvParser.getString(ENV_KEYS.APP.DEFAULT_LANGUAGE, 'zh-CN'),
    };

    ConfigValidator.validateUrl(config.APP_URL, ENV_KEYS.APP.APP_URL);

    return config;
  }

  /**
   * 加载功能开关配置
   */
  private static loadFeatureFlags() {
    return {
      ENABLE_GHOST_MODE: EnvParser.getBoolean(ENV_KEYS.FEATURES.ENABLE_GHOST_MODE, true),
      ENABLE_PWA: EnvParser.getBoolean(ENV_KEYS.FEATURES.ENABLE_PWA, true),
      ENABLE_AI_ASSISTANT: EnvParser.getBoolean(ENV_KEYS.FEATURES.ENABLE_AI_ASSISTANT, true),
      DEV_MODE: EnvParser.getBoolean(ENV_KEYS.FEATURES.DEV_MODE, true),
      DEBUG_MODE: EnvParser.getBoolean(ENV_KEYS.FEATURES.DEBUG_MODE, false),
    };
  }

  /**
   * 加载 API 配置
   */
  private static loadApiConfig() {
    const config = {
      API_BASE_URL: EnvParser.getString(ENV_KEYS.API.API_BASE_URL, 'http://localhost:3118/api'),
      API_PROXY_BASE_URL: EnvParser.getString(ENV_KEYS.API.API_PROXY_BASE_URL, 'https://api.0379.world'),
      API_PROXY_TIMEOUT: EnvParser.getNumber(ENV_KEYS.API.API_PROXY_TIMEOUT, 30000),
      API_PROXY_VERSION: EnvParser.getString(ENV_KEYS.API.API_PROXY_VERSION, '1.0.0'),
      API_HOST: EnvParser.getString(ENV_KEYS.API.API_HOST, '0.0.0.0'),
      API_PORT: EnvParser.getNumber(ENV_KEYS.API.API_PORT, 8000),
      API_WORKERS: EnvParser.getNumber(ENV_KEYS.API.API_WORKERS, 4),
      API_DEBUG: EnvParser.getBoolean(ENV_KEYS.API.API_DEBUG, false),
      API_LOG_LEVEL: EnvParser.getEnum(
        ENV_KEYS.API.API_LOG_LEVEL,
        ['debug', 'info', 'warn', 'error'],
        'info'
      ),
    };

    ConfigValidator.validateUrl(config.API_BASE_URL, ENV_KEYS.API.API_BASE_URL);
    ConfigValidator.validateUrl(config.API_PROXY_BASE_URL, ENV_KEYS.API.API_PROXY_BASE_URL);
    ConfigValidator.validatePort(config.API_PORT, ENV_KEYS.API.API_PORT);

    return config;
  }

  /**
   * 加载 WebSocket 配置
   */
  private static loadWebSocketConfig() {
    const config = {
      WS_URL: EnvParser.getString(ENV_KEYS.WEBSOCKET.WS_URL, 'ws://localhost:3113/ws'),
      WS_RECONNECT_INTERVAL: EnvParser.getNumber(ENV_KEYS.WEBSOCKET.WS_RECONNECT_INTERVAL, 5000),
      WS_MAX_RECONNECT_ATTEMPTS: EnvParser.getNumber(ENV_KEYS.WEBSOCKET.WS_MAX_RECONNECT_ATTEMPTS, 10),
      WS_HEARTBEAT_INTERVAL: EnvParser.getNumber(ENV_KEYS.WEBSOCKET.WS_HEARTBEAT_INTERVAL, 30000),
    };

    ConfigValidator.validateWebSocketUrl(config.WS_URL, ENV_KEYS.WEBSOCKET.WS_URL);

    return config;
  }

  /**
   * 加载日志配置
   */
  private static loadLoggingConfig() {
    return {
      LOG_LEVEL: EnvParser.getEnum(
        ENV_KEYS.LOGGING.LOG_LEVEL,
        ['debug', 'info', 'warn', 'error'],
        'info'
      ),
    };
  }

  /**
   * 加载数据库配置
   */
  private static loadDatabaseConfig() {
    const config = {
      POSTGRES_PASSWORD: EnvParser.getString(ENV_KEYS.DATABASE.POSTGRES_PASSWORD, 'postgres'),
      DB_HOST: EnvParser.getString(ENV_KEYS.DATABASE.DB_HOST, 'postgres'),
      DB_PORT: EnvParser.getNumber(ENV_KEYS.DATABASE.DB_PORT, 5432),
      DB_USER: EnvParser.getString(ENV_KEYS.DATABASE.DB_USER, 'postgres'),
      DB_PASSWORD: EnvParser.getString(ENV_KEYS.DATABASE.DB_PASSWORD, 'postgres'),
      DB_NAME: EnvParser.getString(ENV_KEYS.DATABASE.DB_NAME, 'yyc3_gpt'),
    };

    ConfigValidator.validatePort(config.DB_PORT, ENV_KEYS.DATABASE.DB_PORT);

    return config;
  }

  /**
   * 加载 Redis 配置
   */
  private static loadRedisConfig() {
    const config = {
      REDIS_HOST: EnvParser.getString(ENV_KEYS.REDIS.REDIS_HOST, 'redis'),
      REDIS_PORT: EnvParser.getNumber(ENV_KEYS.REDIS.REDIS_PORT, 6379),
      REDIS_DB: EnvParser.getNumber(ENV_KEYS.REDIS.REDIS_DB, 0),
      REDIS_PASSWORD: EnvParser.getString(ENV_KEYS.REDIS.REDIS_PASSWORD, ''),
    };

    ConfigValidator.validatePort(config.REDIS_PORT, ENV_KEYS.REDIS.REDIS_PORT);

    return config;
  }

  /**
   * 加载 AI 模型配置
   */
  private static loadAIModelConfig() {
    return {
      OPENAI_API_KEY: EnvParser.getString(ENV_KEYS.AI.OPENAI_API_KEY, ''),
      ZHIPU_API_KEY: EnvParser.getString(ENV_KEYS.AI.ZHIPU_API_KEY, ''),
      OLLAMA_HOST: EnvParser.getString(ENV_KEYS.AI.OLLAMA_HOST, 'host.docker.internal'),
      OLLAMA_PORT: EnvParser.getNumber(ENV_KEYS.AI.OLLAMA_PORT, 11435),
      OLLAMA_MODELS_PATH: EnvParser.getString(ENV_KEYS.AI.OLLAMA_MODELS_PATH, '/mnt/models'),
    };
  }

  /**
   * 加载网络配置
   */
  private static loadNetworkConfig() {
    const config = {
      HOST_IP: EnvParser.getString(ENV_KEYS.NETWORK.HOST_IP, '10.200.0.2'),
      HOST_IP_SUFFIX: EnvParser.getNumber(ENV_KEYS.NETWORK.HOST_IP_SUFFIX, 2),
    };

    ConfigValidator.validateIP(config.HOST_IP, ENV_KEYS.NETWORK.HOST_IP);

    return config;
  }

  /**
   * 加载监控配置
   */
  private static loadMonitoringConfig() {
    const config = {
      PROMETHEUS_MULTIPROC_DIR: EnvParser.getString(
        ENV_KEYS.MONITORING.PROMETHEUS_MULTIPROC_DIR,
        '/tmp/prometheus_multiproc'
      ),
      PROMETHEUS_ENABLED: EnvParser.getBoolean(ENV_KEYS.MONITORING.PROMETHEUS_ENABLED, true),
      GRAFANA_ENABLED: EnvParser.getBoolean(ENV_KEYS.MONITORING.GRAFANA_ENABLED, true),
      ALERTMANAGER_ENABLED: EnvParser.getBoolean(ENV_KEYS.MONITORING.ALERTMANAGER_ENABLED, true),
    };

    ConfigValidator.validateFilePath(config.PROMETHEUS_MULTIPROC_DIR, ENV_KEYS.MONITORING.PROMETHEUS_MULTIPROC_DIR);

    return config;
  }

  /**
   * 加载 MCP 配置
   */
  private static loadMCPConfig() {
    return {
      BRAVE_API_KEY: EnvParser.getString(ENV_KEYS.MCP.BRAVE_API_KEY, ''),
      GITHUB_PERSONAL_ACCESS_TOKEN: EnvParser.getString(ENV_KEYS.MCP.GITHUB_PERSONAL_ACCESS_TOKEN, ''),
    };
  }

  /**
   * 加载域名配置
   */
  private static loadDomainConfig() {
    const config = {
      API_DOMAIN: EnvParser.getString(ENV_KEYS.DOMAIN.API_DOMAIN, 'api.0379.world'),
      GRAFANA_DOMAIN: EnvParser.getString(ENV_KEYS.DOMAIN.GRAFANA_DOMAIN, 'grafana.0379.world'),
      PROMETHEUS_DOMAIN: EnvParser.getString(ENV_KEYS.DOMAIN.PROMETHEUS_DOMAIN, 'prometheus.0379.world'),
    };

    ConfigValidator.validateUrl(`https://${config.API_DOMAIN}`, ENV_KEYS.DOMAIN.API_DOMAIN);
    ConfigValidator.validateUrl(`https://${config.GRAFANA_DOMAIN}`, ENV_KEYS.DOMAIN.GRAFANA_DOMAIN);
    ConfigValidator.validateUrl(`https://${config.PROMETHEUS_DOMAIN}`, ENV_KEYS.DOMAIN.PROMETHEUS_DOMAIN);

    return config;
  }

  /**
   * 加载端口映射配置
   */
  private static loadPortMappingConfig() {
    return {
      POSTGRES_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.POSTGRES_PORT_MAPPING, '5432:5433'),
      REDIS_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.REDIS_PORT_MAPPING, '6379:6379'),
      OLLAMA_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.OLLAMA_PORT_MAPPING, '11435:11435'),
      API_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.API_PORT_MAPPING, '8000:8000'),
      GRAFANA_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.GRAFANA_PORT_MAPPING, '3000:3000'),
      PROMETHEUS_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.PROMETHEUS_PORT_MAPPING, '9090:9090'),
      TRAEFIK_PORT_MAPPING: EnvParser.getString(ENV_KEYS.PORTS.TRAEFIK_PORT_MAPPING, '80:80,443:443,8080:8080'),
    };
  }

  /**
   * 加载 CloudPivot Matrix 配置
   */
  private static loadCloudPivotMatrixConfig() {
    const config = {
      CLOUDPIVOT_MATRIX_PORT: EnvParser.getNumber(ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_PORT, 3118),
      CLOUDPIVOT_MATRIX_WS_PORT: EnvParser.getNumber(ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_WS_PORT, 3113),
      CLOUDPIVOT_MATRIX_HOST: EnvParser.getString(ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_HOST, '192.168.3.22'),
    };

    ConfigValidator.validatePort(config.CLOUDPIVOT_MATRIX_PORT, ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_PORT);
    ConfigValidator.validatePort(config.CLOUDPIVOT_MATRIX_WS_PORT, ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_WS_PORT);
    ConfigValidator.validateIP(config.CLOUDPIVOT_MATRIX_HOST, ENV_KEYS.CLOUDPIVOT.CLOUDPIVOT_MATRIX_HOST);

    return config;
  }

  /**
   * 加载缓存配置
   */
  private static loadCacheConfig() {
    return {
      CACHE_ENABLED: EnvParser.getBoolean(ENV_KEYS.CACHE.CACHE_ENABLED, true),
      CACHE_TTL: EnvParser.getNumber(ENV_KEYS.CACHE.CACHE_TTL, 3600),
      CACHE_MAX_SIZE: EnvParser.getNumber(ENV_KEYS.CACHE.CACHE_MAX_SIZE, 1000),
    };
  }

  /**
   * 加载速率限制配置
   */
  private static loadRateLimitConfig() {
    return {
      RATE_LIMIT_ENABLED: EnvParser.getBoolean(ENV_KEYS.RATE_LIMIT.RATE_LIMIT_ENABLED, true),
      RATE_LIMIT_REQUESTS: EnvParser.getNumber(ENV_KEYS.RATE_LIMIT.RATE_LIMIT_REQUESTS, 100),
      RATE_LIMIT_WINDOW: EnvParser.getNumber(ENV_KEYS.RATE_LIMIT.RATE_LIMIT_WINDOW, 60),
    };
  }

  /**
   * 加载 SSL 配置
   */
  private static loadSSLConfig() {
    const config = {
      SSL_ENABLED: EnvParser.getBoolean(ENV_KEYS.SSL.SSL_ENABLED, true),
      SSL_CERT_PATH: EnvParser.getString(ENV_KEYS.SSL.SSL_CERT_PATH, '/etc/ssl/certs/api.0379.world.crt'),
      SSL_KEY_PATH: EnvParser.getString(ENV_KEYS.SSL.SSL_KEY_PATH, '/etc/ssl/private/api.0379.world.key'),
    };

    ConfigValidator.validateFilePath(config.SSL_CERT_PATH, ENV_KEYS.SSL.SSL_CERT_PATH);
    ConfigValidator.validateFilePath(config.SSL_KEY_PATH, ENV_KEYS.SSL.SSL_KEY_PATH);

    return config;
  }

  /**
   * 加载安全配置
   */
  private static loadSecurityConfig() {
    return {
      CORS_ENABLED: EnvParser.getBoolean(ENV_KEYS.SECURITY.CORS_ENABLED, true),
      CORS_ORIGINS: EnvParser.getString(ENV_KEYS.SECURITY.CORS_ORIGINS, 'https://0379.world,https://api.0379.world'),
      CORS_METHODS: EnvParser.getString(ENV_KEYS.SECURITY.CORS_METHODS, 'GET,POST,PUT,DELETE,OPTIONS'),
      CORS_HEADERS: EnvParser.getString(ENV_KEYS.SECURITY.CORS_HEADERS, 'Content-Type,Authorization'),
      ENABLE_CSP: EnvParser.getBoolean(ENV_KEYS.SECURITY.ENABLE_CSP, true),
      ENABLE_XSS_PROTECTION: EnvParser.getBoolean(ENV_KEYS.SECURITY.ENABLE_XSS_PROTECTION, true),
    };
  }

  /**
   * 加载备份配置
   */
  private static loadBackupConfig() {
    const config = {
      BACKUP_ENABLED: EnvParser.getBoolean(ENV_KEYS.BACKUP.BACKUP_ENABLED, true),
      BACKUP_SCHEDULE: EnvParser.getString(ENV_KEYS.BACKUP.BACKUP_SCHEDULE, '0 2 * * *'),
      BACKUP_RETENTION_DAYS: EnvParser.getNumber(ENV_KEYS.BACKUP.BACKUP_RETENTION_DAYS, 30),
      BACKUP_PATH: EnvParser.getString(ENV_KEYS.BACKUP.BACKUP_PATH, '/Users/yanyu/nfs_vpn_mount/backup'),
    };

    ConfigValidator.validateCron(config.BACKUP_SCHEDULE, ENV_KEYS.BACKUP.BACKUP_SCHEDULE);
    ConfigValidator.validateFilePath(config.BACKUP_PATH, ENV_KEYS.BACKUP.BACKUP_PATH);

    return config;
  }

  /**
   * 加载 NFS 配置
   */
  private static loadNFSConfig() {
    const config = {
      NFS_HOST: EnvParser.getString(ENV_KEYS.NFS.NFS_HOST, '192.168.3.45'),
      NFS_PATH: EnvParser.getString(ENV_KEYS.NFS.NFS_PATH, '/Volume2/yyc3-33'),
      NFS_MOUNT_POINT: EnvParser.getString(ENV_KEYS.NFS.NFS_MOUNT_POINT, '/Users/yanyu/nfs_vpn_mount'),
    };

    ConfigValidator.validateIP(config.NFS_HOST, ENV_KEYS.NFS.NFS_HOST);
    ConfigValidator.validateFilePath(config.NFS_PATH, ENV_KEYS.NFS.NFS_PATH);
    ConfigValidator.validateFilePath(config.NFS_MOUNT_POINT, ENV_KEYS.NFS.NFS_MOUNT_POINT);

    return config;
  }

  /**
   * 加载健康检查配置
   */
  private static loadHealthCheckConfig() {
    return {
      HEALTH_CHECK_ENABLED: EnvParser.getBoolean(ENV_KEYS.HEALTH_CHECK.HEALTH_CHECK_ENABLED, true),
      HEALTH_CHECK_INTERVAL: EnvParser.getNumber(ENV_KEYS.HEALTH_CHECK.HEALTH_CHECK_INTERVAL, 30),
      HEALTH_CHECK_TIMEOUT: EnvParser.getNumber(ENV_KEYS.HEALTH_CHECK.HEALTH_CHECK_TIMEOUT, 10),
      HEALTH_CHECK_RETRIES: EnvParser.getNumber(ENV_KEYS.HEALTH_CHECK.HEALTH_CHECK_RETRIES, 3),
    };
  }

  /**
   * 加载开发工具配置
   */
  private static loadDevToolsConfig() {
    return {
      HOT_RELOAD: EnvParser.getBoolean(ENV_KEYS.DEV_TOOLS.HOT_RELOAD, true),
      AUTO_RESTART: EnvParser.getBoolean(ENV_KEYS.DEV_TOOLS.AUTO_RESTART, true),
      DEBUG_MODE: EnvParser.getBoolean(ENV_KEYS.DEV_TOOLS.DEBUG_MODE, false),
      VERBOSE_LOGGING: EnvParser.getBoolean(ENV_KEYS.DEV_TOOLS.VERBOSE_LOGGING, false),
      PROFILING_ENABLED: EnvParser.getBoolean(ENV_KEYS.DEV_TOOLS.PROFILING_ENABLED, false),
    };
  }
}

/**
 * 导出配置实例
 */
export const config = ConfigLoader.getInstance();
