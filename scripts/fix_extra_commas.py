#!/usr/bin/env python3
"""
修复被破坏的 mock 语法 - 移除多余的逗号
"""

import os
import re

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

def fix_syntax(filepath):
    """修复语法错误"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # 修复 YYC3Logo - 移除多余逗号
        content = re.sub(
            r'default: \(\) => <div data-testid="yyc3-logo" />>,',
            'default: () => <div data-testid="yyc3-logo" />,',
            content
        )
        
        # 修复 ConnectionStatus - 移除多余逗号
        content = re.sub(
            r'default: \(\) => <div data-testid="connection-status" />>,',
            'default: () => <div data-testid="connection-status" />,',
            content
        )
        
        if content != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    files = [
        'Sidebar.test.tsx',
        'TopBar.test.tsx',
        'ThemeCustomizer.test.tsx',
        'SystemSettings.test.tsx',
    ]
    
    fixed = 0
    for filename in files:
        filepath = os.path.join(TEST_DIR, filename)
        if os.path.exists(filepath):
            if fix_syntax(filepath):
                fixed += 1
                print(f"✅ Fixed: {filename}")
    
    print(f"\n✅ Fixed {fixed} files")

if __name__ == "__main__":
    main()
