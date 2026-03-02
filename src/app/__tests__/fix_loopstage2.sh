#!/bin/bash

# 修复 LoopStageCard.test.tsx 中的重复 afterEach 问题 - 直接重写文件

filepath="src/app/__tests__/LoopStageCard.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing LoopStageCard.test.tsx duplicate afterEach..."

  # 创建临时文件，删除所有子 describe 中的 afterEach 块
  awk '
  BEGIN {
    skip = 0
  }
  
  /^describe\(/ {
    skip = 1
    print
    next
  }
  
  /  afterEach\(\(\) => \{/ {
    if (skip == 1) {
      # 跳过子 describe 中的 afterEach
      getline
      getline
      getline
      next
      skip = 0
    } else {
      # 保留顶层 afterEach
      print
    }
  }
  
  {
    if (skip == 0) {
      print
    }
  }
  ' "$filepath" > "${filepath}.tmp"
  
  mv "${filepath}.tmp" "$filepath"

  echo "Done!"
fi
