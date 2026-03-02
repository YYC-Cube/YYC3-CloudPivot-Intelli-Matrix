#!/usr/bin/env python3
"""
修复所有被破坏的 GlassCard mock 语法
"""

import os

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

FILES_TO_FIX = [
    'AISuggestionPanel.test.tsx',
    'CLITerminal.test.tsx',
    'LocalFileManager.test.tsx',
    'NetworkConfig.test.tsx',
    'OperationAudit.test.tsx',
    'OperationCenter.test.tsx',
    'PatrolDashboard.test.tsx',
    'ServiceLoopPanel.test.tsx',
]

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        new_lines = []
        skip_until_brace = False
        
        for i, line in enumerate(lines):
            if skip_until_brace:
                if '}' in line and '));' in line:
                    skip_until_brace = False
                continue
            
            # 查找被破坏的 GlassCard mock
            if 'vi.mock("../components/GlassCard"' in line and 'default: (' in line:
                # 检查下一行是否包含 GlassCard:
                if i + 1 < len(lines) and 'GlassCard:' in lines[i + 1]:
                    # 替换为正确的语法
                    new_lines.append('vi.mock("../components/GlassCard", () => ({\n')
                    new_lines.append('  default: ({ children, className }: any) => <div className={className}>{children}</div>,\n')
                    new_lines.append('}));\n')
                    skip_until_brace = True
                    continue
            
            new_lines.append(line)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    fixed = 0
    for filename in FILES_TO_FIX:
        filepath = os.path.join(TEST_DIR, filename)
        if os.path.exists(filepath):
            if fix_file(filepath):
                fixed += 1
                print(f"✅ Fixed: {filename}")
    
    print(f"\n✅ Fixed {fixed}/{len(FILES_TO_FIX)} files")

if __name__ == "__main__":
    main()
