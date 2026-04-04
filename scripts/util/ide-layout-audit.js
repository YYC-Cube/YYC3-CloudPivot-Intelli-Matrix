#!/usr/bin/env node

/**
 * YYC³ IDE 页面布局审核检测工具
 * ==============================
 * 检测 IDE 页面布局是否符合 YYC³ 标准规范
 *
 * 检查项：
 * 1. 布局结构完整性
 * 2. 组件依赖关系
 * 3. 响应式设计
 * 4. 可访问性
 * 5. 性能优化
 * 6. 用户体验
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const SRC_DIR = path.join(__dirname, '../../src/app');
const IDE_DIR = path.join(SRC_DIR, 'components/ide');
const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');

// ============================================================
// 检查规则定义
// ============================================================

const CHECK_RULES = {
  // 布局结构
  layoutStructure: {
    name: '布局结构完整性',
    weight: 0.25,
    checks: [
      {
        id: 'three_column_layout',
        name: '三栏布局实现',
        description: '检查是否实现了左栏(AI面板)、中栏(文件管理器)、右栏(代码编辑器)三栏布局',
        severity: 'critical',
        check: (content) => {
          return content.includes('AIChatPanel') &&
                 content.includes('FileExplorer') &&
                 content.includes('CodePreviewPanel');
        }
      },
      {
        id: 'resizable_panels',
        name: '可调节面板',
        description: '检查是否使用 react-resizable-panels 实现面板拖拽调节',
        severity: 'critical',
        check: (content) => {
          return content.includes('react-resizable-panels') &&
                 (content.includes('Panel') || content.includes('Group'));
        }
      },
      {
        id: 'terminal_integration',
        name: '终端集成',
        description: '检查是否集成了底部终端组件',
        severity: 'high',
        check: (content) => {
          return content.includes('IDETerminal') ||
                 content.includes('terminal');
        }
      },
      {
        id: 'layout_modes',
        name: '布局模式支持',
        description: '检查是否支持编辑模式和预览模式',
        severity: 'high',
        check: (content) => {
          return content.includes('layoutMode') &&
                 (content.includes('edit') || content.includes('preview'));
        }
      }
    ]
  },

  // 组件依赖
  componentDependencies: {
    name: '组件依赖关系',
    weight: 0.20,
    checks: [
      {
        id: 'ide_components_imports',
        name: 'IDE组件导入',
        description: '检查是否正确导入所有必要的IDE组件',
        severity: 'critical',
        check: (content) => {
          const requiredImports = [
            'IDETopBar',
            'IDEViewSwitcher',
            'AIChatPanel',
            'FileExplorer',
            'CodePreviewPanel',
            'IDETerminal',
            'IDEStatusBar'
          ];
          return requiredImports.some(imp => content.includes(imp));
        }
      },
      {
        id: 'hooks_usage',
        name: 'Hooks使用',
        description: '检查是否正确使用React Hooks',
        severity: 'medium',
        check: (content) => {
          return content.includes('useState') &&
                 content.includes('useCallback') &&
                 content.includes('useEffect');
        }
      },
      {
        id: 'i18n_integration',
        name: '国际化集成',
        description: '检查是否集成了国际化功能',
        severity: 'medium',
        check: (content) => {
          return content.includes('useI18n') ||
                 content.includes('t(');
        }
      }
    ]
  },

  // 响应式设计
  responsiveDesign: {
    name: '响应式设计',
    weight: 0.20,
    checks: [
      {
        id: 'panel_size_limits',
        name: '面板尺寸限制',
        description: '检查是否设置了面板的最小和最大尺寸',
        severity: 'high',
        check: (content) => {
          return content.includes('minSize') &&
                 content.includes('maxSize') &&
                 content.includes('defaultSize');
        }
      },
      {
        id: 'flex_layout',
        name: 'Flex布局',
        description: '检查是否使用Flex布局实现响应式',
        severity: 'medium',
        check: (content) => {
          return content.includes('flex') ||
                 content.includes('flex-');
        }
      },
      {
        id: 'mobile_adaptation',
        name: '移动端适配',
        description: '检查是否考虑了移动端适配',
        severity: 'low',
        check: (content) => {
          return content.includes('mobile') ||
                 content.includes('responsive') ||
                 content.includes('breakpoint');
        }
      }
    ]
  },

  // 可访问性
  accessibility: {
    name: '可访问性',
    weight: 0.15,
    checks: [
      {
        id: 'keyboard_shortcuts',
        name: '键盘快捷键',
        description: '检查是否实现了键盘快捷键功能',
        severity: 'medium',
        check: (content) => {
          return content.includes('keydown') ||
                 content.includes('KeyboardEvent') ||
                 content.includes('Ctrl+') ||
                 content.includes('Meta+');
        }
      },
      {
        id: 'aria_attributes',
        name: 'ARIA属性',
        description: '检查是否使用了ARIA属性提升可访问性',
        severity: 'low',
        check: (content) => {
          return content.includes('aria-') ||
                 content.includes('role=');
        }
      },
      {
        id: 'focus_management',
        name: '焦点管理',
        description: '检查是否实现了焦点管理',
        severity: 'low',
        check: (content) => {
          return content.includes('autoFocus') ||
                 content.includes('onFocus') ||
                 content.includes('onBlur');
        }
      }
    ]
  },

  // 性能优化
  performanceOptimization: {
    name: '性能优化',
    weight: 0.10,
    checks: [
      {
        id: 'memoization',
        name: '记忆化',
        description: '检查是否使用了useCallback或useMemo优化性能',
        severity: 'medium',
        check: (content) => {
          return content.includes('useCallback') ||
                 content.includes('useMemo');
        }
      },
      {
        id: 'lazy_loading',
        name: '懒加载',
        description: '检查是否实现了组件懒加载',
        severity: 'low',
        check: (content) => {
          return content.includes('lazy') ||
                 content.includes('Suspense');
        }
      },
      {
        id: 'state_management',
        name: '状态管理',
        description: '检查是否使用了合理的状态管理策略',
        severity: 'medium',
        check: (content) => {
          return content.includes('useState') &&
                 content.includes('useEffect');
        }
      }
    ]
  },

  // 用户体验
  userExperience: {
    name: '用户体验',
    weight: 0.10,
    checks: [
      {
        id: 'visual_feedback',
        name: '视觉反馈',
        description: '检查是否提供了足够的视觉反馈',
        severity: 'medium',
        check: (content) => {
          return content.includes('transition') ||
                 content.includes('hover:') ||
                 content.includes('active:');
        }
      },
      {
        id: 'loading_states',
        name: '加载状态',
        description: '检查是否处理了加载状态',
        severity: 'medium',
        check: (content) => {
          return content.includes('loading') ||
                 content.includes('isLoading') ||
                 content.includes('spinner');
        }
      },
      {
        id: 'error_handling',
        name: '错误处理',
        description: '检查是否实现了错误处理机制',
        severity: 'high',
        check: (content) => {
          return content.includes('try') &&
                 content.includes('catch') &&
                 (content.includes('error') || content.includes('Error'));
        }
      }
    ]
  }
};

// ============================================================
// 工具函数
// ============================================================

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ 无法读取文件: ${filePath}`);
    return null;
  }
}

function checkFile(filePath, rules) {
  const content = readFile(filePath);
  if (!content) return null;

  const results = {
    filePath,
    fileName: path.basename(filePath),
    checks: [],
    score: 0,
    totalWeight: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  };

  for (const [categoryName, category] of Object.entries(rules)) {
    for (const check of category.checks) {
      const passed = check.check(content);
      const result = {
        category: categoryName,
        checkId: check.id,
        name: check.name,
        description: check.description,
        severity: check.severity,
        passed,
        weight: category.weight / category.checks.length
      };

      results.checks.push(result);
      results.totalWeight += result.weight;

      if (passed) {
        results.score += result.weight;
        results.passed++;
      } else {
        results.failed++;
        if (check.severity === 'critical') {
          // Critical failures have more impact
        } else if (check.severity === 'high') {
          results.warnings++;
        } else {
          results.warnings++;
        }
      }
    }
  }

  // Normalize score to 0-100
  results.score = Math.round((results.score / results.totalWeight) * 100);

  return results;
}

function generateReport(results) {
  const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: results.length,
      totalChecks,
      totalPassed,
      totalFailed,
      totalWarnings,
      avgScore,
      passRate: ((totalPassed / totalChecks) * 100).toFixed(1)
    },
    details: results,
    recommendations: generateRecommendations(results)
  };

  return report;
}

function generateRecommendations(results) {
  const recommendations = [];
  const failedChecks = {};

  // Collect failed checks
  for (const result of results) {
    for (const check of result.checks) {
      if (!check.passed) {
        if (!failedChecks[check.checkId]) {
          failedChecks[check.checkId] = {
            ...check,
            count: 0,
            files: []
          };
        }
        failedChecks[check.checkId].count++;
        failedChecks[check.checkId].files.push(result.fileName);
      }
    }
  }

  // Generate recommendations
  for (const [checkId, check] of Object.entries(failedChecks)) {
    if (check.severity === 'critical') {
      recommendations.push({
        priority: 'critical',
        issue: check.name,
        description: check.description,
        affectedFiles: check.files,
        recommendation: `立即修复: ${check.description}`
      });
    } else if (check.severity === 'high') {
      recommendations.push({
        priority: 'high',
        issue: check.name,
        description: check.description,
        affectedFiles: check.files,
        recommendation: `尽快修复: ${check.description}`
      });
    }
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔍 YYC³ IDE 页面布局审核检测工具');
  console.log('========================================\n');

  // Check if IDE directory exists
  if (!fs.existsSync(IDE_DIR)) {
    console.error(`❌ IDE 目录不存在: ${IDE_DIR}`);
    process.exit(1);
  }

  // Find all IDE component files
  const ideFiles = fs.readdirSync(IDE_DIR)
    .filter(file => file.endsWith('.tsx'))
    .map(file => path.join(IDE_DIR, file));

  console.log(`📁 扫描到 ${ideFiles.length} 个 IDE 组件文件\n`);

  // Run checks
  const results = [];
  for (const filePath of ideFiles) {
    const result = checkFile(filePath, CHECK_RULES);
    if (result) {
      results.push(result);
    }
  }

  // Generate report
  const report = generateReport(results);

  // Print summary
  console.log('📊 审核结果摘要:');
  console.log(`   总文件数: ${report.summary.totalFiles}`);
  console.log(`   总检查项: ${report.summary.totalChecks}`);
  console.log(`   ✅ 通过: ${report.summary.totalPassed} (${report.summary.passRate}%)`);
  console.log(`   ❌ 失败: ${report.summary.totalFailed}`);
  console.log(`   ⚠️  警告: ${report.summary.totalWarnings}`);
  console.log(`   📈 平均得分: ${report.summary.avgScore}/100`);
  console.log('');

  // Print category scores
  console.log('📋 分类得分:');
  for (const [categoryName, category] of Object.entries(CHECK_RULES)) {
    const categoryResults = results.map(r => ({
      score: r.score,
      checks: r.checks.filter(c => c.category === categoryName)
    }));

    const categoryPassed = categoryResults.reduce((sum, r) => sum + r.checks.filter(c => c.passed).length, 0);
    const categoryTotal = categoryResults.reduce((sum, r) => sum + r.checks.length, 0);
    const categoryScore = categoryTotal > 0 ? Math.round((categoryPassed / categoryTotal) * 100) : 0;

    console.log(`   ${category.name}: ${categoryScore}% (权重: ${(category.weight * 100).toFixed(0)}%)`);
  }
  console.log('');

  // Print recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 改进建议:');
    console.log('');

    for (const rec of report.recommendations.slice(0, 10)) {
      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[rec.priority];

      console.log(`   ${priorityEmoji} ${rec.issue} (${rec.priority})`);
      console.log(`      描述: ${rec.description}`);
      console.log(`      建议: ${rec.recommendation}`);
      console.log(`      影响文件: ${rec.affectedFiles.slice(0, 3).join(', ')}${rec.affectedFiles.length > 3 ? '...' : ''}`);
      console.log('');
    }
  }

  // Save report
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const reportPath = path.join(REPORTS_DIR, `ide-layout-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 审核报告已保存: ${reportPath}`);
  console.log('');

  // Determine exit code
  if (report.summary.avgScore >= 90) {
    console.log('✅ IDE 页面布局质量优秀！');
    process.exit(0);
  } else if (report.summary.avgScore >= 70) {
    console.log('⚠️  IDE 页面布局质量良好，但仍有改进空间');
    process.exit(0);
  } else {
    console.log('❌ IDE 页面布局需要改进');
    process.exit(1);
  }
}

// ============================================================
// 执行
// ============================================================

main();