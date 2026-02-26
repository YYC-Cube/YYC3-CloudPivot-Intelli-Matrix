#!/bin/bash

# 智能修复脚本：只修复DOM污染和afterEach结构，不改变查询方法

files=(
  "SDKChatPanel.test.tsx"
  "ReportGenerator.test.tsx"
  "PWAStatusPanel.test.tsx"
  "PatrolScheduler.test.tsx"
  "QuickActionGrid.test.tsx"
  "PatternAnalyzer.test.tsx"
  "OperationTemplate.test.tsx"
  "PatrolHistory.test.tsx"
  "QuickActionGroup.test.tsx"
  "PWAInstallPrompt.test.tsx"
  "useKeyboardShortcuts.test.tsx"
  "network-utils.test.tsx"
  "useModelProvider.test.tsx"
  "FollowUpDrawer.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."

    # 备份
    cp "$filepath" "${filepath}.backup"

    # 1. 检查是否使用 cleanup 但没有导入
    if grep -q "cleanup()" "$filepath" && ! grep -q "import.*cleanup.*from.*@testing-library/react" "$filepath"; then
      echo "  Adding cleanup import to $file..."
      # 在 render 导入行添加 cleanup
      perl -i -pe 's/(import \{ render, screen, fireEvent, waitFor from "@testing-library\/react";)/import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library\/react";/' "$filepath"
    fi

    # 2. 检查是否使用 beforeEach/afterEach 但没有导入
    if grep -q "beforeEach\|afterEach" "$filepath" && ! grep -q "beforeEach.*from.*vitest\|afterEach.*from.*vitest" "$filepath"; then
      echo "  Adding beforeEach/afterEach imports to $file..."
      # 在 vitest 导入行添加 beforeEach/afterEach
      perl -i -pe 's/(import \{ describe, it, expect from "vitest";)/import { describe, it, expect, beforeEach, afterEach } from "vitest";/' "$filepath"
    fi

    # 3. 修复错误的 afterEach 结构
    # 删除 beforeEach 块内部的 afterEach
    awk '
    BEGIN {
      inBeforeEach = 0
      inAfterEach = 0
      skipLine = 0
    }

    /^  beforeEach\(\(\) => \{$/ {
      inBeforeEach = 1
      print
      next
    }

    inBeforeEach && /^  \};$/ {
      inBeforeEach = 0
      print
      next
    }

    inBeforeEach && /^  afterEach\(\(\) => \{$/ {
      inAfterEach = 1
      skipLine = 1
      next
    }

    inAfterEach && /^    \};$/ {
      inAfterEach = 0
      skipLine = 0
      next
    }

    skipLine { next }

    { print }
    ' "$filepath" > "${filepath}.tmp"

    mv "${filepath}.tmp" "$filepath"

    # 4. 如果有 describe 但没有顶层 beforeEach，添加
    if grep -q "^describe(" "$filepath" && ! grep -A 2 "^describe(" "$filepath" | grep -q "beforeEach(() =>"; then
      echo "  Adding top-level beforeEach/afterEach to $file..."

      # 在 describe 块后添加 beforeEach/afterEach
      perl -i -0pe 's/(describe\("[^"]+", \(\) => \{\n)/$1\n  beforeEach(() => {\n    cleanup();\n  });\n\n  afterEach(() => {\n    cleanup();\n  });\n\n/' "$filepath"
    fi

    echo "Processed $file!"
  fi
done

echo "All files processed!"
