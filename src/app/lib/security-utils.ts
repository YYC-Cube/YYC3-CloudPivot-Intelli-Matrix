/**
 * security-utils.ts
 * ==================
 * 安全工具集 - XSS 防护、CSRF 保护、输入验证
 * 
 * 功能:
 * - XSS 防护 - HTML 转义和清理
 * - CSRF 保护 - Token 验证
 * - 输入验证 - 数据校验和清理
 * - 安全 Headers - CSP 配置
 */

export class XSSProtection {
  private static readonly HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
    "`": "&#x60;",
    "=": "&#x3D;",
  };

  static escapeHtml(unsafe: string): string {
    return unsafe.replace(/[&<>"'`=/]/g, (char) => this.HTML_ENTITIES[char] || char);
  }

  static unescapeHtml(safe: string): string {
    const reverseEntities: Record<string, string> = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#x27;": "'",
      "&#x2F;": "/",
      "&#x60;": "`",
      "&#x3D;": "=",
    };

    return safe.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (entity) => {
      return reverseEntities[entity] || entity;
    });
  }

  static sanitizeHtml(dirty: string, allowedTags: string[] = []): string {
    let cleaned = this.escapeHtml(dirty);

    if (allowedTags.length > 0) {
      const allowedTagsPattern = allowedTags.join("|");
      const pattern = new RegExp(
        `&lt;(/?(${allowedTagsPattern})(?:\\s+[^&]*)?)&gt;`,
        "gi"
      );
      cleaned = cleaned.replace(pattern, (match) => {
        return this.unescapeHtml(match);
      });
    }

    return cleaned;
  }

  static stripTags(str: string): string {
    return str.replace(/<\/?[^>]+(>|$)/g, "");
  }

  static isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      const allowedProtocols = ["http:", "https:", "mailto:", "tel:"];
      return allowedProtocols.includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  static sanitizeUrl(url: string): string {
    if (this.isValidUrl(url)) {
      return url;
    }
    return "";
  }

  static removeJavaScript(str: string): string {
    return str
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "data-blocked=");
  }
}

export class CSRFProtection {
  private static readonly TOKEN_KEY = "csrf_token";
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  static setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  static init(): string {
    const token = this.generateToken();
    this.setToken(token);
    return token;
  }

  static validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  }

  static addToHeaders(headers: Record<string, string>): Record<string, string> {
    const token = this.getToken();
    if (token) {
      headers["X-CSRF-Token"] = token;
    }
    return headers;
  }

  static addToFormData(formData: FormData): FormData {
    const token = this.getToken();
    if (token) {
      formData.append("csrf_token", token);
    }
    return formData;
  }
}

export class InputValidator {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(phone);
  }

  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static isValidUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  static isValidPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (password.length > 128) {
      errors.push("Password must be less than 128 characters");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeInput(input: string, maxLength: number = 1000): string {
    let sanitized = XSSProtection.escapeHtml(input);
    sanitized = sanitized.trim();
    sanitized = sanitized.substring(0, maxLength);
    return sanitized;
  }

  static sanitizeObject<T extends Record<string, any>>(
    obj: T,
    schema: Partial<Record<keyof T, { maxLength?: number; required?: boolean }>>
  ): { data: Partial<T>; errors: string[] } {
    const errors: string[] = [];
    const data: Partial<T> = {};

    for (const key in schema) {
      const config = schema[key];
      if (!config) {continue;}

      const value = obj[key];

      if (config.required && (value === undefined || value === null || value === "")) {
        errors.push(`${String(key)} is required`);
        continue;
      }

      if (typeof value === "string") {
        data[key] = this.sanitizeInput(value, config.maxLength) as T[keyof T];
      } else {
        data[key] = value;
      }
    }

    return { data, errors };
  }
}

export class ContentSecurityPolicy {
  private static readonly DEFAULT_DIRECTIVES = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "wss:", "https:"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  static generatePolicy(
    customDirectives: Partial<Record<string, string[]>> = {}
  ): string {
    const directives = { ...this.DEFAULT_DIRECTIVES, ...customDirectives };

    return Object.entries(directives)
      .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
      .join("; ");
  }

  static applyToMeta(): void {
    const policy = this.generatePolicy();
    const meta = document.createElement("meta");
    meta.httpEquiv = "Content-Security-Policy";
    meta.content = policy;
    document.head.appendChild(meta);
  }

  static getReportUri(): string {
    return "/api/csp-report";
  }
}

export class SecurityHeaders {
  static getSecurityHeaders(): Record<string, string> {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    };
  }

  static applyToResponse(headers: Headers): void {
    const securityHeaders = this.getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }
}

export function useSecurity() {
  const initCSRF = useCallback(() => {
    if (!CSRFProtection.getToken()) {
      CSRFProtection.init();
    }
  }, []);

  const secureFetch = useCallback(
    async (url: string, options: globalThis.RequestInit = {}): Promise<Response> => {
      const headers = new Headers(options.headers || {});
      const csrfHeaders = CSRFProtection.addToHeaders({});
      Object.entries(csrfHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return fetch(url, {
        ...options,
        headers,
      });
    },
    []
  );

  useEffect(() => {
    initCSRF();
  }, [initCSRF]);

  return {
    escapeHtml: XSSProtection.escapeHtml,
    sanitizeHtml: XSSProtection.sanitizeHtml,
    sanitizeUrl: XSSProtection.sanitizeUrl,
    validateEmail: InputValidator.isValidEmail,
    validatePassword: InputValidator.isValidPassword,
    sanitizeInput: InputValidator.sanitizeInput,
    secureFetch,
  };
}

import { useCallback, useEffect } from "react";
