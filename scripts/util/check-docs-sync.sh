#!/bin/bash

# 封装文档更新检查脚本
# 用途：检查项目代码更新后，封装文档是否需要同步更新

set -e

echo "🔍 检查封装文档更新需求..."
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs/03-YYC3-CP-IM-项目开发-实施阶段/0306-CP-IM-集成指南"
PACKAGE_JSON="$PROJECT_ROOT/package.json"
VITE_CONFIG="$PROJECT_ROOT/vite.config.ts"
ELECTRON_MAIN="$PROJECT_ROOT/electron/main.ts"

echo "📁 项目根目录: $PROJECT_ROOT"
echo "📄 文档目录: $DOCS_DIR"
echo ""

# 检查函数
check_version() {
    local doc_file="$1"
    local current_version=$(grep -o '"version":\s*"[^"]*"' "$PACKAGE_JSON" | head -1 | cut -d'"' -f4)

    if [ -f "$doc_file" ]; then
        local doc_version=$(grep -o '版本.*[0-9]\+\.[0-9]\+\.[0-9]\+' "$doc_file" | head -1 | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' || echo "未找到")

        if [ "$current_version" != "$doc_version" ]; then
            echo -e "${YELLOW}⚠️  版本号不匹配${NC}"
            echo "   当前版本: $current_version"
            echo "   文档版本: $doc_version"
            echo "   文档: $doc_file"
            return 1
        else
            echo -e "${GREEN}✅ 版本号一致${NC}"
            return 0
        fi
    fi
}

check_dependencies() {
    local doc_file="$1"

    if [ -f "$doc_file" ]; then
        local electron_version=$(grep -o '"electron":\s*"[^"]*"' "$PACKAGE_JSON" | cut -d'"' -f4)
        local react_version=$(grep -o '"react":\s*"[^"]*"' "$PACKAGE_JSON" | cut -d'"' -f4)
        local vite_version=$(grep -o '"vite":\s*"[^"]*"' "$PACKAGE_JSON" | cut -d'"' -f4)

        echo "   当前依赖版本:"
        echo "   - Electron: $electron_version"
        echo "   - React: $react_version"
        echo "   - Vite: $vite_version"

        # 检查文档中是否提到了这些版本
        if grep -q "Electron.*$electron_version" "$doc_file"; then
            echo -e "${GREEN}   ✅ Electron 版本匹配${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Electron 版本可能需要更新${NC}"
        fi

        if grep -q "React.*$react_version" "$doc_file"; then
            echo -e "${GREEN}   ✅ React 版本匹配${NC}"
        else
            echo -e "${YELLOW}   ⚠️  React 版本可能需要更新${NC}"
        fi

        if grep -q "Vite.*$vite_version" "$doc_file"; then
            echo -e "${GREEN}   ✅ Vite 版本匹配${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Vite 版本可能需要更新${NC}"
        fi
    fi
}

check_project_structure() {
    local doc_file="$1"

    if [ -f "$doc_file" ]; then
        echo "   检查项目结构..."

        # 检查关键目录是否存在
        local required_dirs=("electron" "src" "dist" "public")
        for dir in "${required_dirs[@]}"; do
            if [ -d "$PROJECT_ROOT/$dir" ]; then
                if grep -q "$dir" "$doc_file"; then
                    echo -e "${GREEN}   ✅ $dir 目录存在且文档已记录${NC}"
                else
                    echo -e "${YELLOW}   ⚠️  $dir 目录存在但文档未提及${NC}"
                fi
            else
                if grep -q "$dir" "$doc_file"; then
                    echo -e "${RED}   ❌ $dir 目录不存在但文档中提及${NC}"
                fi
            fi
        done
    fi
}

check_build_config() {
    local doc_file="$1"

    if [ -f "$doc_file" ] && [ -f "$VITE_CONFIG" ]; then
        echo "   检查构建配置..."

        # 检查端口配置
        local vite_port=$(grep -o "port.*[0-9]\+" "$VITE_CONFIG" | head -1 | grep -o "[0-9]\+" || echo "3218")
        if grep -q "$vite_port" "$doc_file"; then
            echo -e "${GREEN}   ✅ 端口配置匹配 ($vite_port)${NC}"
        else
            echo -e "${YELLOW}   ⚠️  端口配置可能需要更新 (当前: $vite_port)${NC}"
        fi

        # 检查构建输出目录
        if grep -q "dist/" "$doc_file"; then
            echo -e "${GREEN}   ✅ 构建输出目录匹配${NC}"
        else
            echo -e "${YELLOW}   ⚠️  构建输出目录可能需要更新${NC}"
        fi
    fi
}

# 主检查流程
echo "📋 检查 1: 版本号"
echo "----------------------------------------"
check_version "$DOCS_DIR/014-CP-IM-开发实施阶段-桌面应用最终封装报告.md"
echo ""

echo "📋 检查 2: 依赖版本"
echo "----------------------------------------"
check_dependencies "$DOCS_DIR/006-CP-IM-开发实施阶段-桌面应用封装操作指南.md"
echo ""

echo "📋 检查 3: 项目结构"
echo "----------------------------------------"
check_project_structure "$DOCS_DIR/006-CP-IM-开发实施阶段-桌面应用封装操作指南.md"
echo ""

echo "📋 检查 4: 构建配置"
echo "----------------------------------------"
check_build_config "$DOCS_DIR/006-CP-IM-开发实施阶段-桌面应用封装操作指南.md"
echo ""

echo "================================"
echo "✅ 检查完成！"
echo ""
echo "💡 建议："
echo "   1. 定期运行此脚本检查文档同步状态"
echo "   2. 在每次发布前更新版本号"
echo "   3. 在依赖升级后更新技术栈版本"
echo "   4. 在项目结构变化后更新项目结构说明"
