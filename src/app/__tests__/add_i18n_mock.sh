#!/bin/bash

# 批量为测试文件添加 i18n mock

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
  "IDEPanel.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Adding i18n mock to $file..."
    # 检查是否已经有 i18n mock
    if grep -q "useI18n" "$filepath"; then
      # 如果已经有 useI18n 导入，检查是否有 mock
      if ! grep -q "vi.mock.*useI18n" "$filepath"; then
        # 在 vi.mock 之后添加 i18n mock
        perl -i -0pe 's/(vi\.mock\("react-router", \(\) => \{)/const mockT = (key: string) => key;\n\nvi\.mock("\.\.\/hooks\/useI18n", \(\) => \(\{\n  useI18n: \(\) => \(\{ t: mockT \}\),\n\}\));\n\n$1/' "$filepath"
      fi
    fi
  fi
done

echo "Done!"
