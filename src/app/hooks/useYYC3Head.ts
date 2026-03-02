/**
 * useYYC3Head.ts
 * ===============
 * 动态注入 YYC³ 品牌 <head> 标签
 *
 * 在无法直接编辑 index.html 的环境中，通过 React 运行时注入:
 * - favicon (16x16, 32x32, 96x96, .ico)
 * - apple-touch-icon
 * - PWA manifest
 * - theme-color
 * - 页面标题
 */

import { useEffect } from "react";
import { icons, iconsCDN } from "../lib/yyc3-icons";

export function useYYC3Head() {
  useEffect(() => {
    // ----------------------------------------------------------
    // 页面标题
    // ----------------------------------------------------------
    document.title = "YYC³ CloudPivot Intelli-Matrix · 数据看盘";

    // ----------------------------------------------------------
    // 辅助: 创建或更新 <link> 标签
    // ----------------------------------------------------------
    function upsertLink(
      rel: string,
      href: string,
      attrs?: Record<string, string>
    ): HTMLLinkElement {
      const selector = attrs?.sizes
        ? `link[rel="${rel}"][sizes="${attrs.sizes}"]`
        : `link[rel="${rel}"]`;

      let link = document.querySelector<HTMLLinkElement>(selector);
      if (!link) {
        link = document.createElement("link");
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = href;
      if (attrs) {
        Object.entries(attrs).forEach(([k, v]) => link!.setAttribute(k, v));
      }
      return link;
    }

    function upsertMeta(name: string, content: string) {
      const attrName = name.startsWith("og:") ? "property" : "name";
      let meta = document.querySelector<HTMLMetaElement>(
        `meta[${attrName}="${name}"]`
      );
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attrName, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    }

    // ----------------------------------------------------------
    // Favicon
    // ----------------------------------------------------------
    upsertLink("icon", icons.favicon, { type: "image/x-icon" });
    upsertLink("icon", icons.favicon16, {
      type: "image/png",
      sizes: "16x16",
    });
    upsertLink("icon", icons.favicon32, {
      type: "image/png",
      sizes: "32x32",
    });
    upsertLink("icon", icons.favicon96, {
      type: "image/png",
      sizes: "96x96",
    });

    // ----------------------------------------------------------
    // Apple Touch Icon
    // ----------------------------------------------------------
    upsertLink("apple-touch-icon", icons.pwa192, { sizes: "192x192" });

    // ----------------------------------------------------------
    // PWA Manifest
    // ----------------------------------------------------------
    upsertLink("manifest", "/manifest.json");

    // ----------------------------------------------------------
    // Theme Color
    // ----------------------------------------------------------
    upsertMeta("theme-color", "#060e1f");
    upsertMeta("apple-mobile-web-app-status-bar-style", "black-translucent");
    upsertMeta("apple-mobile-web-app-capable", "yes");
    upsertMeta("apple-mobile-web-app-title", "YYC³ CloudPivot");

    // ----------------------------------------------------------
    // SEO / OG 基础 (本地系统用不上, 但规范化)
    // ----------------------------------------------------------
    upsertMeta("description", "YYC³ CloudPivot Intelli-Matrix — 本地多端推理矩阵数据库数据看盘 — M4 Max + iMac + NAS 集群实时监控");
    upsertMeta("og:title", "YYC³ CloudPivot Intelli-Matrix");
    upsertMeta("og:description", "本地闭环多端推理矩阵数据看盘系统");
    upsertMeta("og:image", icons.pwa512);
    upsertMeta("og:type", "website");

    // ----------------------------------------------------------
    // Favicon CDN 回退 — 监听 error 事件
    // ----------------------------------------------------------
    const faviconLink = document.querySelector<HTMLLinkElement>(
      'link[rel="icon"][sizes="32x32"]'
    );
    if (faviconLink) {
      const handleFaviconError = () => {
        faviconLink.href = iconsCDN.favicon32;
        faviconLink.removeEventListener("error", handleFaviconError);
      };
      faviconLink.addEventListener("error", handleFaviconError);
    }
  }, []);
}