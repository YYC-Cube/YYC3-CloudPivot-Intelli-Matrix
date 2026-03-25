#!/bin/bash

# 批量修复所有测试文件中的beforeEach/afterEach结构问题

files=(
  "ReportGenerator.test.tsx"
  "QuickActionGroup.test.tsx"
  "QuickActionGrid.test.tsx"
  "PatrolHistory.test.tsx"
  "PatternAnalyzer.test.tsx"
  "OperationTemplate.test.tsx"
  "useKeyboardShortcuts.test.tsx"
  "PWAInstallPrompt.test.tsx"
  "network-utils.test.tsx"
  "useModelProvider.test.tsx"
  "PWAStatusPanel.test.tsx"
  "FollowUpDrawer.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Checking $file for beforeEach/afterEach issues..."

    # 检查是否有错误的结构：afterEach在beforeEach内部
    if grep -A 2 "beforeEach" "$filepath" | grep -q "afterEach"; then
      echo "  Found nested afterEach in $file"

      # 使用awk修复
      awk '
      BEGIN {
        inBeforeEach = 0
        inAfterEach = 0
        skipLine = 0
        beforeEachContent = ""
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
    fi
  fi
done

echo "All files processed!"
