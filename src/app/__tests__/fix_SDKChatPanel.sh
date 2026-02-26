#!/bin/bash

# 修复 SDKChatPanel.test.tsx 的查询方法和 cleanup 问题

filepath="src/app/__tests__/SDKChatPanel.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing SDKChatPanel.test.tsx..."

  # 1. 修复 beforeEach/afterEach 结构
  sed -i '' '/beforeEach(\(\) => {/,/});$/ {
    /afterEach/,/    };/d
  }' "$filepath"

  # 在 beforeEach 块内添加 cleanup()
  perl -i -pe 's/(beforeEach\(\(\) => \{)/$1\n    cleanup();/' "$filepath"

  # 2. 替换 getByText 为 getAllByText[0]
  sed -i '' 's/screen\.getByText(/screen.getAllByText(/g' "$filepath"
  sed -i '' 's/byText(\([^)]*\))/byText($1)[0]/g' "$filepath"

  # 3. 替换 getByTestId 为 getAllByTestId[0]
  sed -i '' 's/screen\.getByTestId(/screen.getAllByTestId(/g' "$filepath"
  sed -i '' 's/byTestId(\([^)]*\))/byTestId($1)[0]/g' "$filepath"

  # 4. 替换 getByPlaceholderText 为 getAllByPlaceholderText[0]
  sed -i '' 's/screen\.getByPlaceholderText(/screen.getAllByPlaceholderText(/g' "$filepath"
  sed -i '' 's/byPlaceholderText(\([^)]*\))/byPlaceholderText($1)[0]/g' "$filepath"

  echo "Fixed SDKChatPanel.test.tsx!"
fi
