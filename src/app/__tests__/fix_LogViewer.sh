#!/bin/bash

# 批量修复 LogViewer.test.tsx 中的多个元素问题

filepath="src/app/__tests__/LogViewer.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing LogViewer.test.tsx..."
  # 替换 getByText 为 getAllByText 并添加 [0] 索引
  perl -i -pe 's/screen\.getByText\("([^"]+)"\)/screen\.getAllByText("$1")[0]/g' "$filepath"
  # 替换 getByTestId 为 getAllByTestId 并添加 [0] 索引
  perl -i -pe 's/screen\.getByTestId\("([^"]+)"\)/screen\.getAllByTestId("$1")[0]/g' "$filepath"
  echo "Done!"
fi
