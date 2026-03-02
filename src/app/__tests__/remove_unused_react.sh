#!/bin/bash

# 批量删除未使用的React导入

cd "$(dirname "$0")"

# 查找所有测试文件
for file in *.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # 删除未使用的React导入
    perl -i -pe 's/^import React from "react";\n//g' "$file"
    perl -i -pe 's/^import React from "react";\n\n//g' "$file"

    # 如果文件中不再使用React（检查是否有<React.或React.），删除导入
    # 注意：JSX会隐式使用React，所以需要小心
    # 只删除明显未使用的导入

    echo "Processed $file!"
  fi
done

echo "All files processed!"
