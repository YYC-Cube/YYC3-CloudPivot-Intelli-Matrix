#!/bin/bash

# 批量修复所有文件中的 fireEvent.click(screen.getAllBy...) 问题

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
    echo "Fixing fireEvent.getAllBy in $file..."

    # 修复 fireEvent.click(screen.getAllBy...)
    sed -i '' 's/fireEvent\.click(screen\.getAllByText(\([^)]*\)));/fireEvent.click(screen.getAllByText(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByTestId(\([^)]*\)));/fireEvent.click(screen.getAllByTestId(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByPlaceholderText(\([^)]*\)));/fireEvent.click(screen.getAllByPlaceholderText(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByRole(\([^)]*\)));/fireEvent.click(screen.getAllByRole(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByLabelText(\([^)]*\)));/fireEvent.click(screen.getAllByLabelText(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByDisplayValue(\([^)]*\)));/fireEvent.click(screen.getAllByDisplayValue(\1)[0]);/g' "$filepath"

    # 修复 fireEvent.change(screen.getAllBy...)
    sed -i '' 's/fireEvent\.change(screen\.getAllByText(\([^)]*\)));/fireEvent.change(screen.getAllByText(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByTestId(\([^)]*\)));/fireEvent.change(screen.getAllByTestId(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByPlaceholderText(\([^)]*\)));/fireEvent.change(screen.getAllByPlaceholderText(\1)[0]);/g' "$filepath"

    # 修复 fireEvent.keyDown(screen.getAllBy...)
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByText(\([^)]*\)));/fireEvent.keyDown(screen.getAllByText(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByTestId(\([^)]*\)));/fireEvent.keyDown(screen.getAllByTestId(\1)[0]);/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByPlaceholderText(\([^)]*\)));/fireEvent.keyDown(screen.getAllByPlaceholderText(\1)[0]);/g' "$filepath"

    echo "Fixed $file!"
  fi
done

echo "All files fixed!"
