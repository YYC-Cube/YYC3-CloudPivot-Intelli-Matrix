#!/bin/bash

# 批量修复新增的测试文件 - 添加 afterEach 清理

files=(
  "Layout.test.tsx"
  "ServiceLoopPanel.test.tsx"
  "Sidebar.test.tsx"
  "SystemSettings.test.tsx"
  "TopBar.test.tsx"
  "UserManagement.test.tsx"
  "OperationAudit.test.tsx"
  "ThemeCustomizer.test.tsx"
  "NetworkConfig.test.tsx"
  "AIAssistant.test.tsx"
  "Dashboard.test.tsx"
  "PatrolDashboard.test.tsx"
)

cd "$(dirname "$0")"

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # 检查是否已经有 afterEach
    if grep -q "afterEach" "$file"; then
      echo "  Skipping - already has afterEach"
      continue
    fi
    
    # 在 describe 块后添加 afterEach
    perl -i -0pe 's/(describe\("[^"]+", \(\) => \{\n  beforeEach\(\(\) => \{\n    vi\.clearAllMocks\(\);\n  \}\);?\n?)/$1\n  afterEach(() => {\n    cleanup();\n  });\n\n/' "$file"
    
    echo "  Fixed $file"
  fi
done

echo "Done!"
