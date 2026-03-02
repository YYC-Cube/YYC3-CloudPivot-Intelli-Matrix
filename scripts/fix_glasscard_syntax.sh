#!/bin/bash

# 精确修复被破坏的 GlassCard mock 语法

cd "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

# 修复模式 1: 多行的错误语法
find . -name "*.test.tsx" -exec perl -i -0pe 's/vi\.mock\("\.\.\/components\/GlassCard", \(\) => \({\s*default:\s*\(\s*\n\s*GlassCard: ([^}]+}\)\s*\}\)\);/vi.mock("..\/components\/GlassCard", () => ({\n  default: ({ children, className }: any) => <div className={className}>{children}<\/div>,\n}));/gs' {} \;

# 修复模式 2: React.createElement 版本
find . -name "*.test.tsx" -exec perl -i -0pe 's/vi\.mock\("\.\.\/components\/GlassCard", \(\) => \({\s*default:\s*\(\s*\n\s*GlassCard: ([^}]+}\)\s*\}\)\);/vi.mock("..\/components\/GlassCard", () => ({\n  default: ({ children }: any) => <div className="glass-card">{children}<\/div>,\n}));/gs' {} \;

echo "✅ Fixed all GlassCard mock syntax errors"
