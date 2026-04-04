#!/usr/bin/env node

/**
 * YYC³ 综合审核报告生成器
 * ===========================
 * 生成 IDE 页面布局、全端统一数据源、大模型 AI 全链路的综合审核报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');

// ============================================================
// 工具函数
// ============================================================

function findLatestReport(pattern) {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(file => file.match(pattern))
      .sort()
      .reverse();

    if (files.length > 0) {
      const filePath = path.join(REPORTS_DIR, files[0]);
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error(`❌ 无法读取报告: ${error.message}`);
  }
  return null;
}

function generateComprehensiveReport() {
  console.log('📊 YYC³ 综合审核报告生成器');
  console.log('========================================\n');

  // Load all reports
  const ideReport = findLatestReport(/ide-layout-audit-\d+\.json$/);
  const dataReport = findLatestReport(/unified-data-source-audit-\d+\.json$/);
  const aiReport = findLatestReport(/ai-pipeline-audit-\d+\.json$/);

  if (!ideReport && !dataReport && !aiReport) {
    console.log('❌ 未找到任何审核报告');
    console.log('💡 请先运行以下命令生成报告:');
    console.log('   pnpm run audit:ide-layout');
    console.log('   pnpm run audit:unified-data-source');
    console.log('   pnpm run audit:ai-pipeline');
    process.exit(1);
  }

  // Generate comprehensive report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      ideLayout: ideReport ? {
        totalFiles: ideReport.summary.totalFiles,
        totalChecks: ideReport.summary.totalChecks,
        totalPassed: ideReport.summary.totalPassed,
        totalFailed: ideReport.summary.totalFailed,
        totalWarnings: ideReport.summary.totalWarnings,
        avgScore: ideReport.summary.avgScore,
        passRate: ideReport.summary.passRate
      } : null,
      unifiedDataSource: dataReport ? {
        totalFiles: dataReport.summary.totalFiles,
        totalChecks: dataReport.summary.totalChecks,
        totalPassed: dataReport.summary.totalPassed,
        totalFailed: dataReport.summary.totalFailed,
        totalWarnings: dataReport.summary.totalWarnings,
        avgScore: dataReport.summary.avgScore,
        passRate: dataReport.summary.passRate
      } : null,
      aiPipeline: aiReport ? {
        totalFiles: aiReport.summary.totalFiles,
        totalChecks: aiReport.summary.totalChecks,
        totalPassed: aiReport.summary.totalPassed,
        totalFailed: aiReport.summary.totalFailed,
        totalWarnings: aiReport.summary.totalWarnings,
        avgScore: aiReport.summary.avgScore,
        passRate: aiReport.summary.passRate
      } : null,
      overall: {
        totalFiles: (ideReport?.summary.totalFiles || 0) +
                    (dataReport?.summary.totalFiles || 0) +
                    (aiReport?.summary.totalFiles || 0),
        totalChecks: (ideReport?.summary.totalChecks || 0) +
                    (dataReport?.summary.totalChecks || 0) +
                    (aiReport?.summary.totalChecks || 0),
        totalPassed: (ideReport?.summary.totalPassed || 0) +
                    (dataReport?.summary.totalPassed || 0) +
                    (aiReport?.summary.totalPassed || 0),
        totalFailed: (ideReport?.summary.totalFailed || 0) +
                    (dataReport?.summary.totalFailed || 0) +
                    (aiReport?.summary.totalFailed || 0),
        totalWarnings: (ideReport?.summary.totalWarnings || 0) +
                      (dataReport?.summary.totalWarnings || 0) +
                      (aiReport?.summary.totalWarnings || 0),
        avgScore: Math.round(
          ((ideReport?.summary.avgScore || 0) +
           (dataReport?.summary.avgScore || 0) +
           (aiReport?.summary.avgScore || 0)) / 3
        ),
        passRate: ((ideReport?.summary.passRate || 0) +
                   (dataReport?.summary.passRate || 0) +
                   (aiReport?.summary.passRate || 0)) / 3
      }
    },
    details: {
      ideLayout: ideReport?.details || [],
      unifiedDataSource: dataReport?.details || [],
      aiPipeline: aiReport?.details || []
    },
    recommendations: generateRecommendations(ideReport, dataReport, aiReport)
  };

  // Print report
  printReport(report);

  // Save report
  const reportPath = path.join(REPORTS_DIR, `comprehensive-audit-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 综合审核报告已保存: ${reportPath}`);

  return report;
}

function printReport(report) {
  console.log('📊 YYC³ 综合审核报告');
  console.log('========================================\n');

  // Overall summary
  console.log('📈 总体概况:');
  console.log(`   总文件数: ${report.summary.overall.totalFiles}`);
  console.log(`   总检查项: ${report.summary.overall.totalChecks}`);
  console.log(`   ✅ 通过: ${report.summary.overall.totalPassed} (${report.summary.overall.passRate.toFixed(1)}%)`);
  console.log(`   ❌ 失败: ${report.summary.overall.totalFailed}`);
  console.log(`   ⚠️  警告: ${report.summary.overall.totalWarnings}`);
  console.log(`   📊 综合得分: ${report.summary.overall.avgScore}/100`);
  console.log('');

  // Individual summaries
  if (report.summary.ideLayout) {
    console.log('🖥️  IDE 页面布局:');
    console.log(`   文件数: ${report.summary.ideLayout.totalFiles}`);
    console.log(`   检查项: ${report.summary.ideLayout.totalChecks}`);
    console.log(`   通过率: ${report.summary.ideLayout.passRate}%`);
    console.log(`   得分: ${report.summary.ideLayout.avgScore}/100`);
    console.log('');
  }

  if (report.summary.unifiedDataSource) {
    console.log('🔄 全端统一数据源:');
    console.log(`   文件数: ${report.summary.unifiedDataSource.totalFiles}`);
    console.log(`   检查项: ${report.summary.unifiedDataSource.totalChecks}`);
    console.log(`   通过率: ${report.summary.unifiedDataSource.passRate}%`);
    console.log(`   得分: ${report.summary.unifiedDataSource.avgScore}/100`);
    console.log('');
  }

  if (report.summary.aiPipeline) {
    console.log('🤖 大模型 AI 全链路:');
    console.log(`   文件数: ${report.summary.aiPipeline.totalFiles}`);
    console.log(`   检查项: ${report.summary.aiPipeline.totalChecks}`);
    console.log(`   通过率: ${report.summary.aiPipeline.passRate}%`);
    console.log(`   得分: ${report.summary.aiPipeline.avgScore}/100`);
    console.log('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('💡 优先改进建议:');
    console.log('');

    for (const rec of report.recommendations.slice(0, 15)) {
      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[rec.priority];

      console.log(`   ${priorityEmoji} ${rec.area} - ${rec.issue} (${rec.priority})`);
      console.log(`      描述: ${rec.description}`);
      console.log(`      建议: ${rec.recommendation}`);
      console.log('');
    }
  }

  // Overall assessment
  console.log('🎯 总体评估:');
  const score = report.summary.overall.avgScore;
  if (score >= 90) {
    console.log('   ✅ 优秀 - 系统质量达到 YYC³ 高标准');
  } else if (score >= 70) {
    console.log('   ⚠️  良好 - 系统质量符合基本要求，但仍有改进空间');
  } else if (score >= 50) {
    console.log('   ⚠️  需要改进 - 系统存在较多问题，需要重点优化');
  } else {
    console.log('   ❌ 不合格 - 系统质量严重不达标，需要全面重构');
  }
  console.log('');
}

function generateRecommendations(ideReport, dataReport, aiReport) {
  const recommendations = [];

  // Collect recommendations from all reports
  if (ideReport?.recommendations) {
    for (const rec of ideReport.recommendations) {
      recommendations.push({
        area: 'IDE 页面布局',
        ...rec
      });
    }
  }

  if (dataReport?.recommendations) {
    for (const rec of dataReport.recommendations) {
      recommendations.push({
        area: '全端统一数据源',
        ...rec
      });
    }
  }

  if (aiReport?.recommendations) {
    for (const rec of aiReport.recommendations) {
      recommendations.push({
        area: '大模型 AI 全链路',
        ...rec
      });
    }
  }

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================
// 主函数
// ============================================================

function main() {
  const report = generateComprehensiveReport();

  // Determine exit code
  const score = report.summary.overall.avgScore;
  if (score >= 70) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

// ============================================================
// 执行
// ============================================================

main();