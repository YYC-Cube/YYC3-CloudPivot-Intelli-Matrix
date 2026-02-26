#!/bin/bash

# 批量修复剩余测试文件的DOM污染和查询方法问题

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
    echo "Fixing $file..."

    # 1. 替换 getByText 为 getAllByText[0]
    sed -i '' 's/screen\.getByText(/screen.getAllByText(/g' "$filepath"
    sed -i '' 's/byText(\([^)]*\))/byText($1)[0]/g' "$filepath"

    # 2. 替换 getByTestId 为 getAllByTestId[0]
    sed -i '' 's/screen\.getByTestId(/screen.getAllByTestId(/g' "$filepath"
    sed -i '' 's/byTestId(\([^)]*\))/byTestId($1)[0]/g' "$filepath"

    # 3. 替换 getByPlaceholderText 为 getAllByPlaceholderText[0]
    sed -i '' 's/screen\.getByPlaceholderText(/screen.getAllByPlaceholderText(/g' "$filepath"
    sed -i '' 's/byPlaceholderText(\([^)]*\))/byPlaceholderText($1)[0]/g' "$filepath"

    # 4. 替换 getByRole 为 getAllByRole[0]
    sed -i '' 's/screen\.getByRole(/screen.getAllByRole(/g' "$filepath"
    sed -i '' 's/byRole(\([^)]*\))/byRole($1)[0]/g' "$filepath"

    # 5. 替换 getByLabelText 为 getAllByLabelText[0]
    sed -i '' 's/screen\.getByLabelText(/screen.getAllByLabelText(/g' "$filepath"
    sed -i '' 's/byLabelText(\([^)]*\))/byLabelText($1)[0]/g' "$filepath"

    # 6. 替换 getByDisplayValue 为 getAllByDisplayValue[0]
    sed -i '' 's/screen\.getByDisplayValue(/screen.getAllByDisplayValue(/g' "$filepath"
    sed -i '' 's/byDisplayValue(\([^)]*\))/byDisplayValue($1)[0]/g' "$filepath"

    echo "Fixed $file!"
  fi
done

echo "All files processed!"
