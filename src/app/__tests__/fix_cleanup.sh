#!/bin/bash

# 批量修复测试文件的清理机制 - 确保所有测试文件都有正确的 afterEach 清理

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
    
    # 检查是否导入了 afterEach
    if ! grep -q "afterEach" "$filepath"; then
      echo "  Adding afterEach import..."
      sed -i '' 's/import { describe, it, expect, vi, beforeEach } from "vitest";/import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";/g' "$filepath"
    fi
    
    # 检查是否导入了 cleanup
    if ! grep -q "cleanup" "$filepath"; then
      echo "  Adding cleanup import..."
      sed -i '' 's/import { render, screen, fireEvent } from "@testing-library\/react";/import { render, screen, fireEvent, cleanup } from "@testing-library\/react";/g' "$filepath"
    fi
    
    # 检查是否已经有 afterEach 块
    if ! grep -q "afterEach(() =>" "$filepath"; then
      echo "  Adding afterEach cleanup block..."
      
      # 找到第一个 beforeEach 块并在其后添加 afterEach
      perl -i -0pe 's/(  beforeEach\(\(\) => \{\n    vi\.clearAllMocks\(\);\n  \}\);)/$1\n\n  afterEach(() => {\n    cleanup();\n  });/' "$filepath"
    fi
    
    # 如果 cleanup 在 beforeEach 中，将其移除
    if grep -q 'beforeEach' "$filepath" && grep -q 'cleanup()' "$filepath" && ! grep -q 'afterEach' "$filepath"; then
      echo "  Moving cleanup from beforeEach to afterEach..."
      sed -i '' '/beforeEach/,/}/s/cleanup();/vi.clearAllMocks();/' "$filepath"
    fi
    
    echo "  Done with $file"
  fi
done

echo "All files processed!"
