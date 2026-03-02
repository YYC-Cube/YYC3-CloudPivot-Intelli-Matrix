#!/bin/bash

# 批量修复测试文件中的导入路径 - 将 src/app/ 替换为 ../

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

cd "$(dirname "$0")"

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # 替换 vi.mock 中的 src/app/ 为 ../
    perl -i -pe 's/vi\.mock\("src\/app\//vi.mock("..\\//g' "$file"
    
    # 替换 import 中的 src/app/ 为 ../
    perl -i -pe 's/from "src\/app\//from "..\\//g' "$file"
    
    echo "  Fixed $file"
  fi
done

echo "Done!"
