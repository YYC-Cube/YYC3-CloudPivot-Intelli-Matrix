#!/usr/bin/env python3
"""
批量修复测试文件中的 vi.mock 语句
将命名导出改为默认导出
"""

import os
import re

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

# 需要修复的组件 mock 模式
PATTERNS = {
    # AlertBanner
    r'vi\.mock\("(?:\.\./)+components/AlertBanner", \(\) => \({\s*AlertBanner:': 
        'vi.mock("../components/AlertBanner", () => ({\n  default:',
    
    # NodeDetailModal  
    r'vi\.mock\("(?:\.\./)+components/NodeDetailModal", \(\) => \({\s*NodeDetailModal:':
        'vi.mock("../components/NodeDetailModal", () => ({\n  default:',
    
    # GlassCard (如果还有遗漏)
    r'vi\.mock\("(?:\.\./)+components/GlassCard", \(\) => \({\s*GlassCard:':
        'vi.mock("../components/GlassCard", () => ({\n  default:',
}

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        for pattern, replacement in PATTERNS.items():
            content = re.sub(pattern, replacement, content)
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    fixed_count = 0
    total_count = 0
    
    for filename in os.listdir(TEST_DIR):
        if filename.endswith('.test.tsx'):
            total_count += 1
            filepath = os.path.join(TEST_DIR, filename)
            if fix_file(filepath):
                fixed_count += 1
                print(f"✅ Fixed: {filename}")
    
    print(f"\n✅ Fixed {fixed_count}/{total_count} files")

if __name__ == "__main__":
    main()
