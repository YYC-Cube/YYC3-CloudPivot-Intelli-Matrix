#!/bin/bash

# 批量修复所有测试文件中的常见问题

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
    echo "Processing $file..."

    # 1. 修复所有 expect(variable.property) 为 expect(variable[0].property)
    # 常见变量名：toggle, button, item, tab, btn, input, textarea, checkbox, select, radio, slider, switch, activeBtn, closeButtons, backdrop, etc.
    for var in toggle button item tab btn input textarea checkbox select radio slider switch activeBtn closeButtons backdrop dropdown menu option; do
      # 匹配模式：expect(variable.property) 但不包括 expect(variable[0].property)
      sed -i '' "s/expect($var\\.\([a-zA-Z]*\))/expect($var[0].\1)/g" "$filepath"
    done

    # 2. 修复 fireEvent.click(screen.getAllBy...) 语句
    sed -i '' 's/fireEvent\.click(screen\.getAllByText(\([^)]*\)))/fireEvent.click(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByTestId(\([^)]*\)))/fireEvent.click(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByRole(\([^)]*\)))/fireEvent.click(screen.getAllByRole(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.click(screen\.getAllByLabelText(\([^)]*\)))/fireEvent.click(screen.getAllByLabelText(\1)[0])/g' "$filepath"

    # 3. 修复 fireEvent.change(screen.getAllBy...) 语句
    sed -i '' 's/fireEvent\.change(screen\.getAllByText(\([^)]*\)))/fireEvent.change(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByTestId(\([^)]*\)))/fireEvent.change(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.change(screen\.getAllByPlaceholderText(\([^)]*\)))/fireEvent.change(screen.getAllByPlaceholderText(\1)[0])/g' "$filepath"

    # 4. 修复 fireEvent.keyDown(screen.getAllBy...) 语句
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByText(\([^)]*\)))/fireEvent.keyDown(screen.getAllByText(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByTestId(\([^)]*\)))/fireEvent.keyDown(screen.getAllByTestId(\1)[0])/g' "$filepath"
    sed -i '' 's/fireEvent\.keyDown(screen\.getAllByPlaceholderText(\([^)]*\)))/fireEvent.keyDown(screen.getAllByPlaceholderText(\1)[0])/g' "$filepath"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
