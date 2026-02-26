#!/bin/bash

# 为每个测试文件添加 beforeEach 中的 cleanup 调用

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
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Adding cleanup to beforeEach in $file..."
    # 在 beforeEach 中添加 cleanup()
    perl -i -pe 's/(beforeEach\(\(\) => \{)/$1\n    cleanup();/' "$filepath"
  fi
done

echo "Done!"
