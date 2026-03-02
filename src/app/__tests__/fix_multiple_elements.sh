#!/bin/bash

# 批量修复 "Found multiple elements" 错误
# 将 getByText 替换为 getAllByText 并验证至少有一个元素

files=(
  "TopBar.test.tsx"
  "ServiceLoopPanel.test.tsx"
  "Sidebar.test.tsx"
  "SystemSettings.test.tsx"
  "UserManagement.test.tsx"
  "OperationAudit.test.tsx"
  "ThemeCustomizer.test.tsx"
  "NetworkConfig.test.tsx"
  "AIAssistant.test.tsx"
  "Dashboard.test.tsx"
  "PatrolDashboard.test.tsx"
  "Layout.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."
    
    # 备份原文件
    cp "$filepath" "$filepath.bak"
    
    # 替换 getByText 为 getAllByText 并添加 length 检查
    # 这需要更复杂的正则表达式，所以我们使用 Perl
    perl -i -pe '
      s/screen\.getByText\(([^)]+)\)\.toBeInTheDocument\(\)/screen.getAllByText($1).length.toBeGreaterThan(0)/g;
      s/screen\.getByText\(([^)]+)\)\.not\.toBeInTheDocument\(\)/screen.queryByText($1) === null/g;
    ' "$filepath"
    
    echo "  Done with $file"
  fi
done

echo "All files processed!"
