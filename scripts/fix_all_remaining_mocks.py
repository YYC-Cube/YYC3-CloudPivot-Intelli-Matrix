#!/usr/bin/env python3
"""
批量修复所有测试文件中的 vi.mock 语句
将所有命名导出改为默认导出
"""

import os
import re

TEST_DIR = "/Users/yanyu/Documents/YYC³ CloudPivot Intelli-Matrix/src/app/__tests__"

# 需要修复的组件列表
COMPONENTS = [
    'TopBar', 'Sidebar', 'BottomNav', 'AIAssistant', 'CommandPalette',
    'IntegratedTerminal', 'PWAInstallPrompt', 'OfflineIndicator',
    'AlertBanner', 'GlassCard', 'NodeDetailModal', 'Dashboard',
    'FollowUpPanel', 'PatrolDashboard', 'OperationCenter', 'CLITerminal',
    'IDEPanel', 'LocalFileManager', 'AISuggestionPanel', 'PWAStatusPanel',
    'ServiceLoopPanel', 'DesignSystemPage', 'DevGuidePage', 'ModelProviderPanel',
    'ThemeCustomizer', 'SecurityDashboard', 'SystemDiagnostics', 'AlertRulesPanel',
    'ReportExporter', 'AIDiagnostics', 'DataMonitoring', 'OperationAudit',
    'UserManagement', 'SystemSettings', 'NetworkConfig'
]

def fix_mock_in_file(filepath):
    """修复单个文件中的所有 mock"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # 修复各种 mock 模式
        for component in COMPONENTS:
            # 模式 1: vi.mock("../components/X", () => ({ X: ... }))
            pattern1 = rf'vi\.mock\("(?:\.\./)+components/{component}", \(\) => \({{\s*{component}:'
            replacement1 = f'vi.mock("../components/{component}", () => ({{\n  default:'
            
            content = re.sub(pattern1, replacement1, content)
            
            # 模式 2: 已经部分修复的
            pattern2 = rf'vi\.mock\("(?:\.\./)+components/{component}", \(\) => \({{\s*default:\s*\(\s*{{'
            replacement2 = f'vi.mock("../components/{component}", () => ({{\n  default: ({{'
            
            content = re.sub(pattern2, replacement2, content)
        
        # 清理多余的 default 语句
        content = re.sub(r'default:\s*\(\s*\n\s*default:', 'default: (', content)
        
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
            if fix_mock_in_file(filepath):
                fixed_count += 1
                print(f"✅ Fixed: {filename}")
    
    print(f"\n✅ Fixed {fixed_count}/{total_count} files")
    print("🎉 All mock statements updated to use default exports")

if __name__ == "__main__":
    main()
