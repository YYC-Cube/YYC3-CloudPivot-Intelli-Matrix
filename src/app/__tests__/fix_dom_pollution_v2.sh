#!/bin/bash

# 批量修复 DOM 污染问题 - 为每个测试文件添加 beforeEach 中的 cleanup

files=(
  "DataFlowDiagram.test.tsx"
  "DesignSystemPage.test.tsx"
  "FileBrowser.test.tsx"
  "FollowUpCard.test.tsx"
  "FollowUpDrawer.test.tsx"
  "LoopStageCard.test.tsx"
  "NodeDetailModal.test.tsx"
  "OperationChain.test.tsx"
  "PatrolReport.test.tsx"
  "StageReview.test.tsx"
  "AddModelModal.test.tsx"
  "ConnectionStatus.test.tsx"
  "DevGuidePage.test.tsx"
  "DesignTokens.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Fixing $file..."
    # 检查是否已经有 beforeEach 中的 cleanup
    if ! grep -q "beforeEach" "$filepath"; then
      # 如果没有 beforeEach，跳过
      continue
    fi
    # 检查 beforeEach 中是否已经有 cleanup
    if grep -A 3 "beforeEach" "$filepath" | grep -q "cleanup()"; then
      # 如果已经有 cleanup，跳过
      continue
    fi
    # 在 beforeEach 中添加 cleanup
    perl -i -pe 's/(beforeEach\(\(\) => \{)/$1\n    cleanup();/' "$filepath"
  fi
done

echo "Done!"
