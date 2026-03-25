#!/usr/bin/env python3
"""
自动化测试修复脚本
批量修复所有测试文件中的元素重复问题
"""

import re
import os
import glob

def fix_test_file(filepath):
    """修复单个测试文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 备份原文件
        backup_path = filepath + '.auto_fix_backup'
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        # 统计修复数量
        fixes_count = 0
        
        # 替换模式
        replacements = [
            # getByText -> getAllByText (当可能导致多个元素时)
            (r'screen\.getByText\(([^)]+)\)\.toBeInTheDocument\(\)', 
             r'screen.getAllByText(\1).length.toBeGreaterThan(0)'),
            
            # queryByText -> null 检查
            (r'screen\.queryByText\(([^)]+)\)\.not\.toBeInTheDocument\(\)', 
             r'screen.queryByText(\1) === null'),
        ]
        
        # 应用替换
        for pattern, replacement in replacements:
            new_content = re.sub(pattern, replacement, content)
            if new_content != content:
                matches = re.findall(pattern, content)
                fixes_count += len(matches)
                content = new_content
        
        # 如果有修复，写回文件
        if fixes_count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ {os.path.basename(filepath)}: 修复了 {fixes_count} 处")
            return True
        else:
            print(f"⏭️  {os.path.basename(filepath)}: 无需修复")
            return False
            
    except Exception as e:
        print(f"❌ {os.path.basename(filepath)}: 错误 - {e}")
        return False

def main():
    """主函数"""
    test_dir = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"
    
    # 获取所有测试文件
    test_files = glob.glob(os.path.join(test_dir, "*.test.tsx"))
    
    print(f"🔧 开始修复 {len(test_files)} 个测试文件...")
    print("=" * 60)
    
    fixed_count = 0
    for test_file in test_files:
        if fix_test_file(test_file):
            fixed_count += 1
    
    print("=" * 60)
    print(f"✨ 完成！修复了 {fixed_count} 个文件")
    print(f"📝 备份文件已保存为 .auto_fix_backup")

if __name__ == "__main__":
    main()
