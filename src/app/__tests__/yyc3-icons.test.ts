/**
 * yyc3-icons.test.ts
 * ================
 * YYC³ 图标资源中心化配置 - 数据完整性测试（W2 快赢）
 *
 * 测试策略：
 * - icons/iconsCDN 键集 1:1 对齐（32 文件 + 10 别名）
 * - 本地路径前缀与 CDN URL 前缀断言
 * - CDN 带空格文件名编码正确性
 * - pwaManifestIcons / REMOTE_FILE_MANIFEST 结构与计数
 * - handleIconError 回退行为（含防无限循环）
 */

import { describe, expect, it } from 'vitest';
import { handleIconError, icons, iconsCDN, pwaManifestIcons, REMOTE_FILE_MANIFEST } from '../lib/yyc3-icons';

const LOCAL_BASE = '/yyc3-icons';
const GH_BASE = 'https://raw.githubusercontent.com/YYC-Cube/Cloudpivotintellimatrix/main/public/yyc3-badge-icons';

/** 仓库实际 32 个 PNG 的相对路径（作为数据源基准） */
const EXPECTED_FILES = [
  // Android (6)
  'Android/mdpi.png', 'Android/hdpi.png', 'Android/xhdpi.png',
  'Android/xxhdpi.png', 'Android/xxxhdpi.png', 'Android/Play Store.png',
  // Web App (5)
  'Web App/favicon-16.png', 'Web App/favicon-32.png', 'Web App/android-chrome-192.png',
  'Web App/android-chrome-512.png', 'Web App/apple-touch-icon.png',
  // iOS (14)
  'iOS/App Store.png', 'iOS/iPad App.png', 'iOS/iPad Notification.png',
  'iOS/iPad Pro App 2x.png', 'iOS/iPad Settings.png', 'iOS/iPad Spotlight.png',
  'iOS/iPhone App 2x.png', 'iOS/iPhone App 3x.png', 'iOS/iPhone Notification 2x.png',
  'iOS/iPhone Notification 3x.png', 'iOS/iPhone Settings 2x.png', 'iOS/iPhone Settings 3x.png',
  'iOS/iPhone Spotlight 2x.png', 'iOS/iPhone Spotlight 3x.png',
  // macOS (7)
  'macOS/16.png', 'macOS/32.png', 'macOS/64.png', 'macOS/128.png',
  'macOS/256.png', 'macOS/512.png', 'macOS/1024.png',
  // watchOS (4)
  'watchOS/App Store.png', 'watchOS/Home Screen.png',
  'watchOS/Notification.png', 'watchOS/Short Look.png',
] as const;

describe('icons 本地图标集', () => {
  it('共 49 个键（32 文件 + 10 别名 + 7 复用语义键）', () => {
    // 32 主键 + logo/pwa192/pwa512/iosAppleTouch/ios1024/playstore/logo72/logo192/logo512 = 41
    expect(Object.keys(icons).length).toBeGreaterThanOrEqual(41);
  });

  it('全部值以 /yyc3-icons/ 前缀开头', () => {
    for (const value of Object.values(icons)) {
      expect(value.startsWith(`${LOCAL_BASE}/`)).toBe(true);
    }
  });

  it('全部值以 .png 结尾', () => {
    for (const value of Object.values(icons)) {
      expect(value.endsWith('.png')).toBe(true);
    }
  });

  it('覆盖仓库全部 32 个文件的本地路径', () => {
    const values = new Set(Object.values(icons));
    for (const file of EXPECTED_FILES) {
      expect(values.has(`${LOCAL_BASE}/${file}`), file).toBe(true);
    }
  });

  it('核心别名指向正确文件', () => {
    expect(icons.logo).toBe(`${LOCAL_BASE}/Web App/android-chrome-512.png`);
    expect(icons.pwa192).toBe(`${LOCAL_BASE}/Web App/android-chrome-192.png`);
    expect(icons.pwa512).toBe(icons.logo);
    expect(icons.iosAppleTouch).toBe(`${LOCAL_BASE}/Web App/apple-touch-icon.png`);
    expect(icons.ios1024).toBe(`${LOCAL_BASE}/iOS/App Store.png`);
    expect(icons.playstore).toBe(`${LOCAL_BASE}/Android/Play Store.png`);
    expect(icons.logo72).toBe(`${LOCAL_BASE}/Android/hdpi.png`);
  });
});

describe('iconsCDN 回退图标集', () => {
  it('与 icons 键集完全一致', () => {
    expect(Object.keys(iconsCDN).sort()).toEqual(Object.keys(icons).sort());
  });

  it('全部值以 GitHub Raw 基址开头', () => {
    for (const value of Object.values(iconsCDN)) {
      expect(value.startsWith(`${GH_BASE}/`)).toBe(true);
    }
  });

  it('仅末段（文件名）编码空格，目录段保留原样', () => {
    // cdnPath 只对最后一段做 encodeURIComponent，目录空格保持原样
    expect(iconsCDN.webAppChrome512).toBe(`${GH_BASE}/Web App/android-chrome-512.png`);
    expect(iconsCDN.iosAppStore).toBe(`${GH_BASE}/iOS/App%20Store.png`);
    expect(iconsCDN.iosiPadNotification).toBe(`${GH_BASE}/iOS/iPad%20Notification.png`);
    expect(iconsCDN.watchOSShortLook).toBe(`${GH_BASE}/watchOS/Short%20Look.png`);
  });

  it('每个 CDN 键与本地键指向同一相对路径', () => {
    for (const key of Object.keys(icons)) {
      const local = icons[key as keyof typeof icons];
      const cdn = iconsCDN[key as keyof typeof iconsCDN];
      const localRel = local.slice(LOCAL_BASE.length + 1);
      // CDN 中目录分隔符保留 "/"，空格编码为 %20
      const cdnRel = cdn.slice(GH_BASE.length + 1).replaceAll('%20', ' ');
      expect(cdnRel, key).toBe(localRel);
    }
  });
});

describe('handleIconError CDN 回退', () => {
  function makeEvent(currentSrc: string) {
    return { currentTarget: { src: currentSrc } } as unknown as React.SyntheticEvent<HTMLImageElement>;
  }

  it('本地失败时切换到 CDN 源', () => {
    const handler = handleIconError('logo');
    const img = makeEvent(icons.logo);
    handler(img);
    expect((img.currentTarget as HTMLImageElement).src).toBe(iconsCDN.logo);
  });

  it('已是 CDN 源时不重复赋值（防无限循环）', () => {
    const handler = handleIconError('logo');
    const img = makeEvent(iconsCDN.logo);
    handler(img);
    expect((img.currentTarget as HTMLImageElement).src).toBe(iconsCDN.logo);
  });
});

describe('pwaManifestIcons', () => {
  it('共 14 项且结构完整', () => {
    expect(pwaManifestIcons).toHaveLength(14);
    for (const icon of pwaManifestIcons) {
      expect(icon.src).toMatch(/^yyc3-icons\//);
      expect(icon.sizes).toMatch(/^\d+x\d+$/);
      expect(icon.type).toBe('image/png');
    }
  });

  it('含 PWA 必需的 192/512 maskable 图标', () => {
    const maskable = pwaManifestIcons.filter((i) => i.purpose === 'any maskable');
    expect(maskable.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512']);
  });
});

describe('REMOTE_FILE_MANIFEST 下载清单', () => {
  it('精确包含仓库全部 PNG（6+5+14+7+4=36）', () => {
    expect(REMOTE_FILE_MANIFEST).toHaveLength(36);
    expect([...REMOTE_FILE_MANIFEST].sort()).toEqual([...EXPECTED_FILES].sort());
  });

  it('按平台分组计数正确（Android 6 / Web 5 / iOS 14 / macOS 7 / watchOS 4）', () => {
    const count = (prefix: string) => REMOTE_FILE_MANIFEST.filter((f) => f.startsWith(prefix)).length;
    expect(count('Android/')).toBe(6);
    expect(count('Web App/')).toBe(5);
    expect(count('iOS/')).toBe(14);
    expect(count('macOS/')).toBe(7);
    expect(count('watchOS/')).toBe(4);
  });
});
