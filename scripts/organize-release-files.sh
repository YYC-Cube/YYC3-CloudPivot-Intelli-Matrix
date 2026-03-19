#!/bin/bash

set -e

DIST_ELECTRON="dist-electron"
RELEASE_DIR="releases"
ARCHIVE_DIR="archives"

echo "🗂  开始规范封装后文件分类..."

# 创建目录结构
mkdir -p "$RELEASE_DIR/macos"
mkdir -p "$RELEASE_DIR/windows"
mkdir -p "$RELEASE_DIR/linux"
mkdir -p "$ARCHIVE_DIR"

echo "📦 整理 macOS 安装包..."

# 移动 macOS DMG 文件
if [ -f "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-arm64.dmg" ]; then
    mv "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-arm64.dmg" "$RELEASE_DIR/macos/"
    echo "  ✅ 移动 macOS ARM64 DMG"
fi

if [ -f "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-x64.dmg" ]; then
    mv "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-x64.dmg" "$RELEASE_DIR/macos/"
    echo "  ✅ 移动 macOS x64 DMG"
fi

# 移动 blockmap 文件
if [ -f "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-arm64.dmg.blockmap" ]; then
    mv "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-arm64.dmg.blockmap" "$RELEASE_DIR/macos/"
    echo "  ✅ 移动 macOS ARM64 blockmap"
fi

if [ -f "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-x64.dmg.blockmap" ]; then
    mv "$DIST_ELECTRON/YYC³ CloudPivot-1.0.0-mac-x64.dmg.blockmap" "$RELEASE_DIR/macos/"
    echo "  ✅ 移动 macOS x64 blockmap"
fi

echo "📦 整理 Windows 安装包..."

# 移动 Windows 安装包（如果存在）
if ls "$DIST_ELECTRON"/*.exe 1> /dev/null 2>&1; then
    mv "$DIST_ELECTRON"/*.exe "$RELEASE_DIR/windows/"
    echo "  ✅ 移动 Windows 安装包"
fi

if ls "$DIST_ELECTRON"/*.nsis 1> /dev/null 2>&1; then
    mv "$DIST_ELECTRON"/*.nsis "$RELEASE_DIR/windows/"
    echo "  ✅ 移动 Windows NSIS 安装包"
fi

echo "📦 整理 Linux 安装包..."

# 移动 Linux 安装包（如果存在）
if ls "$DIST_ELECTRON"/*.AppImage 1> /dev/null 2>&1; then
    mv "$DIST_ELECTRON"/*.AppImage "$RELEASE_DIR/linux/"
    echo "  ✅ 移动 Linux AppImage"
fi

if ls "$DIST_ELECTRON"/*.deb 1> /dev/null 2>&1; then
    mv "$DIST_ELECTRON"/*.deb "$RELEASE_DIR/linux/"
    echo "  ✅ 移动 Linux DEB 包"
fi

if ls "$DIST_ELECTRON"/*.rpm 1> /dev/null 2>&1; then
    mv "$DIST_ELECTRON"/*.rpm "$RELEASE_DIR/linux/"
    echo "  ✅ 移动 Linux RPM 包"
fi

echo "📦 整理配置文件..."

# 移动配置文件到归档目录
if [ -f "$DIST_ELECTRON/builder-effective-config.yaml" ]; then
    mv "$DIST_ELECTRON/builder-effective-config.yaml" "$ARCHIVE_DIR/"
    echo "  ✅ 移动 builder 配置"
fi

if [ -f "$DIST_ELECTRON/builder-debug.yml" ]; then
    mv "$DIST_ELECTRON/builder-debug.yml" "$ARCHIVE_DIR/"
    echo "  ✅ 移动 builder 调试配置"
fi

if [ -f "$DIST_ELECTRON/latest-mac.yml" ]; then
    mv "$DIST_ELECTRON/latest-mac.yml" "$ARCHIVE_DIR/"
    echo "  ✅ 移动更新配置"
fi

echo "📦 整理临时文件..."

# 移动临时文件到归档目录
if [ -d "$DIST_ELECTRON/mac" ]; then
    rm -rf "$ARCHIVE_DIR/mac"
    mv "$DIST_ELECTRON/mac" "$ARCHIVE_DIR/"
    echo "  ✅ 移动临时 macOS 目录"
fi

echo ""
echo "✅ 文件分类完成！"
echo ""
echo "📂 目录结构:"
echo ""
echo "📦 releases/"
echo "  ├── macOS/"
ls -lh "$RELEASE_DIR/macos/" 2>/dev/null || echo "    (空)"
echo ""
echo "  ├── windows/"
ls -lh "$RELEASE_DIR/windows/" 2>/dev/null || echo "    (空)"
echo ""
echo "  └── linux/"
ls -lh "$RELEASE_DIR/linux/" 2>/dev/null || echo "    (空)"
echo ""
echo "📦 archives/"
ls -lh "$ARCHIVE_DIR/" 2>/dev/null || echo "  (空)"
echo ""
echo "📦 dist-electron/"
ls -lh "$DIST_ELECTRON/" 2>/dev/null || echo "  (空)"
