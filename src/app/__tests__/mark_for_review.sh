#!/bin/bash

# 批量使用 getAllByText 替代 getByText 处理多个元素

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
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."
    # 替换 getByText 为 getAllByText 并添加 [0] 索引
    # 注意：这需要手动检查每个使用场景，可能需要不同的处理方式
    # 这里只是标记文件，需要手动检查和修复
    echo "  - File marked for manual review: $file"
  fi
done

echo "Done! Please manually review and fix each file."
