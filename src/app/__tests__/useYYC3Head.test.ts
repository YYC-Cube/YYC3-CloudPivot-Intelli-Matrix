/**
 * useYYC3Head.test.ts
 * ==================
 * 品牌 <head> 动态注入 Hook - jsdom 单元测试（W2 P1）
 *
 * 测试策略：
 * - title / favicon / apple-touch-icon / manifest / theme-color / OG 元数据 全量断言
 * - jsdom href 为序列化绝对 URL（空格→%20），比较前统一 decodeURI 归一
 * - upsert 幂等性：重复挂载不产生重复标签
 * - CDN onerror 回退 handler 挂载验证
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useYYC3Head } from '../hooks/useYYC3Head';
import { icons, iconsCDN } from '../lib/yyc3-icons';

function getLink(selector: string): HTMLLinkElement | null {
  return document.head.querySelector<HTMLLinkElement>(selector);
}

/** jsdom 将 href 序列化为绝对 URL 并百分号编码空格；归一为可比较形式 */
function hrefOf(el: HTMLLinkElement | null): string {
  return decodeURIComponent(el?.href ?? '');
}

function expectEndsWithHref(actual: string, suffix: string) {
  expect(actual.endsWith(decodeURIComponent(suffix))).toBe(true);
}

beforeEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('useYYC3Head 注入', () => {
  it('设置页面标题', () => {
    renderHook(() => useYYC3Head());
    expect(document.title).toBe('YYC³ 言启象限 · 语枢智云');
  });

  it('注入 PNG favicon 16/32 双尺寸', () => {
    renderHook(() => useYYC3Head());

    const f16 = getLink('link[rel="icon"][sizes="16x16"]');
    const f32 = getLink('link[rel="icon"][sizes="32x32"]');
    expectEndsWithHref(hrefOf(f16), icons.favicon16);
    expect(f16?.type).toBe('image/png');
    expectEndsWithHref(hrefOf(f32), icons.favicon32);
    expect(f32?.type).toBe('image/png');
  });

  it('注入 apple-touch-icon 180x180', () => {
    renderHook(() => useYYC3Head());
    const link = getLink('link[rel="apple-touch-icon"]');
    expect(link?.getAttribute('sizes')).toBe('180x180');
    expectEndsWithHref(hrefOf(link), icons.webAppAppleTouch);
  });

  it('注入 PWA manifest', () => {
    renderHook(() => useYYC3Head());
    const manifest = getLink('link[rel="manifest"]');
    expect(hrefOf(manifest)).toContain('/manifest.json');
  });

  it('注入 theme-color 与 apple 系列 meta', () => {
    renderHook(() => useYYC3Head());

    expect(document.head.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content).toBe('#060e1f');
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-status-bar-style"]')?.content
    ).toBe('black-translucent');
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-capable"]')?.content
    ).toBe('yes');
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]')?.content
    ).toBe('YYC³ CloudPivot');
  });

  it('注入 SEO / OG 元数据（og:* 用 property 属性）', () => {
    renderHook(() => useYYC3Head());

    expect(
      document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content
    ).toContain('本地多端推理矩阵');

    const ogTitle = document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    expect(ogTitle?.content).toBe('YYC³ 言启象限 · 语枢智云');
    expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]')).toBeTruthy();
    expect(
      document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content.endsWith(
        decodeURIComponent(icons.webAppChrome512)
      )
    ).toBe(true);
    expect(document.head.querySelector<HTMLMetaElement>('meta[property="og:type"]')?.content).toBe('website');
  });

  it('favicon 16/32/apple-touch 挂载 CDN onerror 回退', () => {
    renderHook(() => useYYC3Head());

    const f16 = getLink('link[rel="icon"][sizes="16x16"]')!;
    const f32 = getLink('link[rel="icon"][sizes="32x32"]')!;
    const apple = getLink('link[rel="apple-touch-icon"]')!;

    // sizes DOMTokenList 由 setAttribute 同步；逐项触发 onerror → 断言切换 CDN
    expect(f16.getAttribute('sizes')).toBe('16x16');
    f16.onerror?.(new Event('error'));
    expect(hrefOf(f16)).toContain(decodeURIComponent(iconsCDN.favicon16));

    f32.onerror?.(new Event('error'));
    expect(hrefOf(f32)).toContain(decodeURIComponent(iconsCDN.favicon32));

    apple.onerror?.(new Event('error'));
    expect(hrefOf(apple)).toContain(decodeURIComponent(iconsCDN.webAppAppleTouch));
  });

  it('幂等：重复挂载不产生重复标签', () => {
    renderHook(() => useYYC3Head());
    renderHook(() => useYYC3Head());

    expect(document.head.querySelectorAll('link[rel="icon"]').length).toBe(2); // 16+32 两个尺寸各一
    expect(document.head.querySelectorAll('link[rel="apple-touch-icon"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="manifest"]').length).toBe(1);
    expect(document.head.querySelectorAll('meta[name="theme-color"]').length).toBe(1);
    expect(document.head.querySelectorAll('meta[property="og:title"]').length).toBe(1);
  });
});
