export interface IntrusionAlert {
  id: string;
  timestamp: number;
  type: 'rate_limit' | 'failed_login' | 'sql_injection' | 'xss_attempt' | 'unusual_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: string;
  resolved: boolean;
}

export interface ActivityPattern {
  userId: string;
  timestamp: number;
  action: string;
  target: string;
  ip?: string;
  userAgent?: string;
}

const ALERTS_KEY = 'yyc3_cpim_intrusion_alerts';
const ACTIVITY_KEY = 'yyc3_cpim_activity_patterns';
const MAX_ALERTS = 100;
const MAX_ACTIVITIES = 500;

export class IntrusionDetection {
  private alerts: IntrusionAlert[] = [];
  private activities: ActivityPattern[] = [];
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private failedLoginMap = new Map<string, { count: number; resetTime: number }>();

  constructor() {
    this.loadData();
    this.startMonitoring();
  }

  private loadData() {
    try {
      const storedAlerts = localStorage.getItem(ALERTS_KEY);
      const storedActivities = localStorage.getItem(ACTIVITY_KEY);

      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      }
      if (storedActivities) {
        this.activities = JSON.parse(storedActivities);
      }
    } catch (error) {
      console.error('[IntrusionDetection] Failed to load data:', error);
    }
  }

  private saveData() {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(this.alerts));
      localStorage.setItem(ACTIVITY_KEY, JSON.stringify(this.activities));
    } catch (error) {
      console.error('[IntrusionDetection] Failed to save data:', error);
    }
  }

  private startMonitoring() {
    setInterval(() => {
      this.cleanupOldData();
      this.checkRateLimits();
    }, 60000);

    window.addEventListener('error', (event) => {
      this.detectXSSAttempt(event.message || '');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.detectUnusualActivity(String(event.reason));
    });
  }

  private cleanupOldData() {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    this.alerts = this.alerts.filter(alert => alert.timestamp > thirtyDaysAgo);
    this.activities = this.activities.filter(activity => activity.timestamp > thirtyDaysAgo);

    this.saveData();
  }

  private checkRateLimits() {
    const now = Date.now();

    for (const [key, data] of this.rateLimitMap.entries()) {
      if (now > data.resetTime) {
        this.rateLimitMap.delete(key);
      }
    }

    for (const [key, data] of this.failedLoginMap.entries()) {
      if (now > data.resetTime) {
        this.failedLoginMap.delete(key);
      }
    }
  }

  public recordActivity(activity: ActivityPattern) {
    this.activities.unshift(activity);

    if (this.activities.length > MAX_ACTIVITIES) {
      this.activities = this.activities.slice(0, MAX_ACTIVITIES);
    }

    this.detectAnomalousPattern(activity);
    this.saveData();
  }

  public checkRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const data = this.rateLimitMap.get(identifier);

    if (!data || now > data.resetTime) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (data.count >= maxRequests) {
      this.createAlert({
        type: 'rate_limit',
        severity: 'medium',
        source: identifier,
        details: `超过速率限制: ${data.count}/${maxRequests} 请求`,
      });
      return false;
    }

    data.count++;
    return true;
  }

  public recordFailedLogin(identifier: string): void {
    const now = Date.now();
    const data = this.failedLoginMap.get(identifier);

    if (!data || now > data.resetTime) {
      this.failedLoginMap.set(identifier, {
        count: 1,
        resetTime: now + (15 * 60 * 1000),
      });
      return;
    }

    data.count++;

    if (data.count >= 5) {
      this.createAlert({
        type: 'failed_login',
        severity: 'high',
        source: identifier,
        details: `多次登录失败: ${data.count} 次`,
      });
    }
  }

  public detectSQLInjection(input: string): boolean {
    const sqlPatterns = [
      /(OR|AND)\s+\d+\s*=\s*\d+/i,
      /(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)/i,
      /(--|\/\*|\*\/|;|')/i,
      /(EXEC|EXECUTE|xp_cmdshell)\s/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        this.createAlert({
          type: 'sql_injection',
          severity: 'critical',
          source: 'input_validation',
          details: `检测到 SQL 注入尝试: ${input.substring(0, 50)}...`,
        });
        return true;
      }
    }

    return false;
  }

  private detectXSSAttempt(message: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(message)) {
        this.createAlert({
          type: 'xss_attempt',
          severity: 'high',
          source: 'error_monitoring',
          details: `检测到 XSS 尝试: ${message.substring(0, 50)}...`,
        });
        return true;
      }
    }

    return false;
  }

  private detectAnomalousPattern(activity: ActivityPattern): void {
    const userActivities = this.activities.filter(a => a.userId === activity.userId);

    if (userActivities.length < 10) {
      return;
    }

    const recentHourActivities = userActivities.filter(
      a => Date.now() - a.timestamp < 60 * 60 * 1000
    );

    if (recentHourActivities.length > 100) {
      this.createAlert({
        type: 'unusual_activity',
        severity: 'medium',
        source: activity.userId,
        details: `用户 ${activity.userId} 在一小时内执行了 ${recentHourActivities.length} 次操作`,
      });
    }

    const uniqueTargets = new Set(userActivities.map(a => a.target));
    if (uniqueTargets.size > 20) {
      this.createAlert({
        type: 'unusual_activity',
        severity: 'low',
        source: activity.userId,
        details: `用户 ${activity.userId} 访问了过多不同资源: ${uniqueTargets.size} 个`,
      });
    }
  }

  private detectUnusualActivity(reason: string): void {
    const errorKeywords = ['injection', 'xss', 'csrf', 'unauthorized', 'forbidden'];

    for (const keyword of errorKeywords) {
      if (reason.toLowerCase().includes(keyword)) {
        this.createAlert({
          type: 'unusual_activity',
          severity: 'medium',
          source: 'error_monitoring',
          details: `检测到异常错误模式: ${reason.substring(0, 100)}...`,
        });
        return;
      }
    }
  }

  private createAlert(alert: Omit<IntrusionAlert, 'id' | 'timestamp' | 'resolved'>) {
    const newAlert: IntrusionAlert = {
      ...alert,
      id: `intrusion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.unshift(newAlert);

    if (this.alerts.length > MAX_ALERTS) {
      this.alerts = this.alerts.slice(0, MAX_ALERTS);
    }

    this.saveData();
    console.warn(`[IntrusionDetection] New alert: ${alert.type} - ${alert.details}`);
  }

  public getAlerts(severity?: IntrusionAlert['severity']): IntrusionAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return this.alerts;
  }

  public getUnresolvedAlerts(): IntrusionAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.saveData();
    }
  }

  public getActivityByUser(userId: string): ActivityPattern[] {
    return this.activities.filter(activity => activity.userId === userId);
  }

  public getStatistics() {
    const total = this.alerts.length;
    const resolved = this.alerts.filter(a => a.resolved).length;
    const unresolved = total - resolved;

    const byType = this.alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      resolved,
      unresolved,
      byType,
      bySeverity,
    };
  }

  public clearAlerts(): void {
    this.alerts = [];
    this.activities = [];
    this.saveData();
  }
}

export const intrusionDetection = new IntrusionDetection();
