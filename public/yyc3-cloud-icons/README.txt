YYC³ App Icon Set
=================
Generated: 2/14/2026
Source: https://github.com/YYC-Cube/YYC-Data-Dashboard-Design

Included Platforms:
- ANDROID  (mipmap-hdpi ~ mipmap-xxxhdpi + playstore-icon.png)
- IOS      (icon-20 ~ icon-1024, @2x/@3x 变体)
- PWA      (72x72 ~ 512x512 + manifest.json)
- FAVICON  (16x16, 32x32, 96x96, .ico)
- WEBP     (192x192, 512x512)

How to Populate:
  Run: chmod +x scripts/download-icons.sh && ./scripts/download-icons.sh

After downloading, this directory will contain:
  favicon/   → favicon-16x16.png, favicon-32x32.png, favicon-96x96.png, favicon.ico
  pwa/       → icon-72x72.png ... icon-512x512.png
  webp/      → icon-192x192.webp, icon-512x512.webp
  ios/       → icon-20.png ... icon-1024.png
  android/   → mipmap-*/ic_launcher*.png, playstore-icon.png

Integration:
  - manifest.json   → /public/manifest.json (already configured)
  - Favicon/Meta    → Injected at runtime via useYYC3Head hook
  - React Logo      → <YYC3Logo /> component (src/app/components/YYC3Logo.tsx)
  - Icon Paths      → src/app/lib/yyc3-icons.ts (local + CDN fallback)
