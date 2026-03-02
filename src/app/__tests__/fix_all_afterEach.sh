#!/bin/bash

# 批量添加 afterEach 到所有新增测试文件

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
    
    # 检查是否已经有 afterEach
    if grep -q "afterEach" "$filepath"; then
      echo "  Skipping - already has afterEach"
      continue
    fi
    
    # 在 describe 块内的 beforeEach 后添加 afterEach
    perl -i -0pe 's/(describe\("[^"]+", \(\) => \{\n  beforeEach\(\(\) => \{\n    vi\.clearAllMocks\(\);\n  \}\);?\n?)/$1\n  afterEach(() => {\n    cleanup();\n  });\n\n/' "$filepath"
    
    echo "  Added afterEach to $file"
  fi
done

echo "Done!"
