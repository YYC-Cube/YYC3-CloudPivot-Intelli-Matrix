#!/bin/bash

set -e

ICON_DIR="public/icons"
ICNS_FILE="public/icons/icon.icns"
TEMP_DIR="temp_iconset"

echo "🔧 开始生成 macOS 图标文件..."

# 检查源图标文件
if [ ! -f "$ICON_DIR/1024.png" ]; then
    echo "❌ 错误: 找不到源图标文件 $ICON_DIR/1024.png"
    exit 1
fi

# 创建临时目录
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# 创建 iconset 目录
ICONSET="$TEMP_DIR/Icon.iconset"
mkdir -p "$ICONSET"

# 复制并重命名图标文件到 iconset
echo "📦 复制图标文件..."
cp "$ICON_DIR/16.png" "$ICONSET/icon_16x16.png"
cp "$ICON_DIR/32.png" "$ICONSET/icon_16x16@2x.png"
cp "$ICON_DIR/32.png" "$ICONSET/icon_32x32.png"
cp "$ICON_DIR/64.png" "$ICONSET/icon_32x32@2x.png"
cp "$ICON_DIR/128.png" "$ICONSET/icon_128x128.png"
cp "$ICON_DIR/256.png" "$ICONSET/icon_128x128@2x.png"
cp "$ICON_DIR/256.png" "$ICONSET/icon_256x256.png"
cp "$ICON_DIR/512.png" "$ICONSET/icon_256x256@2x.png"
cp "$ICON_DIR/512.png" "$ICONSET/icon_512x512.png"
cp "$ICON_DIR/1024.png" "$ICONSET/icon_512x512@2x.png"

# 生成 .icns 文件
echo "🎨 生成 .icns 文件..."
iconutil -c icns "$ICONSET" -o "$ICNS_FILE"

# 清理临时目录
rm -rf "$TEMP_DIR"

echo "✅ macOS 图标文件已生成: $ICNS_FILE"
echo ""
echo "📋 图标文件信息:"
ls -lh "$ICNS_FILE"
