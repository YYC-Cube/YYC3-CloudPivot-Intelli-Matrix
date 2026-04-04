#!/bin/bash

# ============================================================================
# YYC³ CloudPivot Intelli-Matrix - 本地预览脚本
# ============================================================================
# 用途：构建并在本地预览生产版本
# 使用：./scripts/preview.sh
# ============================================================================

set -e

PORT=${1:-3118}

echo "============================================"
echo "  YYC³ CloudPivot Intelli-Matrix"
echo "  本地预览"
echo "  端口：$PORT"
echo "============================================"
echo ""

# 安装依赖
echo "安装依赖..."
pnpm install --frozen-lockfile

# 构建
echo "构建项目..."
pnpm build

# 使用 http-server 预览
echo "启动本地服务器..."
if ! command -v http-server &> /dev/null; then
    echo "安装 http-server..."
    pnpm add -g http-server
fi

http-server dist -p $PORT -c-1 --cors

echo ""
echo "============================================"
echo "  预览地址：http://localhost:$PORT"
echo "============================================"
