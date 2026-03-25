#!/bin/bash

# 简单修复脚本：手动处理常见问题

for file in src/app/__tests__/{ReportGenerator,QuickActionGroup,QuickActionGrid,PatrolHistory,PatternAnalyzer,OperationTemplate,useKeyboardShortcuts,PWAInstallPrompt,useModelProvider,PWAStatusPanel}.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # 只修复简单的模式：screen.getAllBy...") 改为 screen.getAllBy...")[0]
    perl -i -pe 's/(screen\.getAllBy\w+\([^)]+\)")/\1)[0]/g' "$file"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
