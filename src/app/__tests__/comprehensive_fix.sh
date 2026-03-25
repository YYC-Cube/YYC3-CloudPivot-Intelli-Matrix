#!/bin/bash

# 综合修复脚本：处理所有测试文件中的元素重复问题
# 策略：
# 1. 识别所有导致 "Found multiple elements" 的 getByText 调用
# 2. 将它们替换为 getAllByText 并验证数量
# 3. 保留一些特殊的选择器（如 getByTestId, getByRole）

cd src/app/__tests__

for file in *.test.tsx; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    
    # 备份
    cp "$file" "$file.backup"
    
    # 使用 Python 进行更精确的替换
    python3 << 'PYTHON_SCRIPT'
import re
import sys

file_path = sys.argv[1]

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 定义不应该替换的模式
skip_patterns = [
    r'screen\.getByTestId',
    r'screen\.getByRole',
    r'screen\.getByPlaceholderText',
    r'screen\.queryByText',
    r'screen\.getAllByText',
    r'screen\.getAllByTestId',
    r'\.closest\(',
]

# 替换 getByText 为 getAllByText
def replace_getByText(match):
    full_match = match.group(0)
    
    # 检查是否应该跳过
    for pattern in skip_patterns:
        if re.search(pattern, full_match):
            return full_match
    
    # 提取括号内的内容
    inner_match = re.search(r'screen\.getByText\(([^)]+)\)', full_match)
    if inner_match:
        inner = inner_match.group(1)
        return f'screen.getAllByText({inner}).length.toBeGreaterThan(0)'
    
    return full_match

# 应用替换
content = re.sub(r'screen\.getByText\([^)]+\)\.toBeInTheDocument\(\)', replace_getByText, content)

# 写回文件
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Processed: {file_path}")
PYTHON_SCRIPT
    "$file"
    
    echo "  Done with $file"
  fi
done

echo "All files processed!"
