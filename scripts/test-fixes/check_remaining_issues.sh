#!/bin/bash

# 修复所有测试文件中fireEvent.click(getAllBy...) 语句的剩余问题

files=(
  "PatrolScheduler.test.tsx"
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
    echo "Checking $file for remaining issues..."

    # 检查是否还有未修复的 fireEvent.click(getAllBy...) 语句
    if grep -q "fireEvent\.click(screen\.getAllBy" "$filepath"; then
      echo "  Found issues in $file"
    fi

    # 检查是否还有 fireEvent.click(variable) where variable is from getAllBy...
    if grep -E "const (toggle|button|item|tab) = screen\.getAllBy" "$filepath" | grep -q "fireEvent"; then
      echo "  Found variable issues in $file"
    fi
  fi
done

echo "Check complete!"
