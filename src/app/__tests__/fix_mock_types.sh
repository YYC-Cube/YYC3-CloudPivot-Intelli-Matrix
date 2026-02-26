#!/bin/bash

# 批量修复所有测试文件中的Mock函数类型问题

cd "$(dirname "$0")"

for file in *.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # 处理各种常见的Mock函数模式
    # 1. 修复 onApply/onDismiss/onClose 等回调函数的类型
    perl -i -pe 's/let (\w+): ReturnType<typeof vi\.fn>/let $1: (recId: string) => void/g' "$file"
    perl -i -pe 's/let (\w+): ReturnType<typeof vi\.fn>/let $1: () => void/g' "$file"
    perl -i -pe 's/let (\w+): ReturnType<typeof vi\.fn>/let $1: (enabled: boolean) => void/g' "$file"
    perl -i -pe 's/let (\w+): ReturnType<typeof vi\.fn>/let $1: (value: string) => void/g' "$file"
    perl -i -pe 's/let (\w+): ReturnType<typeof vi\.fn>/let $1: (interval: number) => void/g' "$file"

    # 2. 修复 vi.fn() 的赋值
    perl -i -pe 's/\b(\w+) = vi\.fn\(\);$/$1 = vi.fn() as (recId: string) => void;/g' "$file"
    perl -i -pe 's/\b(\w+) = vi\.fn\(\);$/$1 = vi.fn() as () => void;/g' "$file"

    # 3. 在 beforeEach 中添加 cleanup()
    perl -i -pe 's/beforeEach\(\(\) => \{/beforeEach(() => {\n    cleanup();/g' "$file"

    echo "Processed $file!"
  fi
done

echo "All files processed!"
