#!/bin/bash

# YYC³ Git Hooks Setup Script
# ============================
# 安装 Git hooks 到 .git/hooks/ 目录

echo "🔧 Setting up YYC³ Git hooks..."

# 创建 .git/hooks 目录（如果不存在）
mkdir -p .git/hooks

# 复制 pre-commit hook
cp scripts/git-hooks/pre-commit .git/hooks/pre-commit

# 设置执行权限
chmod +x .git/hooks/pre-commit

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Check YYC³ code header standards"
echo ""
echo "To bypass hooks (not recommended), use:"
echo "  git commit --no-verify"
