#!/bin/bash

# 批量修复 Login.test.tsx 中的 "登 录" 多个元素问题

filepath="src/app/__tests__/Login.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing Login.test.tsx '登 录' issue..."
  # 替换 getByText("登 录") 为 getAllByText("登 录")[0]
  perl -i -pe 's/screen\.getByText\("登 录"\)/screen\.getAllByText("登 录")[0]/g' "$filepath"
  echo "Done!"
fi
