/**
 * lazy-components.tsx
 * ===================
 * 懒加载组件 - 按需加载优化性能
 * 
 * 功能:
 * - 代码分割 - 动态导入组件
 * - 加载状态 - 优雅的加载体验
 * - 错误处理 - 加载失败重试
 * - 预加载支持 - 提前加载关键组件
 */

import React, { Suspense, lazy, ComponentType, useState, useEffect } from "react";
import { cn } from "./utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-cyan-500 border-t-transparent",
          sizeClasses[size]
        )}
      />
    </div>
  );
}

interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export function LoadingFallback({ message = "Loading...", className }: LoadingFallbackProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-400">{message}</p>
    </div>
  );
}

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  className?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, className }: ErrorFallbackProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12", className)}>
      <div className="text-red-500 mb-4">
        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {error?.message || "Failed to load component"}
      </p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export function LazyWrapper({ children, fallback, onError }: LazyWrapperProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <ErrorFallback
        error={error}
        resetErrorBoundary={() => setError(null)}
      />
    );
  }

  return (
    <Suspense fallback={fallback || <LoadingFallback />}>
      {children}
    </Suspense>
  );
}

export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(importFn);

  return function LazyComponentWrapper(props: React.ComponentProps<T>) {
    return (
      <LazyWrapper>
        <LazyComponent {...props} />
      </LazyWrapper>
    );
  };
}

export function usePreloadComponent(importFn: () => Promise<any>) {
  const [isPreloaded, setIsPreloaded] = useState(false);

  const preload = async () => {
    if (!isPreloaded) {
      await importFn();
      setIsPreloaded(true);
    }
  };

  return { preload, isPreloaded };
}

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

export function useLazyLoad(
  options: IntersectionObserverOptions = {},
  triggerOnce = true
) {
  const [isInView, setIsInView] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {return;}

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (triggerOnce) {
          observer.unobserve(element);
        }
      } else if (!triggerOnce) {
        setIsInView(false);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options, triggerOnce]);

  return { ref, isInView };
}

interface LazyLoadWrapperProps {
  children: React.ReactNode;
  placeholder?: React.ReactNode;
  className?: string;
  options?: IntersectionObserverOptions;
  triggerOnce?: boolean;
}

export function LazyLoadWrapper({
  children,
  placeholder,
  className,
  options,
  triggerOnce = true,
}: LazyLoadWrapperProps) {
  const { ref, isInView } = useLazyLoad(options, triggerOnce);

  return (
    <div ref={ref} className={className}>
      {isInView ? children : placeholder || <LoadingFallback />}
    </div>
  );
}

export const LazyDashboard = createLazyComponent(
  () => import("../Dashboard").then((module) => ({ default: module.Dashboard }))
);

export const LazyDatabaseManager = createLazyComponent(
  () => import("../DatabaseManager").then((module) => ({ default: module.DatabaseManager }))
);

export const LazyConfigExportCenter = createLazyComponent(
  () => import("../ConfigExportCenter").then((module) => ({ default: module.ConfigExportCenter }))
);

export const LazyAlertRulesPanel = createLazyComponent(
  () => import("../AlertRulesPanel").then((module) => ({ default: module.AlertRulesPanel }))
);
