#!/bin/bash

# 批量修复所有测试文件的 beforeEach 和 afterEach 顺序问题

files=(
  "AddModelModal.test.tsx"
  "ComponentShowcase.test.tsx"
  "ConnectionStatus.test.tsx"
  "DataFlowDiagram.test.tsx"
  "DesignSystemPage.test.tsx"
  "DesignTokens.test.tsx"
  "DevGuidePage.test.tsx"
  "LoopStageCard.test.tsx"
  "NodeDetailModal.test.tsx"
  "OperationChain.test.tsx"
  "PatrolReport.test.tsx"
  "StageReview.test.tsx"
  "CommandPalette.test.tsx"
  "IDEPanel.test.tsx"
  "FollowUpDrawer.test.tsx"
  "FollowUpCard.test.tsx"
  "FileBrowser.test.tsx"
  "ErrorBoundary.test.tsx"
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
