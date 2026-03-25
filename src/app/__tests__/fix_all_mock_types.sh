#!/bin/bash

# 批量修复所有测试文件中的Mock函数类型问题

cd "$(dirname "$0")"

# 查找所有测试文件
for file in *.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # 1. 修复常见的Mock函数声明
    # onRunTemplate, onDeleteTemplate, onAddTemplate 等
    perl -i -pe 's/let (on\w+): ReturnType<typeof vi\.fn>/let $1: any/g' "$file"

    # 2. 修复 vi.fn() 赋值 - 使用 any 类型
    perl -i -pe 's/\b(\w+) = vi\.fn\(\);$/$1 = vi.fn() as any;/g' "$file"

    # 3. 修复重复的 cleanup 调用（beforeEach中已经有cleanup）
    perl -i -pe 's/\bcleanup\(\);\s*cleanup\(\);/cleanup();/g' "$file"

    # 4. 修复双重 [0][0] 模式
    perl -i -pe 's/\[0\]\)\[0\]/[0]/g' "$file"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
