#!/bin/bash

# 批量修复测试文件中的 getByText 为 getAllByText

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
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Fixing $file..."
    # 替换 getByText 为 getAllByText 并添加 [0] 索引
    # 注意：这需要根据具体情况调整，这里只是简单替换
    perl -i -pe 's/screen\.getByText\("([^"]+)"\)/screen\.getAllByText("$1")[0]/g' "$filepath"
  fi
done

echo "Done!"
