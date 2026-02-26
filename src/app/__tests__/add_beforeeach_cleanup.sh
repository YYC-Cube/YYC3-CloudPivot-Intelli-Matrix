#!/bin/bash

# 批量为所有测试文件添加 beforeEach cleanup

files=(
  "DesignSystemPage.test.tsx"
  "LoopStageCard.test.tsx"
  "NodeDetailModal.test.tsx"
  "OperationChain.test.tsx"
  "PatrolReport.test.tsx"
  "StageReview.test.tsx"
  "AddModelModal.test.tsx"
  "ConnectionStatus.test.tsx"
  "DevGuidePage.test.tsx"
  "DesignTokens.test.tsx"
  "DataFlowDiagram.test.tsx"
  "FollowUpDrawer.test.tsx"
  "IDEPanel.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Adding beforeEach cleanup to $file..."
    # 检查是否已经有 beforeEach
    if ! grep -q "beforeEach" "$filepath"; then
      continue
    fi
    # 检查 beforeEach 中是否已经有 cleanup
    if grep -A 2 "beforeEach" "$filepath" | grep -q "cleanup()"; then
      continue
    fi
    # 在 beforeEach 中添加 cleanup
    perl -i -pe 's/(beforeEach\(\(\) => \{)/$1\n    cleanup();/' "$filepath"
  fi
done

echo "Done!"
