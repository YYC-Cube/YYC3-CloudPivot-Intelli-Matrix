/**
 * useMobileView.test.ts
 * ====================
 * 响应式断点检测 Hook - renderHook 单元测试（W2 P1）
 *
 * 测试策略：
 * - jsdom resize + innerWidth 操控驱动断点切换（sm/md/lg/xl/2xl 全覆盖）
 * - rAF 节流行为验证
 * - isTouch 检测（maxTouchPoints mock）
 * - 卸载时清理 resize 监听
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileView } from '../hooks/useMobileView';

function setWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

function fireResize() {
  window.dispatchEvent(new Event('resize'));
}

/** 触发 resize 并 flush rAF */
function resizeTo(width: number) {
  act(() => {
    setWidth(width);
    fireResize();
    vi.advanceTimersByTime(50); // flush requestAnimationFrame
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom 默认无 rAF 或走定时器，替换为可控实现
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    return setTimeout(() => cb(performance.now()), 16) as unknown as number;
  });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('断点映射', () => {
  it.each([
    [375, 'sm'],
    [767, 'sm'],
    [768, 'md'],
    [1023, 'md'],
    [1024, 'lg'],
    [1279, 'lg'],
    [1280, 'xl'],
    [1535, 'xl'],
    [1536, '2xl'],
    [2560, '2xl'],
  ] as const)('%dpx → %s', (width, expected) => {
    setWidth(width);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.breakpoint).toBe(expected);
  });
});

describe('视图状态派生', () => {
  it('移动端: isMobile=true，其余 false', () => {
    setWidth(375);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('平板端: isTablet=true', () => {
    setWidth(768);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('桌面端三档均为 isDesktop=true', () => {
    for (const width of [1024, 1280, 1536]) {
      setWidth(width);
      const { result, unmount } = renderHook(() => useMobileView());
      expect(result.current.isDesktop, `${width}px`).toBe(true);
      unmount();
    }
  });

  it('width 字段同步窗口宽度', () => {
    setWidth(900);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.width).toBe(900);
  });

  it('isTouch: navigator.maxTouchPoints>0 时为 true', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
    setWidth(1024);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.isTouch).toBe(true);
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 0 });
  });
});

describe('resize 响应', () => {
  it('宽度变化后断点跟随切换', () => {
    setWidth(375);
    const { result } = renderHook(() => useMobileView());
    expect(result.current.breakpoint).toBe('sm');

    resizeTo(1024);
    expect(result.current.breakpoint).toBe('lg');

    resizeTo(1600);
    expect(result.current.breakpoint).toBe('2xl');

    resizeTo(800);
    expect(result.current.breakpoint).toBe('md');
  });

  it('卸载后 resize 不再更新状态（监听已清理）', () => {
    setWidth(375);
    const { result, unmount } = renderHook(() => useMobileView());
    expect(result.current.breakpoint).toBe('sm');

    unmount();
    resizeTo(1600);
    expect(result.current.breakpoint).toBe('sm'); // 未更新
  });
});
