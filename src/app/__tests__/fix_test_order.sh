#!/bin/bash

# 修复 beforeEach 和 afterEach 顺序问题

files=(
  "useServiceLoop.test.tsx"
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
    # 使用 sed 修复 beforeEach 和 afterEach 的顺序
    # 将 beforeEach { \n afterEach { 改为 beforeEach { \n ... \n } \n afterEach {
    perl -i -0777 -pe 's/(beforeEach\s*\(\)\s*\{)\s*(afterEach\s*\(\)\s*\{)/$1\n    vi.clearAllMocks();\n  });\n\n  afterEach(/g' "$filepath"
  fi
done

echo "Done!"
