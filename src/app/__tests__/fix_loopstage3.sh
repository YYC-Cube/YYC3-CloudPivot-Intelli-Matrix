#!/bin/bash

# 修复 LoopStageCard.test.tsx 中的重复 afterEach 问题 - 使用 sed 删除子 describe 中的 afterEach

filepath="src/app/__tests__/LoopStageCard.test.tsx"

if [ -f "$filepath" ]; then
  echo "Fixing LoopStageCard.test.tsx duplicate afterEach..."

  # 使用 sed 删除子 describe 块中的 afterEach
  # 删除模式：匹配 "  describe("xxx") => {" 和对应的 "  afterEach(() => {" 之间的 afterEach 块
  # 但保留第一个 describe 之后的 afterEach（如果是顶层的话）
  
  # 先删除所有 "  afterEach(() => {" 到 "});" 的块
  sed -i '' '/^  afterEach(\(\) => {$/,/^  };/d' "$filepath"
  
  # 然后在 describe 之后添加一个 beforeEach
  sed -i '' '/^describe("LoopStageCard", () => {$/a\
  beforeEach(() => {\
    cleanup();\
  });' "$filepath"
  
  # 最后添加顶层的 afterEach
  sed -i '' '/^});$/a\
\
afterEach(() => {\
  cleanup();\
});' "$filepath"

  echo "Done!"
fi
