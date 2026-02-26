#!/bin/bash

# 修复事件处理中的数组问题：为 fireEvent 和 userEvent 的参数添加 [0]

for file in src/app/__tests__/{SDKChatPanel,ReportGenerator,PWAStatusPanel,PatrolScheduler,QuickActionGrid,PatternAnalyzer,OperationTemplate,PatrolHistory,QuickActionGroup,PWAInstallPrompt,useKeyboardShortcuts,network-utils,useModelProvider,FollowUpDrawer}.test.tsx; do
  if [ -f "$file" ]; then
    echo "Fixing event handlers in $file..."

    # 修复 fireEvent.click(getAllBy...) -> fireEvent.click(getAllBy...[0])
    perl -i -pe 's/(fireEvent\.click\(screen\.getAllBy)(Text|TestId|PlaceholderText|Role|LabelText|DisplayValue)\((.*?)\);)/$1$2($3)[0]);/g' "$file"

    # 修复 fireEvent.click(variable) where variable is from getAllBy...
    # 这需要更复杂的处理，我们手动处理特定模式

    # 修复 fireEvent.change(getAllBy...) -> fireEvent.change(getAllBy...[0])
    perl -i -pe 's/(fireEvent\.change\(screen\.getAllBy)(Text|TestId|PlaceholderText|Role|LabelText|DisplayValue)\((.*?)\);)/$1$2($3)[0]);/g' "$file"

    # 修复 fireEvent.keyDown(getAllBy...) -> fireEvent.keyDown(getAllBy...[0])
    perl -i -pe 's/(fireEvent\.keyDown\(screen\.getAllBy)(Text|TestId|PlaceholderText|Role|LabelText|DisplayValue)\((.*?)\);)/$1$2($3)[0]);/g' "$file"

    echo "Fixed $file!"
  fi
done

echo "All event handlers fixed!"
