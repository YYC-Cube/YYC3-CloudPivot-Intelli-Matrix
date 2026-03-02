#!/usr/bin/env python3
"""
修复被破坏的 GlassCard mock 语法
"""

import os

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        skip_next = False
        
        for i, line in enumerate(lines):
            if skip_next:
                skip_next = False
                continue
            
            # 查找被破坏的 GlassCard mock
            if 'vi.mock("../components/GlassCard"' in line and 'default: (' in line:
                # 检查下一行是否包含 GlassCard:
                if i + 1 < len(lines) and 'GlassCard:' in lines[i + 1]:
                    # 替换为正确的语法
                    new_lines.append('vi.mock("../components/GlassCard", () => ({\n')
                    new_lines.append('  default: ({ children, className }: any) => <div className={className}>{children}</div>,\n')
                    new_lines.append('}));\n')
                    skip_next = True  # 跳过下一行
                    continue
            
            new_lines.append(line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        return True
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    fixed_count = 0
    
    for filename in os.listdir(TEST_DIR):
        if filename.endswith('.test.tsx'):
            filepath = os.path.join(TEST_DIR, filename)
            if fix_file(filepath):
                fixed_count += 1
    
    print(f"✅ Fixed {fixed_count} files")

if __name__ == "__main__":
    main()
