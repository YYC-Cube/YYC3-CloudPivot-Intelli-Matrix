#!/bin/bash

# 批量修复 afterEach 导入问题

files=(
  "usePWAManager.test.tsx"
  "usePatrol.test.tsx"
  "useOperationCenter.test.tsx"
  "useModelProvider.test.tsx"
  "useLocalFileSystem.test.tsx"
  "useI18n.test.tsx"
  "useFollowUp.test.tsx"
  "useAISuggestion.test.tsx"
  "SDKChatPanel.test.tsx"
  "ReportGenerator.test.tsx"
  "QuickActionGroup.test.tsx"
  "QuickActionGrid.test.tsx"
  "PWAStatusPanel.test.tsx"
  "PWAInstallPrompt.test.tsx"
  "PatternAnalyzer.test.tsx"
  "PatrolScheduler.test.tsx"
  "PatrolHistory.test.tsx"
  "OperationTemplate.test.tsx"
  "OperationLogStream.test.tsx"
  "OperationCategory.test.tsx"
  "OfflineIndicator.test.tsx"
  "ModelProviderPanel.test.tsx"
  "LogViewer.test.tsx"
  "Login.test.tsx"
  "IDEPanel.test.tsx"
  "FollowUpDrawer.test.tsx"
  "FollowUpCard.test.tsx"
  "FileBrowser.test.tsx"
  "ErrorBoundary.test.tsx"
  "CommandPalette.test.tsx"
  "BottomNav.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Fixing $file..."
    # 检查是否需要添加 afterEach 导入
    if grep -q "afterEach" "$filepath" && ! grep -q "import.*afterEach" "$filepath"; then
      # 在 vitest 导入中添加 afterEach
      perl -i -pe 's/(import.*from "vitest";)/$1\nimport { afterEach } from "vitest";/' "$filepath"
    fi
    # 检查是否需要添加 cleanup 导入
    if grep -q "cleanup()" "$filepath" && ! grep -q "import.*cleanup" "$filepath"; then
      # 在 @testing-library/react 导入中添加 cleanup
      perl -i -pe 's/(import.*from "@testing-library\/react";)/$1\nimport { cleanup } from "@testing-library\/react";/' "$filepath"
    fi
  fi
done

echo "Done!"
