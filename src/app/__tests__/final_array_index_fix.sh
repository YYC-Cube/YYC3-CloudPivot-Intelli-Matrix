#!/bin/bash

# 最终修复脚本：修复所有剩余的数组索引问题

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
    echo "Processing $file..."

    # 修复所有 fireEvent.click(screen.getAllBy..." 或类似的语句
    # 查找模式：fireEvent.click(screen.getAllBy..." 或 fireEvent.click(screen.getAllBy...
    # 替换为：fireEvent.click(screen.getAllBy..."[0]) 或 fireEvent.click(screen.getAllBy...[0])

    # 使用sed进行替换
    sed -i '' 's/fireEvent\.click(screen\.getAllByText(\([^)]*\)")\)/fireEvent.click(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByTestId(\([^)]*\)")\)/fireEvent.click(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByRole(\([^)]*\)")\)/fireEvent.click(screen.getAllByRole(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByLabelText(\([^)]*\)")\)/fireEvent.click(screen.getAllByLabelText(\1)[0])/g' "$filepath"

    # 修复所有 fireEvent.change(screen.getAllBy..." 或类似的语句
    sed -i '' 's/fireEvent\.change(screen\.getAllByText(\([^)]*\)")\)/fireEvent.change(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByTestId(\([^)]*\)")\)/fireEvent.change(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByPlaceholderText(\([^)]*\)")\)/fireEvent.change(screen.getAllByPlaceholderText(\1)[0])/g' "$filepath"

    # 修复所有 fireEvent.keyDown(screen.getAllBy..." 或类似的语句
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByText(\([^)]*\)")\)/fireEvent.keyDown(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByTestId(\([^)]*\)")\)/fireEvent.keyDown(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByPlaceholderText(\([^)]*\)")\)/fireEvent.keyDown(screen.getAllByPlaceholderText(\1)[0])/g' "$filepath"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
