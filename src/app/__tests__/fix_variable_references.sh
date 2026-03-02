#!/bin/bash

# 修复所有测试文件中的变量引用问题：为getAllBy获取的变量添加[0]

for file in src/app/__tests__/{PatrolScheduler,ReportGenerator,QuickActionGroup,QuickActionGrid,PatrolHistory,PatternAnalyzer,OperationTemplate,useKeyboardShortcuts,PWAInstallPrompt,network-utils,useModelProvider,PWAStatusPanel,FollowUpDrawer}.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # 策略：为 const xxx = screen.getAllBy... 后续的 fireEvent.xxx(xxx) 添加 [0]
    # 使用awk进行更复杂的文本处理

    awk '
    {
      # 检查是否是 const variable = screen.getAllBy... 这一行
      if (/const [a-zA-Z]+ = screen\.getAllBy/) {
        # 提取变量名
        match($0, /const ([a-zA-Z]+) = /, matches);
        if (matches[1]) {
          currentVar = matches[1];
        }
      }
      else {
        # 检查是否是 fireEvent(currentVar) 这一行
        if (currentVar != "" && /fireEvent\.(click|change|keyDown|keyUp|focus|blur)\(/ && index($0, currentVar "(") > 0) {
          # 如果没有[0]，添加它
          if (!/\['"'"'"'0'"'"'\]/ && !/\[0\]/) {
            # 替换 fireEvent.method(variable) 为 fireEvent.method(variable[0])
            gsub(currentVar "\\(", currentVar "[0]\\(");
          }
        }
        # 重置变量
        currentVar = "";
      }
      print;
    }
    ' "$file" > "${file}.tmp"

    mv "${file}.tmp" "$file"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
