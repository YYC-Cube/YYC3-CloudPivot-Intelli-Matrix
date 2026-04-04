#!/usr/bin/env node

/**
 * YYC³ 大模型AI全链路逻辑审核检测工具
 * ====================================
 * 检测大模型AI全链路逻辑是否符合 YYC³ 标准规范
 *
 * 检查项：
 * 1. 模型提供商管理
 * 2. SDK集成
 * 3. 聊天功能
 * 4. 流式响应
 * 5. 错误处理
 * 6. 使用统计
 * 7. 会话管理
 * 8. 多提供商支持
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const SRC_DIR = path.join(__dirname, '../../src/app');
const HOOKS_DIR = path.join(SRC_DIR, 'hooks');
const LIB_DIR = path.join(SRC_DIR, 'lib');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');
const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');

// ============================================================
// 检查规则定义
// ============================================================

const CHECK_RULES = {
  // 模型提供商管理
  modelProviderManagement: {
    name: '模型提供商管理',
    weight: 0.20,
    checks: [
      {
        id: 'provider_crud',
        name: '提供商 CRUD',
        description: '检查是否实现了提供商的增删改查功能',
        severity: 'critical',
        check: (content) => {
          return (content.includes('addProvider') ||
                  content.includes('removeProvider') ||
                  content.includes('updateProvider')) &&
                 content.includes('useModelProvider');
        }
      },
      {
        id: 'model_configuration',
        name: '模型配置',
        description: '检查是否支持模型配置（API Key、Base URL等）',
        severity: 'critical',
        check: (content) => {
          return content.includes('apiKey') &&
                 content.includes('baseUrl') &&
                 content.includes('ConfiguredModel');
        }
      },
      {
        id: 'ollama_integration',
        name: 'Ollama 集成',
        description: '检查是否集成了 Ollama 本地模型',
        severity: 'high',
        check: (content) => {
          return content.includes('ollama') ||
                 content.includes('OllamaModel') ||
                 content.includes('localhost:11434');
        }
      },
      {
        id: 'provider_persistence',
        name: '提供商持久化',
        description: '检查是否将提供商配置持久化到 localStorage',
        severity: 'high',
        check: (content) => {
          return content.includes('localStorage') &&
                 (content.includes('provider') ||
                  content.includes('model'));
        }
      }
    ]
  },

  // SDK集成
  sdkIntegration: {
    name: 'SDK集成',
    weight: 0.20,
    checks: [
      {
        id: 'sdk_hook_usage',
        name: 'SDK Hook 使用',
        description: '检查是否使用 useBigModelSDK hook',
        severity: 'critical',
        check: (content) => {
          return content.includes('useBigModelSDK') ||
                 content.includes('chat') ||
                 content.includes('chatStream');
        }
      },
      {
        id: 'api_call_unification',
        name: 'API 调用统一',
        description: '检查是否统一了不同提供商的 API 调用',
        severity: 'critical',
        check: (content) => {
          return content.includes('chat') &&
                 content.includes('chatStream') &&
                 (content.includes('zhipu') ||
                  content.includes('openai') ||
                  content.includes('ollama'));
        }
      },
      {
        id: 'authentication',
        name: '认证机制',
        description: '检查是否实现了统一的认证机制',
        severity: 'high',
        check: (content) => {
          return content.includes('Authorization') ||
                 content.includes('Bearer') ||
                 content.includes('apiKey');
        }
      },
      {
        id: 'request_formatting',
        name: '请求格式化',
        description: '检查是否正确格式化 API 请求',
        severity: 'high',
        check: (content) => {
          return content.includes('messages') &&
                 content.includes('model') &&
                 (content.includes('temperature') ||
                  content.includes('max_tokens'));
        }
      }
    ]
  },

  // 聊天功能
  chatFunctionality: {
    name: '聊天功能',
    weight: 0.15,
    checks: [
      {
        id: 'message_management',
        name: '消息管理',
        description: '检查是否实现了消息管理（发送、接收、历史）',
        severity: 'critical',
        check: (content) => {
          return content.includes('ChatMessage') &&
                 (content.includes('sendMessage') ||
                  content.includes('messages'));
        }
      },
      {
        id: 'conversation_history',
        name: '对话历史',
        description: '检查是否维护了对话历史',
        severity: 'high',
        check: (content) => {
          return content.includes('history') ||
                 content.includes('previousMessages') ||
                 content.includes('conversation');
        }
      },
      {
        id: 'role_management',
        name: '角色管理',
        description: '检查是否支持不同角色（user、assistant、system）',
        severity: 'medium',
        check: (content) => {
          return content.includes('role') &&
                 (content.includes('user') ||
                  content.includes('assistant') ||
                  content.includes('system'));
        }
      },
      {
        id: 'context_preservation',
        name: '上下文保持',
        description: '检查是否保持了对话上下文',
        severity: 'high',
        check: (content) => {
          return content.includes('context') ||
                 content.includes('previousMessages') ||
                 content.includes('conversation');
        }
      }
    ]
  },

  // 流式响应
  streamingResponse: {
    name: '流式响应',
    weight: 0.15,
    checks: [
      {
        id: 'streaming_support',
        name: '流式支持',
        description: '检查是否支持流式响应',
        severity: 'high',
        check: (content) => {
          return content.includes('chatStream') ||
                 content.includes('stream') ||
                 content.includes('SSE');
        }
      },
      {
        id: 'chunk_handling',
        name: '分块处理',
        description: '检查是否正确处理流式响应分块',
        severity: 'high',
        check: (content) => {
          return content.includes('chunk') ||
                 content.includes('TextDecoder') ||
                 content.includes('Reader');
        }
      },
      {
        id: 'streaming_ui',
        name: '流式 UI',
        description: '检查是否实现了流式响应 UI',
        severity: 'medium',
        check: (content) => {
          return content.includes('onChunk') ||
                 content.includes('onProgress') ||
                 content.includes('streaming');
        }
      },
      {
        id: 'stream_error_handling',
        name: '流式错误处理',
        description: '检查是否处理了流式响应错误',
        severity: 'high',
        check: (content) => {
          return content.includes('try') &&
                 content.includes('catch') &&
                 content.includes('stream');
        }
      }
    ]
  },

  // 错误处理
  errorHandling: {
    name: '错误处理',
    weight: 0.10,
    checks: [
      {
        id: 'api_error_handling',
        name: 'API 错误处理',
        description: '检查是否处理了 API 调用错误',
        severity: 'critical',
        check: (content) => {
          return content.includes('try') &&
                 content.includes('catch') &&
                 (content.includes('error') ||
                  content.includes('Error'));
        }
      },
      {
        id: 'network_error_handling',
        name: '网络错误处理',
        description: '检查是否处理了网络错误',
        severity: 'high',
        check: (content) => {
          return content.includes('network') ||
                 content.includes('connection') ||
                 content.includes('timeout');
        }
      },
      {
        id: 'error_retry',
        name: '错误重试',
        description: '检查是否实现了错误重试机制',
        severity: 'medium',
        check: (content) => {
          return content.includes('retry') ||
                 content.includes('maxRetries') ||
                 content.includes('reconnect');
        }
      },
      {
        id: 'error_fallback',
        name: '错误降级',
        description: '检查是否实现了错误降级',
        severity: 'high',
        check: (content) => {
          return content.includes('fallback') ||
                 content.includes('mock') ||
                 content.includes('default');
        }
      }
    ]
  },

  // 使用统计
  usageStatistics: {
    name: '使用统计',
    weight: 0.10,
    checks: [
      {
        id: 'token_tracking',
        name: 'Token 追踪',
        description: '检查是否追踪了 Token 使用量',
        severity: 'medium',
        check: (content) => {
          return content.includes('tokens') ||
                 content.includes('tokenCount') ||
                 content.includes('usage');
        }
      },
      {
        id: 'latency_tracking',
        name: '延迟追踪',
        description: '检查是否追踪了请求延迟',
        severity: 'medium',
        check: (content) => {
          return content.includes('latency') ||
                 content.includes('duration') ||
                 content.includes('responseTime');
        }
      },
      {
        id: 'request_counting',
        name: '请求计数',
        description: '检查是否统计了请求数量',
        severity: 'low',
        check: (content) => {
          return content.includes('totalRequests') ||
                 content.includes('requestCount') ||
                 content.includes('stats');
        }
      },
      {
        id: 'stats_persistence',
        name: '统计持久化',
        description: '检查是否持久化了使用统计',
        severity: 'medium',
        check: (content) => {
          return content.includes('localStorage') &&
                 (content.includes('stats') ||
                  content.includes('usage'));
        }
      }
    ]
  },

  // 会话管理
  sessionManagement: {
    name: '会话管理',
    weight: 0.05,
    checks: [
      {
        id: 'session_creation',
        name: '会话创建',
        description: '检查是否支持创建新会话',
        severity: 'medium',
        check: (content) => {
          return content.includes('createSession') ||
                 content.includes('newSession') ||
                 content.includes('ChatSession');
        }
      },
      {
        id: 'session_switching',
        name: '会话切换',
        description: '检查是否支持切换会话',
        severity: 'medium',
        check: (content) => {
          return content.includes('switchSession') ||
                 content.includes('setActiveSession') ||
                 content.includes('activeSession');
        }
      },
      {
        id: 'session_persistence',
        name: '会话持久化',
        description: '检查是否持久化了会话数据',
        severity: 'high',
        check: (content) => {
          return content.includes('localStorage') &&
                 (content.includes('session') ||
                  content.includes('conversation'));
        }
      }
    ]
  },

  // 多提供商支持
  multiProviderSupport: {
    name: '多提供商支持',
    weight: 0.05,
    checks: [
      {
        id: 'provider_switching',
        name: '提供商切换',
        description: '检查是否支持切换提供商',
        severity: 'high',
        check: (content) => {
          return content.includes('switchProvider') ||
                 content.includes('changeProvider') ||
                 content.includes('selectedProvider');
        }
      },
      {
        id: 'provider_comparison',
        name: '提供商对比',
        description: '检查是否支持提供商对比',
        severity: 'low',
        check: (content) => {
          return content.includes('compare') ||
                 content.includes('capabilities') ||
                 content.includes('PROVIDER_CAPABILITIES');
        }
      },
      {
        id: 'provider_capabilities',
        name: '提供商能力',
        description: '检查是否定义了提供商能力',
        severity: 'medium',
        check: (content) => {
          return content.includes('capabilities') ||
                 content.includes('PROVIDER_CAPABILITIES') ||
                 content.includes('SDKCapability');
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
    pipelineAnalysis: analyzePipeline(results)
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

function analyzePipeline(results) {
  const analysis = {
    providerManagement: 0,
    sdkIntegration: 0,
    chatFunctionality: 0,
    streamingSupport: 0,
    errorHandling: 0,
    usageStatistics: 0,
    sessionManagement: 0,
    multiProviderSupport: 0
  };

  for (const result of results) {
    for (const check of result.checks) {
      if (check.passed) {
        if (check.category === 'modelProviderManagement') analysis.providerManagement++;
        if (check.category === 'sdkIntegration') analysis.sdkIntegration++;
        if (check.category === 'chatFunctionality') analysis.chatFunctionality++;
        if (check.category === 'streamingResponse') analysis.streamingSupport++;
        if (check.category === 'errorHandling') analysis.errorHandling++;
        if (check.category === 'usageStatistics') analysis.usageStatistics++;
        if (check.category === 'sessionManagement') analysis.sessionManagement++;
        if (check.category === 'multiProviderSupport') analysis.multiProviderSupport++;
      }
    }
  }

  return analysis;
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔍 YYC³ 大模型AI全链路逻辑审核检测工具');
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

  // Print pipeline analysis
  console.log('🔄 AI 全链路分析:');
  console.log(`   模型提供商管理: ${report.pipelineAnalysis.providerManagement} 次`);
  console.log(`   SDK 集成: ${report.pipelineAnalysis.sdkIntegration} 次`);
  console.log(`   聊天功能: ${report.pipelineAnalysis.chatFunctionality} 次`);
  console.log(`   流式响应: ${report.pipelineAnalysis.streamingSupport} 次`);
  console.log(`   错误处理: ${report.pipelineAnalysis.errorHandling} 次`);
  console.log(`   使用统计: ${report.pipelineAnalysis.usageStatistics} 次`);
  console.log(`   会话管理: ${report.pipelineAnalysis.sessionManagement} 次`);
  console.log(`   多提供商支持: ${report.pipelineAnalysis.multiProviderSupport} 次`);
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

  const reportPath = path.join(REPORTS_DIR, `ai-pipeline-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 审核报告已保存: ${reportPath}`);
  console.log('');

  // Determine exit code
  if (report.summary.avgScore >= 90) {
    console.log('✅ 大模型AI全链路逻辑质量优秀！');
    process.exit(0);
  } else if (report.summary.avgScore >= 70) {
    console.log('⚠️  大模型AI全链路逻辑质量良好，但仍有改进空间');
    process.exit(0);
  } else {
    console.log('❌ 大模型AI全链路逻辑需要改进');
    process.exit(1);
  }
}

// ============================================================
// 执行
// ============================================================

main();