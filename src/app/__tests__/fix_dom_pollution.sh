#!/bin/bash

# 批量修复 DOM 污染问题 - 为每个测试添加更严格的隔离

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
    echo "Adding strict cleanup to $file..."
    # 在每个测试用例前添加 cleanup
    perl -i -0pe 's/(describe\("([^"]+)", \n)/describe("$1", () => {\n  beforeEach(() => {\n    cleanup();\n    vi.clearAllMocks();\n  });\n\n/g' "$filepath"
  fi
done

echo "Done!"
