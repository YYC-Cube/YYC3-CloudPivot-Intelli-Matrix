/**
 * setup.ts
 * =======
 * Vitest 全局 setup
 * - jsdom 环境: 注入 jest-dom matchers + polyfills
 * - node 环境: 安全跳过 DOM 相关 mock
 */

// 检测环境类型
const isJsdom = typeof window !== "undefined" && typeof document !== "undefined";

// jest-dom matchers（仅 jsdom 环境生效）
if (isJsdom) {
  await import("@testing-library/jest-dom/vitest");
}

// Mock Observer classes for jsdom
class MockResizeObserver implements ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Document | Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: ReadonlyArray<number> = [];
  constructor() { }
  observe() { }
  unobserve() { }
  disconnect() { }
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

//以下仅在 jsdom 环境执行
if (isJsdom) {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value.toString(); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (index: number) => Object.keys(store)[index] || null,
    };
  })();
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  // Mock matchMedia (jsdom 不支持)
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
      }),
    });
  }

  // Mock ResizeObserver
  if (!(window as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver) {
    (window as Window & { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }

  // Mock IntersectionObserver
  if (!(window as Window & { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver) {
    (window as Window & { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  // Mock scrollTo
  if (!window.scrollTo) {
    window.scrollTo = () => { };
  }

  // Mock scrollIntoView
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => { };
  }

  // Mock navigator.clipboard
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => { },
        readText: async () => "",
      },
      writable: true,
    });
  }
}

export { };
