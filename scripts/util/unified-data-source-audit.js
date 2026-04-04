#!/usr/bin/env node

/**
 * YYC³ 全端统一数据源审核检测工具
 * ==============================
 * 检测全端数据源是否符合 YYC³ 标准规范
 *
 * 检查项：
 * 1. API 配置统一性
 * 2. WebSocket 连接管理
 * 3. 数据存储一致性
 * 4. 状态管理统一性
 * 5. 数据同步机制
 * 6. 错误处理和降级
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const SRC_DIR = path.join(__dirname, '../../src/app');
const LIB_DIR = path.join(SRC_DIR, 'lib');
const HOOKS_DIR = path.join(SRC_DIR, 'hooks');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');

// ============================================================
// 检查规则定义
// ============================================================

const CHECK_RULES = {
  // API 配置统一性
  apiConfigUnification: {
    name: 'API 配置统一性',
    weight: 0.25,
    checks: [
      {
        id: 'api_config_import',
        name: 'API 配置导入',
        description: '检查是否从统一的 api-config 导入配置',
        severity: 'critical',
        check: (content) => {
          return content.includes('getAPIConfig') ||
                 content.includes('setAPIConfig') ||
                 content.includes('api-config');
        }
      },
      {
        id: 'api_endpoint_consistency',
        name: 'API 端点一致性',
        description: '检查是否使用统一的 API 端点',
        severity: 'critical',
        check: (content) => {
          return content.includes('fsBase') ||
                 content.includes('dbBase') ||
                 content.includes('wsEndpoint') ||
                 content.includes('aiBase') ||
                 content.includes('clusterBase');
        }
      },
      {
        id: 'api_config_persistence',
        name: 'API 配置持久化',
        description: '检查 API 配置是否持久化到 localStorage',
        severity: 'high',
        check: (content) => {
          return content.includes('localStorage') &&
                 (content.includes('yyc3_api_endpoints') ||
                  content.includes('STORAGE_KEY'));
        }
      },
      {
        id: 'api_config_sync',
        name: 'API 配置同步',
        description: '检查是否使用 BroadcastChannel 同步配置',
        severity: 'high',
        check: (content) => {
          return content.includes('BroadcastChannel') ||
                 content.includes('postMessage') ||
                 content.includes('onmessage');
        }
      }
    ]
  },

  // WebSocket 连接管理
  webSocketManagement: {
    name: 'WebSocket 连接管理',
    weight: 0.20,
    checks: [
      {
        id: 'websocket_hook_usage',
        name: 'WebSocket Hook 使用',
        description: '检查是否使用统一的 useWebSocketData hook',
        severity: 'critical',
        check: (content) => {
          return content.includes('useWebSocketData') ||
                 content.includes('WebSocketContext');
        }
      },
      {
        id: 'websocket_url_unification',
        name: 'WebSocket URL 统一',
        description: '检查 WebSocket URL 是否从统一配置读取',
        severity: 'critical',
        check: (content) => {
          return content.includes('wsEndpoint') ||
                 content.includes('getAPIConfig');
        }
      },
      {
        id: 'websocket_reconnect',
        name: 'WebSocket 重连机制',
        description: '检查是否实现了 WebSocket 自动重连',
        severity: 'high',
        check: (content) => {
          return content.includes('reconnect') ||
                 content.includes('RECONNECT_DELAY') ||
                 content.includes('reconnectCount');
        }
      },
      {
        id: 'websocket_fallback',
        name: 'WebSocket 降级机制',
        description: '检查是否实现了 WebSocket 降级到模拟数据',
        severity: 'high',
        check: (content) => {
          return content.includes('simulated') ||
                 content.includes('fallback') ||
                 content.includes('mock');
        }
      }
    ]
  },

  // 数据存储一致性
  dataStorageConsistency: {
    name: '数据存储一致性',
    weight: 0.20,
    checks: [
      {
        id: 'localStorage_usage',
        name: 'LocalStorage 使用',
        description: '检查是否统一使用 localStorage 进行数据存储',
        severity: 'medium',
        check: (content) => {
          return content.includes('localStorage') &&
                 (content.includes('getItem') ||
                  content.includes('setItem'));
        }
      },
      {
        id: 'storage_key_naming',
        name: '存储键命名规范',
        description: '检查存储键是否遵循 YYC³ 命名规范',
        severity: 'medium',
        check: (content) => {
          return content.includes('yyc3_') ||
                 content.match(/yyc3-[a-z_]+/);
        }
      },
      {
        id: 'storage_error_handling',
        name: '存储错误处理',
        description: '检查是否处理了存储操作错误',
        severity: 'high',
        check: (content) => {
          return content.includes('try') &&
                 content.includes('catch') &&
                 content.includes('localStorage');
        }
      },
      {
        id: 'data_persistence',
        name: '数据持久化',
        description: '检查是否实现了数据持久化机制',
        severity: 'medium',
        check: (content) => {
          return content.includes('persist') ||
                 content.includes('save') ||
                 content.includes('store');
        }
      }
    ]
  },

  // 状态管理统一性
  stateManagementUnification: {
    name: '状态管理统一性',
    weight: 0.15,
    checks: [
      {
        id: 'context_usage',
        name: 'Context 使用',
        description: '检查是否使用 React Context 进行状态管理',
        severity: 'medium',
        check: (content) => {
          return content.includes('Context') ||
                 content.includes('createContext') ||
                 content.includes('useContext');
        }
      },
      {
        id: 'hooks_usage',
        name: 'Hooks 使用',
        description: '检查是否使用自定义 Hooks 封装状态逻辑',
        severity: 'medium',
        check: (content) => {
          return content.includes('use') &&
                 (content.includes('useState') ||
                  content.includes('useEffect'));
        }
      },
      {
        id: 'state_sync',
        name: '状态同步',
        description: '检查是否实现了状态同步机制',
        severity: 'high',
        check: (content) => {
          return content.includes('sync') ||
                 content.includes('BroadcastChannel') ||
                 content.includes('addEventListener');
        }
      }
    ]
  },

  // 数据同步机制
  dataSyncMechanism: {
    name: '数据同步机制',
    weight: 0.10,
    checks: [
      {
        id: 'realtime_sync',
        name: '实时同步',
        description: '检查是否实现了实时数据同步',
        severity: 'medium',
        check: (content) => {
          return content.includes('realtime') ||
                 content.includes('WebSocket') ||
                 content.includes('EventSource');
        }
      },
      {
        id: 'sync_conflict_resolution',
        name: '同步冲突解决',
        description: '检查是否处理了数据同步冲突',
        severity: 'low',
        check: (content) => {
          return content.includes('conflict') ||
                 content.includes('merge') ||
                 content.includes('resolve');
        }
      },
      {
        id: 'sync_error_recovery',
        name: '同步错误恢复',
        description: '检查是否实现了同步错误恢复',
        severity: 'medium',
        check: (content) => {
          return content.includes('retry') ||
                 content.includes('recovery') ||
                 content.includes('fallback');
        }
      }
    ]
  },

  // 错误处理和降级
  errorHandlingAndFallback: {
    name: '错误处理和降级',
    weight: 0.10,
    checks: [
      {
        id: 'error_boundary',
        name: '错误边界',
        description: '检查是否使用了 ErrorBoundary',
        severity: 'medium',
        check: (content) => {
          return content.includes('ErrorBoundary') ||
                 content.includes('componentDidCatch');
        }
      },
      {
        id: 'fallback_data',
        name: '降级数据',
        description: '检查是否提供了降级数据',
        severity: 'high',
        check: (content) => {
          return content.includes('fallback') ||
                 content.includes('mock') ||
                 content.includes('default');
        }
      },
      {
        id: 'error_logging',
        name: '错误日志',
        description: '检查是否记录了错误日志',
        severity: 'medium',
        check: (content) => {
          return content.includes('console.error') ||
                 content.includes('logError') ||
                 content.includes('logger');
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

function findFiles(dir, pattern) {
  const files = [];

  function scan(currentDir) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== '__tests__') {
          scan(fullPath);
        } else if (entry.isFile() && entry.name.match(pattern)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  scan(dir);
  return files;
}

function checkFile(filePath, rules) {
  const content = readFile(filePath);
  if (!content) return null;

  const results = {
    filePath,
    fileName: path.basename(filePath),
    relativePath: path.relative(SRC_DIR, filePath),
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
    recommendations: generateRecommendations(results),
    dataFlowAnalysis: analyzeDataFlow(results)
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
        failedChecks[check.checkId].files.push(result.relativePath);
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

function analyzeDataFlow(results) {
  const analysis = {
    apiConfigUsage: 0,
    webSocketUsage: 0,
    localStorageUsage: 0,
    contextUsage: 0,
    errorHandling: 0
  };

  for (const result of results) {
    for (const check of result.checks) {
      if (check.passed) {
        if (check.category === 'apiConfigUnification') analysis.apiConfigUsage++;
        if (check.category === 'webSocketManagement') analysis.webSocketUsage++;
        if (check.category === 'dataStorageConsistency') analysis.localStorageUsage++;
        if (check.category === 'stateManagementUnification') analysis.contextUsage++;
        if (check.category === 'errorHandlingAndFallback') analysis.errorHandling++;
      }
    }
  }

  return analysis;
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔍 YYC³ 全端统一数据源审核检测工具');
  console.log('========================================\n');

  // Find all relevant files
  const tsFiles = findFiles(SRC_DIR, /\.tsx?$/);
  console.log(`📁 扫描到 ${tsFiles.length} 个 TypeScript 文件\n`);

  // Run checks
  const results = [];
  for (const filePath of tsFiles) {
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

  // Print data flow analysis
  console.log('🔄 数据流分析:');
  console.log(`   API 配置使用: ${report.dataFlowAnalysis.apiConfigUsage} 次`);
  console.log(`   WebSocket 使用: ${report.dataFlowAnalysis.webSocketUsage} 次`);
  console.log(`   LocalStorage 使用: ${report.dataFlowAnalysis.localStorageUsage} 次`);
  console.log(`   Context 使用: ${report.dataFlowAnalysis.contextUsage} 次`);
  console.log(`   错误处理: ${report.dataFlowAnalysis.errorHandling} 次`);
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

  const reportPath = path.join(REPORTS_DIR, `unified-data-source-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 审核报告已保存: ${reportPath}`);
  console.log('');

  // Determine exit code
  if (report.summary.avgScore >= 90) {
    console.log('✅ 全端统一数据源质量优秀！');
    process.exit(0);
  } else if (report.summary.avgScore >= 70) {
    console.log('⚠️  全端统一数据源质量良好，但仍有改进空间');
    process.exit(0);
  } else {
    console.log('❌ 全端统一数据源需要改进');
    process.exit(1);
  }
}

// ============================================================
// 执行
// ============================================================

main();