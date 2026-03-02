#!/bin/bash

# 批量修复测试文件中的 GlassCard mock

cd "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

# 修复重复的 default 语句
find . -name "*.test.tsx" -exec sed -i '' 's/default: (\n  default:/default: (/g' {} \;

# 修复 GlassCard mock 语法
find . -name "*.test.tsx" -exec sed -i '' '
/vi\.mock.*GlassCard/,/});/ {
  s/GlassCard: ({ children, className }: any) => <div className={className}>{children}<\/div>,/default: ({ children, className }: any) => <div className={className}>{children}<\/div>,/
}
' {} \;

echo "✅ Fixed all GlassCard mocks"
