#!/bin/bash

# 批量修复 Login.test.tsx 中的多个元素问题

filepath="src/app/__tests__/Login.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing Login.test.tsx..."
  # 替换 getByPlaceholderText 为 getAllByPlaceholderText 并添加 [0] 索引
  perl -i -pe 's/screen\.getByPlaceholderText\("([^"]+)"\)/screen\.getAllByPlaceholderText("$1")[0]/g' "$filepath"
  # 替换 getByText 为 getAllByText 并添加 [0] 索引（针对正则表达式）
  perl -i -pe 's/screen\.getByText\((\/[^)]+)\)/screen\.getAllByText($1)[0]/g' "$filepath"
  echo "Done!"
fi
