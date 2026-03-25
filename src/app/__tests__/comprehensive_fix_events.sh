#!/bin/bash

# 全面修复脚本：修复所有文件中的事件处理数组问题

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
    echo "Fixing event handlers in $file..."

    # 修复所有 fireEvent.* 和 userEvent.* 调用中的变量参数
    # 常见的变量名：btn, button, input, textarea, checkbox, select, etc.

    # 方法1：直接修复特定变量名
    for var in btn button input textarea checkbox select radio slider switch tab item row cell; do
      sed -i '' "s/fireEvent\.click($var);/fireEvent.click($var[0]);/g" "$filepath"
      sed -i '' "s/fireEvent\.change($var,/fireEvent.change($var[0],/g" "$filepath"
      sed -i '' "s/fireEvent\.keyDown($var,/fireEvent.keyDown($var[0],/g" "$filepath"
      sed -i '' "s/fireEvent\.keyUp($var,/fireEvent.keyUp($var[0],/g" "$filepath"
      sed -i '' "s/fireEvent\.focus($var);/fireEvent.focus($var[0]);/g" "$filepath"
      sed -i '' "s/fireEvent\.blur($var);/fireEvent.blur($var[0]);/g" "$filepath"

      sed -i '' "s/userEvent\.click($var);/userEvent.click($var[0]);/g" "$filepath"
      sed -i '' "s/userEvent\.type($var,/userEvent.type($var[0],/g" "$filepath"
      sed -i '' "s/userEvent\.clear($var);/userEvent.clear($var[0]);/g" "$filepath"
      sed -i '' "s/userEvent\.selectOptions($var,/userEvent.selectOptions($var[0],/g" "$filepath"
    done

    echo "Fixed $file!"
  fi
done

echo "All event handlers fixed!"
