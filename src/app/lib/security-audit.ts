/**
 * security-audit.ts
 * ==================
 * 安全审计日志系统 - 记录和监控安全事件
 * 
 * 功能:
 * - 安全事件记录 - 记录所有安全相关事件
 * - 异常检测 - 自动检测可疑行为
 * - 审计报告 - 生成安全审计报告
 * - 实时告警 - 安全事件实时通知
 */

import { useCallback } from "react";

export enum SecurityEventType {
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  CSRF_TOKEN_MISMATCH = "CSRF_TOKEN_MISMATCH",
  XSS_ATTEMPT = "XSS_ATTEMPT",
  SQL_INJECTION_ATTEMPT = "SQL_INJECTION_ATTEMPT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  DATA_BREACH_ATTEMPT = "DATA_BREACH_ATTEMPT",
  MALICIOUS_REQUEST = "MALICIOUS_REQUEST",
  SESSION_HIJACK_ATTEMPT = "SESSION_HIJACK_ATTEMPT",
}

export enum SecuritySeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  timestamp: number;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface SecurityAuditConfig {
  enableLogging: boolean;
  enableAlerts: boolean;
  alertThresholds: {
    loginFailures: number;
    suspiciousActivities: number;
    rateLimitViolations: number;
  };
  retentionDays: number;
}

class SecurityAuditLogger {
  private events: SecurityEvent[] = [];
  private config: SecurityAuditConfig;
  private alertCallbacks: Array<(event: SecurityEvent) => void> = [];

  constructor(config: Partial<SecurityAuditConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableAlerts: true,
      alertThresholds: {
        loginFailures: 5,
        suspiciousActivities: 3,
        rateLimitViolations: 10,
      },
      retentionDays: 90,
      ...config,
    };
  }

  logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      severity,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details,
      metadata,
    };

    if (this.config.enableLogging) {
      this.events.push(event);
      this.persistEvent(event);
      this.checkAlertConditions(event);
    }

    return event;
  }

  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentUserId(): string | undefined {
    try {
      const session = localStorage.getItem("yyc3_session");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.user?.id;
      }
    } catch {
      return undefined;
    }
    return undefined;
  }

  private getClientIP(): string {
    return "unknown";
  }

  private persistEvent(event: SecurityEvent): void {
    try {
      const stored = localStorage.getItem("security_audit_log");
      const logs: SecurityEvent[] = stored ? JSON.parse(stored) : [];
      logs.push(event);

      const cutoffTime = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
      const filteredLogs = logs.filter((log) => log.timestamp > cutoffTime);

      localStorage.setItem("security_audit_log", JSON.stringify(filteredLogs));
    } catch (error) {
      console.error("Failed to persist security event:", error);
    }
  }

  private checkAlertConditions(event: SecurityEvent): void {
    if (!this.config.enableAlerts) {return;}

    const recentEvents = this.getRecentEvents(3600000);

    switch (event.type) {
      case SecurityEventType.LOGIN_FAILURE: {
        const loginFailures = recentEvents.filter(
          (e) => e.type === SecurityEventType.LOGIN_FAILURE
        ).length;
        if (loginFailures >= this.config.alertThresholds.loginFailures) {
          this.triggerAlert({
            ...event,
            severity: SecuritySeverity.WARNING,
            details: {
              ...event.details,
              message: `Multiple login failures detected: ${loginFailures} in the last hour`,
            },
          });
        }
        break;
      }

      case SecurityEventType.SUSPICIOUS_ACTIVITY: {
        const suspiciousActivities = recentEvents.filter(
          (e) => e.type === SecurityEventType.SUSPICIOUS_ACTIVITY
        ).length;
        if (suspiciousActivities >= this.config.alertThresholds.suspiciousActivities) {
          this.triggerAlert({
            ...event,
            severity: SecuritySeverity.CRITICAL,
            details: {
              ...event.details,
              message: `Multiple suspicious activities detected: ${suspiciousActivities} in the last hour`,
            },
          });
        }
        break;
      }

      case SecurityEventType.RATE_LIMIT_EXCEEDED: {
        const rateLimitViolations = recentEvents.filter(
          (e) => e.type === SecurityEventType.RATE_LIMIT_EXCEEDED
        ).length;
        if (rateLimitViolations >= this.config.alertThresholds.rateLimitViolations) {
          this.triggerAlert({
            ...event,
            severity: SecuritySeverity.ERROR,
            details: {
              ...event.details,
              message: `Rate limit violations exceeded: ${rateLimitViolations} in the last hour`,
            },
          });
        }
        break;
      }
    }

    if (event.severity === SecuritySeverity.CRITICAL) {
      this.triggerAlert(event);
    }
  }

  private triggerAlert(event: SecurityEvent): void {
    console.warn("[Security Alert]", event);
    this.alertCallbacks.forEach((callback) => callback(event));
  }

  onAlert(callback: (event: SecurityEvent) => void): () => void {
    this.alertCallbacks.push(callback);
    return () => {
      this.alertCallbacks = this.alertCallbacks.filter((cb) => cb !== callback);
    };
  }

  getRecentEvents(timeWindowMs: number = 3600000): SecurityEvent[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.events.filter((event) => event.timestamp > cutoff);
  }

  getEventsByType(type: SecurityEventType): SecurityEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  getEventsBySeverity(severity: SecuritySeverity): SecurityEvent[] {
    return this.events.filter((event) => event.severity === severity);
  }

  generateAuditReport(startDate: Date, endDate: Date): {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecuritySeverity, number>;
    topUsers: Array<{ userId: string; eventCount: number }>;
    recommendations: string[];
  } {
    const filteredEvents = this.events.filter(
      (event) => event.timestamp >= startDate.getTime() && event.timestamp <= endDate.getTime()
    );

    const eventsByType = {} as Record<SecurityEventType, number>;
    const eventsBySeverity = {} as Record<SecuritySeverity, number>;
    const userEventCounts: Record<string, number> = {};

    filteredEvents.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

      if (event.userId) {
        userEventCounts[event.userId] = (userEventCounts[event.userId] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userEventCounts)
      .map(([userId, eventCount]) => ({ userId, eventCount }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);

    const recommendations = this.generateRecommendations(eventsByType, eventsBySeverity);

    return {
      totalEvents: filteredEvents.length,
      eventsByType,
      eventsBySeverity,
      topUsers,
      recommendations,
    };
  }

  private generateRecommendations(
    eventsByType: Record<SecurityEventType, number>,
    eventsBySeverity: Record<SecuritySeverity, number>
  ): string[] {
    const recommendations: string[] = [];

    if (eventsByType[SecurityEventType.LOGIN_FAILURE] > 10) {
      recommendations.push("Consider implementing account lockout after multiple failed login attempts");
    }

    if (eventsByType[SecurityEventType.XSS_ATTEMPT] > 0) {
      recommendations.push("Review and strengthen XSS protection measures");
    }

    if (eventsByType[SecurityEventType.SQL_INJECTION_ATTEMPT] > 0) {
      recommendations.push("Implement parameterized queries and input validation");
    }

    if (eventsBySeverity[SecuritySeverity.CRITICAL] > 0) {
      recommendations.push("Immediate attention required for critical security events");
    }

    if (eventsByType[SecurityEventType.RATE_LIMIT_EXCEEDED] > 50) {
      recommendations.push("Consider implementing more aggressive rate limiting");
    }

    return recommendations;
  }

  clearOldEvents(): void {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    this.events = this.events.filter((event) => event.timestamp > cutoff);
  }
}

export const securityAuditLogger = new SecurityAuditLogger();

export function useSecurityAudit() {
  const logSecurityEvent = useCallback(
    (type: SecurityEventType, severity: SecuritySeverity, details: Record<string, any>) => {
      return securityAuditLogger.logEvent(type, severity, details);
    },
    []
  );

  const getRecentEvents = useCallback((timeWindowMs?: number) => {
    return securityAuditLogger.getRecentEvents(timeWindowMs);
  }, []);

  const generateReport = useCallback((startDate: Date, endDate: Date) => {
    return securityAuditLogger.generateAuditReport(startDate, endDate);
  }, []);

  return {
    logSecurityEvent,
    getRecentEvents,
    generateReport,
    SecurityEventType,
    SecuritySeverity,
  };
}
