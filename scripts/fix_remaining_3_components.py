#!/usr/bin/env python3
"""
修复剩余 3 个组件的 mock：ConnectionStatus, ErrorBoundary, YYC3Logo
"""

import os
import re

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

COMPONENTS_TO_FIX = ['ConnectionStatus', 'ErrorBoundary', 'YYC3Logo']

def fix_component_mocks(filepath):
    """修复单个文件中的组件 mock"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        for component in COMPONENTS_TO_FIX:
            # 模式：vi.mock("../components/X", () => ({ X: ... }))
            # 替换为：vi.mock("../components/X", () => ({ default: ... }))
            
            # 查找并替换
            pattern = rf'vi\.mock\("(?:\.\./)+components/{component}", \(\) => \(\{{\s*{component}:'
            
            if re.search(pattern, content):
                # 根据组件类型提供不同的默认 mock
                if component == 'YYC3Logo':
                    replacement = f'vi.mock("../components/{component}", () => ({{\n  default: () => <div data-testid="yyc3-logo" />>,\n}}))'
                elif component == 'ErrorBoundary':
                    replacement = f'vi.mock("../components/{component}", () => ({{\n  default: ({{ children }}: any) => <div>{{children}}</div>,\n}}))'
                elif component == 'ConnectionStatus':
                    replacement = f'vi.mock("../components/{component}", () => ({{\n  default: () => <div data-testid="connection-status" />>,\n}}))'
                else:
                    replacement = f'vi.mock("../components/{component}", () => ({{\n  default: () => null,\n}}))'
                
                # 使用更精确的替换
                content = re.sub(
                    rf'vi\.mock\("(?:\.\./)+components/{component}", \(\) => \(\{{[^}}]+\}}\)\);',
                    replacement,
                    content
                )
        
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
            if fix_component_mocks(filepath):
                fixed_count += 1
                print(f"✅ Fixed: {filename}")
    
    print(f"\n✅ Fixed {fixed_count}/{total_count} files")
    print(f"🎯 Fixed mocks for: {', '.join(COMPONENTS_TO_FIX)}")

if __name__ == "__main__":
    main()
