#!/usr/bin/env bash
# ============================================================================
#  YYC³ 图标资源下载脚本
#  从 GitHub 仓库拉取 public/yyc3-icons/ 全部内容到本地 public/ 目录
# ============================================================================
#
#  用法:
#    chmod +x scripts/download-icons.sh
#    ./scripts/download-icons.sh
#
#  前提: curl 可用 (macOS/Linux 默认已安装)
# ============================================================================

set -euo pipefail

BASE_URL="https://raw.githubusercontent.com/YYC-Cube/YYC-Data-Dashboard-Design/main/public/yyc3-icons"
TARGET_DIR="public/yyc3-icons"

echo "================================================"
echo "  YYC³ 图标资源下载器"
echo "  来源: YYC-Cube/YYC-Data-Dashboard-Design"
echo "================================================"
echo ""

# 创建目录结构
echo "[1/6] 创建目录结构..."
mkdir -p "$TARGET_DIR"/{favicon,pwa,webp,ios}
mkdir -p "$TARGET_DIR"/android/{mipmap-hdpi,mipmap-mdpi,mipmap-xhdpi,mipmap-xxhdpi,mipmap-xxxhdpi}

# 下载 README
echo "[2/6] 下载 README..."
curl -sSL "$BASE_URL/README.txt" -o "$TARGET_DIR/README.txt"

# 下载 Favicon
echo "[3/6] 下载 Favicon..."
for f in favicon-16x16.png favicon-32x32.png favicon-96x96.png favicon.ico; do
  echo "  ↓ favicon/$f"
  curl -sSL "$BASE_URL/favicon/$f" -o "$TARGET_DIR/favicon/$f"
done
# 复制 favicon.ico 到 public 根目录 (浏览器默认位置)
cp "$TARGET_DIR/favicon/favicon.ico" "public/favicon.ico" 2>/dev/null || true

# 下载 PWA 图标
echo "[4/6] 下载 PWA 图标..."
for size in 72x72 96x96 128x128 144x144 152x152 192x192 384x384 512x512; do
  echo "  ↓ pwa/icon-${size}.png"
  curl -sSL "$BASE_URL/pwa/icon-${size}.png" -o "$TARGET_DIR/pwa/icon-${size}.png"
done

# 下载 WebP
echo "[5/6] 下载 WebP 优化图标..."
for size in 192x192 512x512; do
  echo "  ↓ webp/icon-${size}.webp"
  curl -sSL "$BASE_URL/webp/icon-${size}.webp" -o "$TARGET_DIR/webp/icon-${size}.webp"
done

# 下载 iOS 图标
echo "[6/6] 下载 iOS 图标..."
IOS_FILES=(
  "icon-1024.png"
  "icon-20-ipad.png" "icon-20.png" "icon-20@2x-ipad.png" "icon-20@2x.png" "icon-20@3x.png"
  "icon-29-ipad.png" "icon-29.png" "icon-29@2x-ipad.png" "icon-29@2x.png" "icon-29@3x.png"
  "icon-40-ipad.png" "icon-40.png" "icon-40@2x-ipad.png" "icon-40@2x.png" "icon-40@3x.png"
  "icon-60@2x.png" "icon-60@3x.png"
  "icon-76.png" "icon-76@2x.png" "icon-83.5@2x.png"
)
for f in "${IOS_FILES[@]}"; do
  # URL encode @ → %40
  URL_FILE=$(echo "$f" | sed 's/@/%40/g')
  echo "  ↓ ios/$f"
  curl -sSL "$BASE_URL/ios/$URL_FILE" -o "$TARGET_DIR/ios/$f"
done

# 下载 Android 图标
echo "       下载 Android 图标..."
curl -sSL "$BASE_URL/android/playstore-icon.png" -o "$TARGET_DIR/android/playstore-icon.png"
for density in hdpi mdpi xhdpi xxhdpi xxxhdpi; do
  for f in ic_launcher.png ic_launcher_foreground.png ic_launcher_round.png; do
    echo "  ↓ android/mipmap-${density}/$f"
    curl -sSL "$BASE_URL/android/mipmap-${density}/$f" -o "$TARGET_DIR/android/mipmap-${density}/$f"
  done
done

echo ""
echo "================================================"
echo "  下载完成！"
echo "  图标位置: $TARGET_DIR/"
echo "  文件总数: $(find "$TARGET_DIR" -type f | wc -l | tr -d ' ')"
echo "  总大小:   $(du -sh "$TARGET_DIR" | cut -f1)"
echo "================================================"
echo ""
echo "  favicon.ico 已复制到 public/favicon.ico"
echo "  manifest.json 已就绪: public/manifest.json"
echo ""
echo "  下一步: 在 index.html 的 <head> 中确认以下标签:"
echo '  <link rel="icon" type="image/png" sizes="32x32" href="/yyc3-icons/favicon/favicon-32x32.png">'
echo '  <link rel="icon" type="image/png" sizes="16x16" href="/yyc3-icons/favicon/favicon-16x16.png">'
echo '  <link rel="apple-touch-icon" href="/yyc3-icons/pwa/icon-192x192.png">'
echo '  <link rel="manifest" href="/manifest.json">'
echo ""
