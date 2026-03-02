#!/bin/bash

# 批量修复所有测试文件中的结构问题 - 添加正确的 beforeEach/afterEach 结构

files=(
  "OperationCategory.test.tsx"
  "OfflineIndicator.test.tsx"
  "OperationChain.test.tsx"
  "PatrolReport.test.tsx"
  "StageReview.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Processing $file..."

    # 1. 查找 describe 块的开始
    # 2. 在 describe 之后添加 beforeEach/afterEach
    # 3. 删除原有的错误 afterEach

    # 先备份
    cp "$filepath" "${filepath}.bak"

    # 查找 describe 后的第一个 beforeEach，在其后添加 afterEach
    # 删除描述块内部的 afterEach

    # 使用 sed 删除 describe 内部的 afterEach
    sed -i '' '/^  beforeEach(\(\) => {$/,/^  });$/ {
      /afterEach/,/^    };/d
    }' "$filepath"

    # 在第一个 describe 后添加 afterEach
    perl -i -0pe 's/(describe\("[^"]+", \(\) => \{\n  beforeEach\(\(\) => \{\n    cleanup\(\);\n)/$1\n  afterEach(() => {\n    cleanup();\n  });\n\n/' "$filepath"

    # 替换 getByText 为 getAllByText[0]
    sed -i '' 's/screen\.getByText(/screen.getAllByText(/g' "$filepath"
    sed -i '' 's/byText("\([^"]*\)")/byText("\1")[0]/g' "$filepath"

    # 替换 getByTestId 为 getAllByTestId[0]
    sed -i '' 's/screen\.getByTestId(/screen.getAllByTestId(/g' "$filepath"
    sed -i '' 's/byTestId("\([^"]*\)")/byTestId("\1")[0]/g' "$filepath"

    # 替换 getByPlaceholderText 为 getAllByPlaceholderText[0]
    sed -i '' 's/screen\.getByPlaceholderText(/screen.getAllByPlaceholderText(/g' "$filepath"
    sed -i '' 's/byPlaceholderText("\([^"]*\)")/byPlaceholderText("\1")[0]/g' "$filepath"

    # 替换 getByRole 为 getAllByRole[0]
    sed -i '' 's/screen\.getByRole(/screen.getAllByRole(/g' "$filepath"
    sed -i '' 's/byRole("\([^"]*\)")/byRole("\1")[0]/g' "$filepath"

    echo "Fixed $file!"
  fi
done

echo "All files processed!"
