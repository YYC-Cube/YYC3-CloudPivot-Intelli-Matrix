/**
 * performance-monitor.ts
 * ======================
 * 性能监控工具 - 实时监控应用性能
 * 
 * 功能:
 * - 性能指标收集 - FPS、内存、渲染时间
 * - 性能报告生成 - 详细的性能分析
 * - 性能预警 - 自动检测性能问题
 * - 性能优化建议 - 智能优化建议
 */

export interface PerformanceMetrics {
  fps: number;
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  renderTime: number;
  networkTime: number;
  timestamp: number;
}

export interface PerformanceReport {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  averageRenderTime: number;
  memoryUsage: {
    average: number;
    peak: number;
  };
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private isMonitoring = false;
  private frameCount = 0;
  private lastFrameTime = 0;
  private fpsUpdateInterval: number | null = null;
  private metricsCollectionInterval: number | null = null;

  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameCount = 0;

    this.fpsUpdateInterval = window.setInterval(() => {
      const now = performance.now();
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
      
      this.collectMetrics(fps);
      
      this.frameCount = 0;
      this.lastFrameTime = now;
    }, intervalMs);

    const measureFrame = () => {
      this.frameCount++;
      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };
    requestAnimationFrame(measureFrame);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    
    if (this.fpsUpdateInterval) {
      clearInterval(this.fpsUpdateInterval);
      this.fpsUpdateInterval = null;
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
  }

  private collectMetrics(fps: number): void {
    const memory = this.getMemoryInfo();
    const renderTime = this.measureRenderTime();
    const networkTime = this.measureNetworkTime();

    const metric: PerformanceMetrics = {
      fps,
      memory,
      renderTime,
      networkTime,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  private getMemoryInfo(): PerformanceMetrics["memory"] {
    const performanceMemory = (performance as any).memory;
    if (!performanceMemory) {
      return null;
    }

    return {
      usedJSHeapSize: performanceMemory.usedJSHeapSize,
      totalJSHeapSize: performanceMemory.totalJSHeapSize,
      jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
    };
  }

  private measureRenderTime(): number {
    const entries = performance.getEntriesByType("measure");
    const lastEntry = entries[entries.length - 1];
    return lastEntry ? lastEntry.duration : 0;
  }

  private measureNetworkTime(): number {
    const entries = performance.getEntriesByType("resource");
    const recentEntries = entries.slice(-10);
    return recentEntries.reduce((sum, entry) => sum + entry.duration, 0);
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  generateReport(): PerformanceReport {
    if (this.metrics.length === 0) {
      return {
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        averageRenderTime: 0,
        memoryUsage: { average: 0, peak: 0 },
        recommendations: ["No metrics collected yet"],
      };
    }

    const fpsValues = this.metrics.map((m) => m.fps);
    const renderTimes = this.metrics.map((m) => m.renderTime);
    const memoryValues = this.metrics
      .map((m) => m.memory?.usedJSHeapSize || 0)
      .filter((v) => v > 0);

    const averageFPS = Math.round(fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length);
    const minFPS = Math.min(...fpsValues);
    const maxFPS = Math.max(...fpsValues);
    const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

    const memoryAverage = memoryValues.length > 0
      ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length
      : 0;
    const memoryPeak = memoryValues.length > 0 ? Math.max(...memoryValues) : 0;

    const recommendations = this.generateRecommendations(averageFPS, averageRenderTime, memoryPeak);

    return {
      averageFPS,
      minFPS,
      maxFPS,
      averageRenderTime,
      memoryUsage: {
        average: memoryAverage,
        peak: memoryPeak,
      },
      recommendations,
    };
  }

  private generateRecommendations(fps: number, renderTime: number, memoryPeak: number): string[] {
    const recommendations: string[] = [];

    if (fps < 30) {
      recommendations.push("⚠️ FPS is below 30. Consider reducing animations or optimizing render cycles.");
    } else if (fps < 60) {
      recommendations.push("⚡ FPS is acceptable but could be improved. Check for unnecessary re-renders.");
    }

    if (renderTime > 16) {
      recommendations.push("🐢 Render time exceeds 16ms. Consider using React.memo or useMemo for expensive computations.");
    }

    if (memoryPeak > 100 * 1024 * 1024) {
      recommendations.push("💾 Memory usage is high. Check for memory leaks and consider lazy loading components.");
    }

    if (recommendations.length === 0) {
      recommendations.push("✅ Performance is optimal!");
    }

    return recommendations;
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

export function measurePerformance<T>(name: string, fn: () => T): T {
  performance.mark(`${name}-start`);
  const result = fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
  return result;
}

export async function measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  performance.mark(`${name}-start`);
  const result = await fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
  return result;
}

export function usePerformanceMonitor(enabled: boolean = true) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);

  useEffect(() => {
    if (!enabled) {return;}

    performanceMonitor.startMonitoring();

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getLatestMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
      performanceMonitor.stopMonitoring();
    };
  }, [enabled]);

  const generateReport = useCallback(() => {
    const newReport = performanceMonitor.generateReport();
    setReport(newReport);
    return newReport;
  }, []);

  return { metrics, report, generateReport };
}

import { useState, useEffect, useCallback } from "react";
