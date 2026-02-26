#!/bin/bash

# 完整的批量修复脚本 - 修复所有测试文件的结构问题和查询方法

files=(
  "OperationChain.test.tsx"
  "PatrolReport.test.tsx"
  "StageReview.test.tsx"
  "NodeDetailModal.test.tsx"
  "DevGuidePage.test.tsx"
  "DesignTokens.test.tsx"
  "DataFlowDiagram.test.tsx"
  "AddModelModal.test.tsx"
  "ConnectionStatus.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."

    # 备份
    cp "$filepath" "${filepath}.bak"

    # 1. 检查是否使用 cleanup 但没有导入
    if grep -q "cleanup()" "$filepath" && ! grep -q "import.*cleanup.*from.*@testing-library/react" "$filepath"; then
      echo "  Adding cleanup import to $file..."
      # 在 render 导入行添加 cleanup
      perl -i -pe 's/(import \{ render, screen, fireEvent, waitFor from "@testing-library\/react";)/import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library\/react";/' "$filepath"
    fi

    # 2. 检查是否使用 beforeEach/afterEach 但没有导入
    if grep -q "beforeEach" "$filepath" && ! grep -q "beforeEach.*from.*vitest" "$filepath"; then
      echo "  Adding beforeEach/afterEach imports to $file..."
      # 在 vitest 导入行添加 beforeEach/afterEach
      perl -i -pe 's/(import \{ describe, it, expect from "vitest";)/import { describe, it, expect, beforeEach, afterEach } from "vitest";/' "$filepath"
    fi

    # 3. 删除 describe 内部的 afterEach 块（如果有重复）
    # 查找并删除 beforeEach 块内的 afterEach
    awk '
    BEGIN {
      inBeforeEach = 0
      inAfterEach = 0
      skipLine = 0
    }

    /^  beforeEach\(\(\) => \{$/ {
      inBeforeEach = 1
      print
      next
    }

    inBeforeEach && /^  \}\);$/ {
      inBeforeEach = 0
      print
      next
    }

    inBeforeEach && /^  afterEach\(\(\) => \{$/ {
      inAfterEach = 1
      skipLine = 1
      next
    }

    inAfterEach && /^    \};$/ {
      inAfterEach = 0
      skipLine = 0
      next
    }

    skipLine { next }

    { print }
    ' "$filepath" > "${filepath}.tmp"

    mv "${filepath}.tmp" "$filepath"

    # 4. 替换 getByText 为 getAllByText[0]
    sed -i '' 's/screen\.getByText(/screen.getAllByText(/g' "$filepath"
    sed -i '' 's/byText("\([^"]*\)")/byText("\1")[0]/g' "$filepath"

    # 5. 替换 getByTestId 为 getAllByTestId[0]
    sed -i '' 's/screen\.getByTestId(/screen.getAllByTestId(/g' "$filepath"
    sed -i '' 's/byTestId("\([^"]*\)")/byTestId("\1")[0]/g' "$filepath"

    # 6. 替换 getByPlaceholderText 为 getAllByPlaceholderText[0]
    sed -i '' 's/screen\.getByPlaceholderText(/screen.getAllByPlaceholderText(/g' "$filepath"
    sed -i '' 's/byPlaceholderText("\([^"]*\)")/byPlaceholderText("\1")[0]/g' "$filepath"

    # 7. 替换 getByRole 为 getAllByRole[0]
    sed -i '' 's/screen\.getByRole(/screen.getAllByRole(/g' "$filepath"
    sed -i '' 's/byRole("\([^"]*\)")/byRole("\1")[0]/g' "$filepath"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
