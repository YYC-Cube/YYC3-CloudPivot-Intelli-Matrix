#!/bin/bash

# 批量添加 afterEach cleanup 到测试文件

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
    echo "Processing $file..."
    
    # 检查是否已经有 afterEach
    if grep -q "afterEach" "$file"; then
      echo "  Skipping - already has afterEach"
      continue
    fi
    
    # 在 describe 块后添加 afterEach
    perl -i -0pe 's/(describe\("[^"]+", \(\) => \{\n  beforeEach\(\(\) => \{\n    vi\.clearAllMocks\(\);\n  \}\);?\n?)/$1\n  afterEach(() => {\n    cleanup();\n  });\n\n/' "$file"
    
    echo "  Added afterEach to $file"
  fi
done

echo "Done!"
