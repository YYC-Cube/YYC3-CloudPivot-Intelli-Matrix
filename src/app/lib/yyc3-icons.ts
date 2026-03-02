/**
 * yyc3-icons.ts
 * ==============
 * YYC³ 图标资源中心化配置
 *
 * 双路径策略:
 * - 本地路径 (/yyc3-icons/...) → 优先使用，离线可用
 * - CDN 回退 (raw.githubusercontent.com) → 本地未部署时自动降级
 *
 * 使用方式:
 *   import { icons } from '../lib/yyc3-icons';
 *   <img src={icons.logo192} alt="YYC³" />
 */

// ============================================================
//  GitHub Raw CDN 基础 URL
// ============================================================

const GH_BASE =
  "https://raw.githubusercontent.com/YYC-Cube/YYC-Data-Dashboard-Design/main/public/yyc3-icons";

// ============================================================
//  本地路径基础 URL (public/ 目录下)
// ============================================================

const LOCAL_BASE = "/yyc3-icons";

// ============================================================
//  路径解析器 — 优先本地，CDN 回退
// ============================================================

/**
 * 生成图标路径
 * 开发/预览环境使用 CDN URL，本地部署时使用 LOCAL 路径
 *
 * 策略: 尝试本地 → 降级 CDN
 *   如果你已经运行 `scripts/download-icons.sh`，图标会在本地。
 *   否则自动回退到 GitHub CDN。
 */
function iconPath(subPath: string): string {
  // 在 Vite 开发环境中，public/ 目录下的文件可以通过根路径访问
  // 如果文件不存在，浏览器会返回 404，此时可通过 onError 回退到 CDN
  return `${LOCAL_BASE}/${subPath}`;
}

function cdnPath(subPath: string): string {
  return `${GH_BASE}/${subPath}`;
}

// ============================================================
//  导出图标路径集
// ============================================================

export const icons = {
  // ---- Favicon ----
  favicon: iconPath("favicon/favicon.ico"),
  favicon16: iconPath("favicon/favicon-16x16.png"),
  favicon32: iconPath("favicon/favicon-32x32.png"),
  favicon96: iconPath("favicon/favicon-96x96.png"),

  // ---- PWA Icons ----
  pwa72: iconPath("pwa/icon-72x72.png"),
  pwa96: iconPath("pwa/icon-96x96.png"),
  pwa128: iconPath("pwa/icon-128x128.png"),
  pwa144: iconPath("pwa/icon-144x144.png"),
  pwa152: iconPath("pwa/icon-152x152.png"),
  pwa192: iconPath("pwa/icon-192x192.png"),
  pwa384: iconPath("pwa/icon-384x384.png"),
  pwa512: iconPath("pwa/icon-512x512.png"),

  // ---- WebP 优化版 ----
  webp192: iconPath("webp/icon-192x192.webp"),
  webp512: iconPath("webp/icon-512x512.webp"),

  // ---- 常用别名 ----
  /** 应用 Logo (192x192) — TopBar / Login / 通用场景 */
  logo192: iconPath("pwa/icon-192x192.png"),
  /** 应用 Logo (512x512) — 大尺寸展示 */
  logo512: iconPath("pwa/icon-512x512.png"),
  /** 应用 Logo (96x96) — 小尺寸展示 */
  logo96: iconPath("pwa/icon-96x96.png"),
  /** 应用 Logo (72x72) — 最小尺寸 */
  logo72: iconPath("pwa/icon-72x72.png"),

  // ---- iOS ----
  ios1024: iconPath("ios/icon-1024.png"),
  iosAppleTouch: iconPath("pwa/icon-192x192.png"), // Apple Touch Icon

  // ---- Android ----
  playstore: iconPath("android/playstore-icon.png"),
} as const;

// ============================================================
//  CDN 回退版 (当本地文件 404 时使用)
// ============================================================

export const iconsCDN = {
  favicon: cdnPath("favicon/favicon.ico"),
  favicon16: cdnPath("favicon/favicon-16x16.png"),
  favicon32: cdnPath("favicon/favicon-32x32.png"),
  favicon96: cdnPath("favicon/favicon-96x96.png"),

  pwa72: cdnPath("pwa/icon-72x72.png"),
  pwa96: cdnPath("pwa/icon-96x96.png"),
  pwa128: cdnPath("pwa/icon-128x128.png"),
  pwa144: cdnPath("pwa/icon-144x144.png"),
  pwa152: cdnPath("pwa/icon-152x152.png"),
  pwa192: cdnPath("pwa/icon-192x192.png"),
  pwa384: cdnPath("pwa/icon-384x384.png"),
  pwa512: cdnPath("pwa/icon-512x512.png"),

  webp192: cdnPath("webp/icon-192x192.webp"),
  webp512: cdnPath("webp/icon-512x512.webp"),

  logo192: cdnPath("pwa/icon-192x192.png"),
  logo512: cdnPath("pwa/icon-512x512.png"),
  logo96: cdnPath("pwa/icon-96x96.png"),
  logo72: cdnPath("pwa/icon-72x72.png"),

  ios1024: cdnPath("ios/icon-1024.png"),
  iosAppleTouch: cdnPath("pwa/icon-192x192.png"),
  playstore: cdnPath("android/playstore-icon.png"),
} as const;

// ============================================================
//  Logo 组件辅助 — 支持 onError CDN 回退
// ============================================================

/**
 * 获取带 CDN 回退的 onError handler
 * 使用方式:
 *   <img
 *     src={icons.logo192}
 *     onError={handleIconError('logo192')}
 *     alt="YYC³"
 *   />
 */
export function handleIconError(
  iconKey: keyof typeof iconsCDN
): React.ReactEventHandler<HTMLImageElement> {
  return (e) => {
    const img = e.currentTarget;
    const cdnSrc = iconsCDN[iconKey];
    // 避免无限循环
    if (img.src !== cdnSrc) {
      img.src = cdnSrc;
    }
  };
}

// ============================================================
//  PWA Manifest 图标数组 (用于动态生成)
// ============================================================

export const pwaManifestIcons = [
  { src: "yyc3-icons/pwa/icon-72x72.png", sizes: "72x72", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-96x96.png", sizes: "96x96", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-128x128.png", sizes: "128x128", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-144x144.png", sizes: "144x144", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-152x152.png", sizes: "152x152", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
  { src: "yyc3-icons/pwa/icon-384x384.png", sizes: "384x384", type: "image/png" },
  { src: "yyc3-icons/pwa/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
];
