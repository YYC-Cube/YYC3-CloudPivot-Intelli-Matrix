#!/usr/bin/env python3
"""
批量修复组件文件中的导入路径
将 from './Layout' 或 from '@/components/layout/Layout' 替换为 from '@/lib/layoutContext'
"""

import re
import os
import glob

def fix_imports(filepath):
    """修复单个文件的导入路径"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 替换模式
        content = re.sub(
            r'from "\./Layout"',
            'from "@/lib/layoutContext"',
            content
        )
        content = re.sub(
            r"from './Layout'",
            "from '@/lib/layoutContext'",
            content
        )
        content = re.sub(
            r"from '@/components/layout/Layout'",
            "from '@/lib/layoutContext'",
            content
        )
        
        # 如果有修改，写回文件
        if content != original_content:
            backup_path = filepath + '.import_backup'
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ {os.path.basename(filepath)}: 导入路径已修复")
            return True
        return False
        
    except Exception as e:
        print(f"❌ {os.path.basename(filepath)}: 错误 - {e}")
        return False

def main():
    """主函数"""
    components_dir = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/components"
    
    # 需要修复的文件列表
    files_to_fix = [
        "ThemeCustomizer.tsx",
        "CLITerminal.tsx", 
        "DevGuidePage.tsx",
        "IDEPanel.tsx",
        "LocalFileManager.tsx",
        "FollowUpPanel.tsx",
        "ModelProviderPanel.tsx",
        "AISuggestionPanel.tsx",
        "SDKChatPanel.tsx",
        "ServiceLoopPanel.tsx",
    ]
    
    print("🔧 开始修复组件导入路径...")
    print("=" * 60)
    
    fixed_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(components_dir, filename)
        if os.path.exists(filepath):
            if fix_imports(filepath):
                fixed_count += 1
        else:
            print(f"⏭️  {filename}: 无需修复")
    
    print("=" * 60)
    print(f"✨ 完成！修复了 {fixed_count} 个文件")
    print(f"📝 备份文件已保存为 .import_backup")

if __name__ == "__main__":
    main()
