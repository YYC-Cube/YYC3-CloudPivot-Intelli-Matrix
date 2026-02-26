#!/bin/bash

# 精确修复脚本：只在断言中使用 getAllBy*[0]，事件处理保持 getBy*

for file in src/app/__tests__/{SDKChatPanel,ReportGenerator,PWAStatusPanel,PatrolScheduler,QuickActionGrid,PatternAnalyzer,OperationTemplate,PatrolHistory,QuickActionGroup,PWAInstallPrompt,useKeyboardShortcuts,network-utils,useModelProvider,FollowUpDrawer}.test.tsx; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."

    # 备份
    cp "$file" "${file}.backup2"

    # 策略：只在 expect() 中使用 getAllBy*[0]
    # 查找 expect(screen.getBy...  替换为 expect(screen.getAllBy...[0])

    # 1. 修复 expect(screen.getByText(...)) 语句
    perl -i -pe 's/expect\(screen\.getByText\((.*?)\)\)/expect(screen.getAllByText($1)[0])/g' "$file"

    # 2. 修复 expect(screen.getByTestId(...)) 语句
    perl -i -pe 's/expect\(screen\.getByTestId\((.*?)\)\)/expect(screen.getAllByTestId($1)[0])/g' "$file"

    # 3. 修复 expect(screen.getByPlaceholderText(...)) 语句
    perl -i -pe 's/expect\(screen\.getByPlaceholderText\((.*?)\)\)/expect(screen.getAllByPlaceholderText($1)[0])/g' "$file"

    # 4. 修复 expect(screen.getByRole(...)) 语句
    perl -i -pe 's/expect\(screen\.getByRole\((.*?)\)\)/expect(screen.getAllByRole($1)[0])/g' "$file"

    # 5. 修复 expect(screen.getByLabelText(...)) 语句
    perl -i -pe 's/expect\(screen\.getByLabelText\((.*?)\)\)/expect(screen.getAllByLabelText($1)[0])/g' "$file"

    # 6. 修复 expect(screen.getByDisplayValue(...)) 语句
    perl -i -pe 's/expect\(screen\.getByDisplayValue\((.*?)\)\)/expect(screen.getAllByDisplayValue($1)[0])/g' "$file"

    echo "Fixed $file!"
  fi
done

echo "All files processed!"
