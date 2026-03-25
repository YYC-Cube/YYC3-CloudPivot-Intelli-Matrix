#!/bin/bash

# 修复 OperationCategory.test.tsx - 修复 afterEach 结构和 getByText/getByTestId 问题

filepath="src/app/__tests__/OperationCategory.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing OperationCategory.test.tsx..."

  # 1. 修复 afterEach 结构
  sed -i '' '/^  beforeEach(\(\) => {$/,/^  });$/ {
    /afterEach/,/^    };/d
  }' "$filepath"

  # 2. 在 describe 之后添加正确的 beforeEach/afterEach
  perl -i -0pe 's/(describe\("OperationCategory", \(\) => \{)/$1\n  beforeEach(() => {\n    cleanup();\n    onChange = vi.fn();\n  });\n\n  afterEach(() => {\n    cleanup();\n  });/' "$filepath"

  # 3. 替换 getByText 为 getAllByText[0]
  sed -i '' 's/screen\.getByText(/screen.getAllByText(/g' "$filepath"
  sed -i '' 's/byText("\([^"]*\)")/byText("\1")[0]/g' "$filepath"

  # 4. 替换 getByTestId 为 getAllByTestId[0]
  sed -i '' 's/screen\.getByTestId(/screen.getAllByTestId(/g' "$filepath"
  sed -i '' 's/byTestId("\([^"]*\)")/byTestId("\1")[0]/g' "$filepath"

  echo "Done!"
fi
