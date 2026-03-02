export interface PerformanceMetrics {
  FCP?: number;
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
}

export interface QueryPerformance {
  query: string;
  duration: number;
  timestamp: number;
}

const QUERY_PERFORMANCE_KEY = 'yyc3_cpim_query_performance';
const MAX_QUERY_HISTORY = 100;

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private queryHistory: QueryPerformance[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    try {
      this.observeFCP();
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeTTFB();
      this.loadQueryHistory();
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to initialize:', error);
    }
  }

  private logMetric(metricName: string, value: number) {
    console.info(`[Performance] ${metricName}: ${value}ms`);
  }

  private observeFCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        this.metrics.FCP = entries[0].startTime;
        this.logMetric('FCP', this.metrics.FCP);
      }
    });
    observer.observe({ entryTypes: ['paint'] });
  }

  private observeLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        this.metrics.LCP = entries[entries.length - 1].startTime;
        this.logMetric('LCP', this.metrics.LCP);
      }
    });
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }

  private observeFID() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        this.metrics.FID = entries[0].startTime;
        this.logMetric('FID', this.metrics.FID);
      }
    });
    observer.observe({ entryTypes: ['first-input'] });
  }

  private observeCLS() {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shiftEntry = entry as unknown as { hadRecentInput: boolean; value: number };
        if (!shiftEntry.hadRecentInput) {
          clsValue += shiftEntry.value;
        }
      }
      this.metrics.CLS = clsValue;
      console.info(`[Performance] CLS: ${this.metrics.CLS}`);
    });
    observer.observe({ entryTypes: ['layout-shift'] });
  }

  private observeTTFB() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.TTFB = navigation.responseStart - navigation.requestStart;
      console.info(`[Performance] TTFB: ${this.metrics.TTFB}ms`);
    }
  }

  public recordQuery(query: string, duration: number) {
    const record: QueryPerformance = {
      query,
      duration,
      timestamp: Date.now(),
    };

    this.queryHistory.unshift(record);
    if (this.queryHistory.length > MAX_QUERY_HISTORY) {
      this.queryHistory = this.queryHistory.slice(0, MAX_QUERY_HISTORY);
    }

    try {
      localStorage.setItem(QUERY_PERFORMANCE_KEY, JSON.stringify(this.queryHistory));
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to save query history:', error);
    }

    console.info(`[Performance] Query: ${query} (${duration}ms)`);
  }

  private loadQueryHistory() {
    try {
      const stored = localStorage.getItem(QUERY_PERFORMANCE_KEY);
      if (stored) {
        this.queryHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to load query history:', error);
    }
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getQueryHistory(): QueryPerformance[] {
    return [...this.queryHistory];
  }

  public getSlowQueries(threshold: number = 1000): QueryPerformance[] {
    return this.queryHistory.filter(q => q.duration > threshold);
  }

  public getAverageQueryDuration(): number {
    if (this.queryHistory.length === 0) {return 0;}
    const total = this.queryHistory.reduce((sum, q) => sum + q.duration, 0);
    return total / this.queryHistory.length;
  }

  public clearQueryHistory() {
    this.queryHistory = [];
    try {
      localStorage.removeItem(QUERY_PERFORMANCE_KEY);
    } catch (error) {
      console.error('[PerformanceMonitor] Failed to clear query history:', error);
    }
  }

  public checkBudget(budget: PerformanceMetrics): boolean {
    const violations: string[] = [];

    if (budget.FCP && this.metrics.FCP && this.metrics.FCP > budget.FCP) {
      violations.push(`FCP 超标: ${this.metrics.FCP}ms > ${budget.FCP}ms`);
    }
    if (budget.LCP && this.metrics.LCP && this.metrics.LCP > budget.LCP) {
      violations.push(`LCP 超标: ${this.metrics.LCP}ms > ${budget.LCP}ms`);
    }
    if (budget.FID && this.metrics.FID && this.metrics.FID > budget.FID) {
      violations.push(`FID 超标: ${this.metrics.FID}ms > ${budget.FID}ms`);
    }
    if (budget.CLS && this.metrics.CLS && this.metrics.CLS > budget.CLS) {
      violations.push(`CLS 超标: ${this.metrics.CLS} > ${budget.CLS}`);
    }
    if (budget.TTFB && this.metrics.TTFB && this.metrics.TTFB > budget.TTFB) {
      violations.push(`TTFB 超标: ${this.metrics.TTFB}ms > ${budget.TTFB}ms`);
    }

    if (violations.length > 0) {
      console.warn('[PerformanceMonitor] Budget violations:', violations);
      return false;
    }

    return true;
  }
}

export const performanceMonitor = new PerformanceMonitor();

export const PERFORMANCE_BUDGET: PerformanceMetrics = {
  FCP: 1800,
  LCP: 2500,
  FID: 100,
  CLS: 0.1,
  TTFB: 600,
};
