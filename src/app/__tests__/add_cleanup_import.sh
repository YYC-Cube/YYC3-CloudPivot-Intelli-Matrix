#!/bin/bash

# 批量添加 cleanup 导入到测试文件

files=(
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
  "ModelProviderPanel.test.tsx"
  "OfflineIndicator.test.tsx"
  "OperationCategory.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    # 检查是否使用 cleanup 但没有导入
    if grep -q "cleanup()" "$filepath" && ! grep -q "import.*cleanup.*from.*@testing-library/react" "$filepath"; then
      echo "Adding cleanup import to $file..."
      # 在 render 导入行添加 cleanup
      perl -i -pe 's/(import \{ render, screen, fireEvent, waitFor from "@testing-library\/react";)/import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library\/react";/' "$filepath"
    fi
  fi
done

echo "Done!"
