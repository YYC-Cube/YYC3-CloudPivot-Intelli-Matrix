/**
 * @file: env.config.ts
 * @description: 环境变量配置类型定义
 * @author: YYC³ Team
 * @version: v1.0.0
 * @created: 2026-03-26
 */

/**
 * 应用配置
 */
export interface AppConfig {
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;
  DEFAULT_THEME: string;
  DEFAULT_LANGUAGE: string;
}

/**
 * 功能开关配置
 */
export interface FeatureFlags {
  ENABLE_GHOST_MODE: boolean;
  ENABLE_PWA: boolean;
  ENABLE_AI_ASSISTANT: boolean;
  DEV_MODE: boolean;
  DEBUG_MODE: boolean;
}

/**
 * API 配置
 */
export interface ApiConfig {
  API_BASE_URL: string;
  API_PROXY_BASE_URL: string;
  API_PROXY_TIMEOUT: number;
  API_PROXY_VERSION: string;
  API_HOST: string;
  API_PORT: number;
  API_WORKERS: number;
  API_DEBUG: boolean;
  API_LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * WebSocket 配置
 */
export interface WebSocketConfig {
  WS_URL: string;
  WS_RECONNECT_INTERVAL: number;
  WS_MAX_RECONNECT_ATTEMPTS: number;
  WS_HEARTBEAT_INTERVAL: number;
}

/**
 * 日志配置
 */
export interface LoggingConfig {
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  POSTGRES_PASSWORD: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

/**
 * Redis 配置
 */
export interface RedisConfig {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_DB: number;
  REDIS_PASSWORD: string;
}

/**
 * AI 模型配置
 */
export interface AIModelConfig {
  OPENAI_API_KEY: string;
  ZHIPU_API_KEY: string;
  OLLAMA_HOST: string;
  OLLAMA_PORT: number;
  OLLAMA_MODELS_PATH: string;
}

/**
 * 网络配置
 */
export interface NetworkConfig {
  HOST_IP: string;
  HOST_IP_SUFFIX: number;
}

/**
 * 监控配置
 */
export interface MonitoringConfig {
  PROMETHEUS_MULTIPROC_DIR: string;
  PROMETHEUS_ENABLED: boolean;
  GRAFANA_ENABLED: boolean;
  ALERTMANAGER_ENABLED: boolean;
}

/**
 * MCP 配置
 */
export interface MCPConfig {
  BRAVE_API_KEY: string;
  GITHUB_PERSONAL_ACCESS_TOKEN: string;
}

/**
 * 域名配置
 */
export interface DomainConfig {
  API_DOMAIN: string;
  GRAFANA_DOMAIN: string;
  PROMETHEUS_DOMAIN: string;
}

/**
 * 端口映射配置
 */
export interface PortMappingConfig {
  POSTGRES_PORT_MAPPING: string;
  REDIS_PORT_MAPPING: string;
  OLLAMA_PORT_MAPPING: string;
  API_PORT_MAPPING: string;
  GRAFANA_PORT_MAPPING: string;
  PROMETHEUS_PORT_MAPPING: string;
  TRAEFIK_PORT_MAPPING: string;
}

/**
 * CloudPivot Matrix 配置
 */
export interface CloudPivotMatrixConfig {
  CLOUDPIVOT_MATRIX_PORT: number;
  CLOUDPIVOT_MATRIX_WS_PORT: number;
  CLOUDPIVOT_MATRIX_HOST: string;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  CACHE_ENABLED: boolean;
  CACHE_TTL: number;
  CACHE_MAX_SIZE: number;
}

/**
 * 速率限制配置
 */
export interface RateLimitConfig {
  RATE_LIMIT_ENABLED: boolean;
  RATE_LIMIT_REQUESTS: number;
  RATE_LIMIT_WINDOW: number;
}

/**
 * SSL/TLS 配置
 */
export interface SSLConfig {
  SSL_ENABLED: boolean;
  SSL_CERT_PATH: string;
  SSL_KEY_PATH: string;
}

/**
 * 安全配置
 */
export interface SecurityConfig {
  CORS_ENABLED: boolean;
  CORS_ORIGINS: string;
  CORS_METHODS: string;
  CORS_HEADERS: string;
  ENABLE_CSP: boolean;
  ENABLE_XSS_PROTECTION: boolean;
}

/**
 * 备份配置
 */
export interface BackupConfig {
  BACKUP_ENABLED: boolean;
  BACKUP_SCHEDULE: string;
  BACKUP_RETENTION_DAYS: number;
  BACKUP_PATH: string;
}

/**
 * NFS 挂载配置
 */
export interface NFSConfig {
  NFS_HOST: string;
  NFS_PATH: string;
  NFS_MOUNT_POINT: string;
}

/**
 * 健康检查配置
 */
export interface HealthCheckConfig {
  HEALTH_CHECK_ENABLED: boolean;
  HEALTH_CHECK_INTERVAL: number;
  HEALTH_CHECK_TIMEOUT: number;
  HEALTH_CHECK_RETRIES: number;
}

/**
 * 开发工具配置
 */
export interface DevToolsConfig {
  HOT_RELOAD: boolean;
  AUTO_RESTART: boolean;
  DEBUG_MODE: boolean;
  VERBOSE_LOGGING: boolean;
  PROFILING_ENABLED: boolean;
}

/**
 * 完整配置
 */
export interface Config {
  app: AppConfig;
  features: FeatureFlags;
  api: ApiConfig;
  websocket: WebSocketConfig;
  logging: LoggingConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  ai: AIModelConfig;
  network: NetworkConfig;
  monitoring: MonitoringConfig;
  mcp: MCPConfig;
  domain: DomainConfig;
  ports: PortMappingConfig;
  cloudpivot: CloudPivotMatrixConfig;
  cache: CacheConfig;
  rateLimit: RateLimitConfig;
  ssl: SSLConfig;
  security: SecurityConfig;
  backup: BackupConfig;
  nfs: NFSConfig;
  healthCheck: HealthCheckConfig;
  devTools: DevToolsConfig;
}

/**
 * 环境变量键
 */
export const ENV_KEYS = {
  APP: {
    APP_NAME: 'VITE_APP_NAME',
    APP_VERSION: 'VITE_APP_VERSION',
    APP_URL: 'VITE_APP_URL',
    DEFAULT_THEME: 'VITE_DEFAULT_THEME',
    DEFAULT_LANGUAGE: 'VITE_DEFAULT_LANGUAGE',
  },
  FEATURES: {
    ENABLE_GHOST_MODE: 'VITE_ENABLE_GHOST_MODE',
    ENABLE_PWA: 'VITE_ENABLE_PWA',
    ENABLE_AI_ASSISTANT: 'VITE_ENABLE_AI_ASSISTANT',
    DEV_MODE: 'VITE_DEV_MODE',
    DEBUG_MODE: 'VITE_DEBUG_MODE',
  },
  API: {
    API_BASE_URL: 'VITE_API_BASE_URL',
    API_PROXY_BASE_URL: 'API_PROXY_BASE_URL',
    API_PROXY_TIMEOUT: 'API_PROXY_TIMEOUT',
    API_PROXY_VERSION: 'API_PROXY_VERSION',
    API_HOST: 'API_HOST',
    API_PORT: 'API_PORT',
    API_WORKERS: 'API_WORKERS',
    API_DEBUG: 'API_DEBUG',
    API_LOG_LEVEL: 'API_LOG_LEVEL',
  },
  WEBSOCKET: {
    WS_URL: 'VITE_WS_URL',
    WS_RECONNECT_INTERVAL: 'VITE_WS_RECONNECT_INTERVAL',
    WS_MAX_RECONNECT_ATTEMPTS: 'VITE_WS_MAX_RECONNECT_ATTEMPTS',
    WS_HEARTBEAT_INTERVAL: 'VITE_WS_HEARTBEAT_INTERVAL',
  },
  LOGGING: {
    LOG_LEVEL: 'VITE_LOG_LEVEL',
  },
  DATABASE: {
    POSTGRES_PASSWORD: 'POSTGRES_PASSWORD',
    DB_HOST: 'DB_HOST',
    DB_PORT: 'DB_PORT',
    DB_USER: 'DB_USER',
    DB_PASSWORD: 'DB_PASSWORD',
    DB_NAME: 'DB_NAME',
  },
  REDIS: {
    REDIS_HOST: 'REDIS_HOST',
    REDIS_PORT: 'REDIS_PORT',
    REDIS_DB: 'REDIS_DB',
    REDIS_PASSWORD: 'REDIS_PASSWORD',
  },
  AI: {
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    ZHIPU_API_KEY: 'ZHIPU_API_KEY',
    OLLAMA_HOST: 'OLLAMA_HOST',
    OLLAMA_PORT: 'OLLAMA_PORT',
    OLLAMA_MODELS_PATH: 'OLLAMA_MODELS',
  },
  NETWORK: {
    HOST_IP: 'HOST_IP',
    HOST_IP_SUFFIX: 'HOST_IP_SUFFIX',
  },
  MONITORING: {
    PROMETHEUS_MULTIPROC_DIR: 'PROMETHEUS_MULTIPROC_DIR',
    PROMETHEUS_ENABLED: 'PROMETHEUS_ENABLED',
    GRAFANA_ENABLED: 'GRAFANA_ENABLED',
    ALERTMANAGER_ENABLED: 'ALERTMANAGER_ENABLED',
  },
  MCP: {
    BRAVE_API_KEY: 'BRAVE_API_KEY',
    GITHUB_PERSONAL_ACCESS_TOKEN: 'GITHUB_PERSONAL_ACCESS_TOKEN',
  },
  DOMAIN: {
    API_DOMAIN: 'API_DOMAIN',
    GRAFANA_DOMAIN: 'GRAFANA_DOMAIN',
    PROMETHEUS_DOMAIN: 'PROMETHEUS_DOMAIN',
  },
  PORTS: {
    POSTGRES_PORT_MAPPING: 'POSTGRES_PORT_MAPPING',
    REDIS_PORT_MAPPING: 'REDIS_PORT_MAPPING',
    OLLAMA_PORT_MAPPING: 'OLLAMA_PORT_MAPPING',
    API_PORT_MAPPING: 'API_PORT_MAPPING',
    GRAFANA_PORT_MAPPING: 'GRAFANA_PORT_MAPPING',
    PROMETHEUS_PORT_MAPPING: 'PROMETHEUS_PORT_MAPPING',
    TRAEFIK_PORT_MAPPING: 'TRAEFIK_PORT_MAPPING',
  },
  CLOUDPIVOT: {
    CLOUDPIVOT_MATRIX_PORT: 'CLOUDPIVOT_MATRIX_PORT',
    CLOUDPIVOT_MATRIX_WS_PORT: 'CLOUDPIVOT_MATRIX_WS_PORT',
    CLOUDPIVOT_MATRIX_HOST: 'CLOUDPIVOT_MATRIX_HOST',
  },
  CACHE: {
    CACHE_ENABLED: 'CACHE_ENABLED',
    CACHE_TTL: 'CACHE_TTL',
    CACHE_MAX_SIZE: 'CACHE_MAX_SIZE',
  },
  RATE_LIMIT: {
    RATE_LIMIT_ENABLED: 'RATE_LIMIT_ENABLED',
    RATE_LIMIT_REQUESTS: 'RATE_LIMIT_REQUESTS',
    RATE_LIMIT_WINDOW: 'RATE_LIMIT_WINDOW',
  },
  SSL: {
    SSL_ENABLED: 'SSL_ENABLED',
    SSL_CERT_PATH: 'SSL_CERT_PATH',
    SSL_KEY_PATH: 'SSL_KEY_PATH',
  },
  SECURITY: {
    CORS_ENABLED: 'CORS_ENABLED',
    CORS_ORIGINS: 'CORS_ORIGINS',
    CORS_METHODS: 'CORS_METHODS',
    CORS_HEADERS: 'CORS_HEADERS',
    ENABLE_CSP: 'VITE_ENABLE_CSP',
    ENABLE_XSS_PROTECTION: 'VITE_ENABLE_XSS_PROTECTION',
  },
  BACKUP: {
    BACKUP_ENABLED: 'BACKUP_ENABLED',
    BACKUP_SCHEDULE: 'BACKUP_SCHEDULE',
    BACKUP_RETENTION_DAYS: 'BACKUP_RETENTION_DAYS',
    BACKUP_PATH: 'BACKUP_PATH',
  },
  NFS: {
    NFS_HOST: 'NFS_HOST',
    NFS_PATH: 'NFS_PATH',
    NFS_MOUNT_POINT: 'NFS_MOUNT_POINT',
  },
  HEALTH_CHECK: {
    HEALTH_CHECK_ENABLED: 'HEALTH_CHECK_ENABLED',
    HEALTH_CHECK_INTERVAL: 'HEALTH_CHECK_INTERVAL',
    HEALTH_CHECK_TIMEOUT: 'HEALTH_CHECK_TIMEOUT',
    HEALTH_CHECK_RETRIES: 'HEALTH_CHECK_RETRIES',
  },
  DEV_TOOLS: {
    HOT_RELOAD: 'HOT_RELOAD',
    AUTO_RESTART: 'AUTO_RESTART',
    DEBUG_MODE: 'DEBUG_MODE',
    VERBOSE_LOGGING: 'VERBOSE_LOGGING',
    PROFILING_ENABLED: 'PROFILING_ENABLED',
  },
} as const;
