/**
 * setup.ts
 * =========
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

//以下仅在 jsdom 环境执行
if (isJsdom) {
  // Mock matchMedia (jsdom 不支持)
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }

  // Mock ResizeObserver
  if (!(window as any).ResizeObserver) {
    (window as any).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Mock IntersectionObserver
  if (!(window as any).IntersectionObserver) {
    (window as any).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  // Mock scrollTo
  if (!window.scrollTo) {
    window.scrollTo = () => {};
  }

  // Mock navigator.clipboard
  if (!navigator.clipboard) {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {},
        readText: async () => "",
      },
      writable: true,
    });
  }
}

export {};
