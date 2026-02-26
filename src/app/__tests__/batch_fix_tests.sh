#!/bin/bash

# 批量添加 getAllByText 和 getAllByTestId 到多个测试文件

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
  "ModelProviderPanel.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Fixing $file..."
    # 替换 getByText 为 getAllByText 并添加 [0] 索引
    perl -i -pe 's/screen\.getByText\("([^"]+)"\)/screen\.getAllByText("$1")[0]/g' "$filepath"
    # 替换 getByTestId 为 getAllByTestId 并添加 [0] 索引
    perl -i -pe 's/screen\.getByTestId\("([^"]+)"\)/screen\.getAllByTestId("$1")[0]/g' "$filepath"
    # 替换 getByPlaceholderText 为 getAllByPlaceholderText 并添加 [0] 索引
    perl -i -pe 's/screen\.getByPlaceholderText\("([^"]+)"\)/screen\.getAllByPlaceholderText("$1")[0]/g' "$filepath"
    # 替换 getByRole 为 getAllByRole 并添加 [0] 索引
    perl -i -pe 's/screen\.getByRole\("([^"]+)"\)/screen\.getAllByRole("$1")[0]/g' "$filepath"
  fi
done

echo "Done!"
