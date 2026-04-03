/**
 * @file encryption-service.ts
 * @description YYC³ 数据加密服务，基于 Web Crypto API 的数据加密/解密
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-04-01
 * @updated 2026-04-01
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags encryption,security,crypto,web-crypto-api
 */

/**
 * 加密配置
 */
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
  pbkdf2Iterations: 100000,
} as const;

/**
 * 加密结果接口
 */
export interface EncryptedData {
  encrypted: string;
  salt: string;
  iv: string;
  algorithm: string;
  keyLength: number;
}

/**
 * 密钥存储接口
 */
export interface KeyStorage {
  masterKey: string;
  derivedKeys: Map<string, CryptoKey>;
}

/**
 * 加密服务类
 */
export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private keyCache: Map<string, CryptoKey> = new Map();
  private storageKey = 'yyc3_encryption_master_key';

  private constructor() {
    this.loadMasterKey();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * 从密码派生密钥
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const saltBuffer = salt.buffer.slice(
      salt.byteOffset,
      salt.byteOffset + salt.byteLength
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        // eslint-disable-next-line no-undef
        salt: saltBuffer as unknown as BufferSource,
        iterations: ENCRYPTION_CONFIG.pbkdf2Iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength,
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 生成随机盐值
   */
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
  }

  /**
   * 生成随机 IV
   */
  private generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
  }

  /**
   * 加密数据
   */
  async encrypt(
    data: string,
    password?: string
  ): Promise<EncryptedData> {
    const salt = this.generateSalt();
    const iv = this.generateIV();
    const encoder = new TextEncoder();

    let key: CryptoKey;

    if (password) {
      key = await this.deriveKey(password, salt);
    } else if (this.masterKey) {
      key = this.masterKey;
    } else {
      throw new Error('No encryption key available');
    }

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        // eslint-disable-next-line no-undef
        iv: iv as unknown as BufferSource,
      },
      key,
      encoder.encode(data)
    );

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength,
    };
  }

  /**
   * 解密数据
   */
  async decrypt(
    encryptedData: EncryptedData,
    password?: string
  ): Promise<string> {
    const saltArray = Uint8Array.from(atob(encryptedData.salt), (c) =>
      c.charCodeAt(0)
    );
    const ivArray = Uint8Array.from(atob(encryptedData.iv), (c) =>
      c.charCodeAt(0)
    );
    const encryptedArray = Uint8Array.from(atob(encryptedData.encrypted), (c) =>
      c.charCodeAt(0)
    );

    let key: CryptoKey;

    if (password) {
      key = await this.deriveKey(password, saltArray);
    } else if (this.masterKey) {
      key = this.masterKey;
    } else {
      throw new Error('No encryption key available');
    }

    const decrypted = await crypto.subtle.decrypt(
      {
        name: encryptedData.algorithm,
        iv: ivArray,
      },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * 加密对象
   */
  async encryptObject<T>(
    obj: T,
    password?: string
  ): Promise<EncryptedData> {
    const json = JSON.stringify(obj);
    return this.encrypt(json, password);
  }

  /**
   * 解密对象
   */
  async decryptObject<T>(
    encryptedData: EncryptedData,
    password?: string
  ): Promise<T> {
    const json = await this.decrypt(encryptedData, password);
    return JSON.parse(json) as T;
  }

  /**
   * 生成主密钥
   */
  async generateMasterKey(): Promise<void> {
    const key = await crypto.subtle.generateKey(
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength,
      },
      true,
      ['encrypt', 'decrypt']
    );

    this.masterKey = key;
    await this.saveMasterKey(key);
  }

  /**
   * 保存主密钥
   */
  private async saveMasterKey(key: CryptoKey): Promise<void> {
    const exported = await crypto.subtle.exportKey('raw', key);
    const exportedArray = new Uint8Array(exported);
    const exportedBase64 = btoa(
      String.fromCharCode(...exportedArray)
    );

    localStorage.setItem(this.storageKey, exportedBase64);
  }

  /**
   * 加载主密钥
   */
  private async loadMasterKey(): Promise<void> {
    const exportedBase64 = localStorage.getItem(this.storageKey);

    if (!exportedBase64) {
      return;
    }

    try {
      const exportedArray = Uint8Array.from(atob(exportedBase64), (c) =>
        c.charCodeAt(0)
      );

      const key = await crypto.subtle.importKey(
        'raw',
        exportedArray,
        ENCRYPTION_CONFIG.algorithm,
        true,
        ['encrypt', 'decrypt']
      );

      this.masterKey = key;
    } catch (error) {
      console.error('Failed to load master key:', error);
    }
  }

  /**
   * 清除主密钥
   */
  clearMasterKey(): void {
    this.masterKey = null;
    localStorage.removeItem(this.storageKey);
    this.keyCache.clear();
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.masterKey !== null;
  }

  /**
   * 生成随机密码
   */
  generateRandomPassword(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }

    return password;
  }

  /**
   * 计算数据哈希
   */
  async hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest(
      'SHA-256',
      encoder.encode(data)
    );
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = Array.from(hashArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hashHex;
  }

  /**
   * 验证数据完整性
   */
  async verifyIntegrity(
    data: string,
    expectedHash: string
  ): Promise<boolean> {
    const actualHash = await this.hash(data);
    return actualHash === expectedHash;
  }

  /**
   * 批量加密
   */
  async encryptBatch<T>(
    items: T[],
    password?: string
  ): Promise<EncryptedData[]> {
    const promises = items.map((item) =>
      this.encryptObject(item, password)
    );
    return Promise.all(promises);
  }

  /**
   * 批量解密
   */
  async decryptBatch<T>(
    encryptedItems: EncryptedData[],
    password?: string
  ): Promise<T[]> {
    const promises = encryptedItems.map((item) =>
      this.decryptObject<T>(item, password)
    );
    return Promise.all(promises);
  }
}

/**
 * 导出单例实例
 */
export const encryptionService = EncryptionService.getInstance();

/**
 * 便捷函数：加密数据
 */
export async function encryptData(
  data: string,
  password?: string
): Promise<EncryptedData> {
  return encryptionService.encrypt(data, password);
}

/**
 * 便捷函数：解密数据
 */
export async function decryptData(
  encryptedData: EncryptedData,
  password?: string
): Promise<string> {
  return encryptionService.decrypt(encryptedData, password);
}

/**
 * 便捷函数：加密对象
 */
export async function encryptObject<T>(
  obj: T,
  password?: string
): Promise<EncryptedData> {
  return encryptionService.encryptObject(obj, password);
}

/**
 * 便捷函数：解密对象
 */
export async function decryptObject<T>(
  encryptedData: EncryptedData,
  password?: string
): Promise<T> {
  return encryptionService.decryptObject<T>(encryptedData, password);
}
