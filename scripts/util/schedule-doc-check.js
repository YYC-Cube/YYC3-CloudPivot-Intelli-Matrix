#!/usr/bin/env node

/**
 * YYC³ 文档定期检查脚本
 * ==========================
 * 定期运行文档检查并跟踪进度变化
 *
 * 功能：
 * - 运行文档标准检查
 * - 运行文档审核
 * - 记录历史数据
 * - 生成趋势报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const HISTORY_DIR = path.join(__dirname, '../../.archive/history');
const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');
const REVIEWS_DIR = path.join(__dirname, '../../.archive/reviews');

const HISTORY_FILE = path.join(HISTORY_DIR, 'doc-quality-history.json');

// ============================================================
// 工具函数
// ============================================================

function ensureDirectories() {
  [HISTORY_DIR, REPORTS_DIR, REVIEWS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 加载历史数据失败:', error.message);
    return [];
  }
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log(`📄 历史数据已保存: ${HISTORY_FILE}`);
}

function findLatestReports() {
  const reports = [];
  
  // 查找最新的标准检查报告
  const reportFiles = fs.readdirSync(REPORTS_DIR)
    .filter(file => file.startsWith('batch-doc-processor-') || file.startsWith('doc-standard-check-report-'))
    .sort()
    .reverse();
  
  if (reportFiles.length > 0) {
    const latestReport = path.join(REPORTS_DIR, reportFiles[0]);
    try {
      const data = fs.readFileSync(latestReport, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (parsed.results && parsed.results.addHeaders) {
        reports.push({
          type: 'standard_check',
          timestamp: parsed.timestamp,
          data: parsed.results.addHeaders,
        });
      } else if (parsed.summary) {
        reports.push({
          type: 'standard_check',
          timestamp: parsed.timestamp,
          data: parsed.summary,
        });
      }
    } catch (error) {
      console.error('❌ 加载标准检查报告失败:', error.message);
    }
  }
  
  // 查找最新的审核报告
  const reviewFiles = fs.readdirSync(REVIEWS_DIR)
    .filter(file => file.startsWith('doc-review-'))
    .sort()
    .reverse();
  
  if (reviewFiles.length > 0) {
    const latestReview = path.join(REVIEWS_DIR, reviewFiles[0]);
    try {
      const data = fs.readFileSync(latestReview, 'utf-8');
      const parsed = JSON.parse(data);
      
      if (parsed.summary) {
        reports.push({
          type: 'review',
          timestamp: parsed.timestamp,
          data: parsed.summary,
        });
      }
    } catch (error) {
      console.error('❌ 加载审核报告失败:', error.message);
    }
  }
  
  return reports;
}

function calculateTrend(history) {
  if (history.length < 2) {
    return {
      trend: 'insufficient_data',
      message: '数据不足，无法计算趋势',
    };
  }
  
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const scoreChange = latest.overallScore - previous.overallScore;
  const headerChange = latest.headerComplete - previous.headerComplete;
  const brandChange = latest.brandComplete - previous.brandComplete;
  const namingChange = latest.namingValid - previous.namingValid;
  
  const changes = [];
  
  if (scoreChange > 5) {
    changes.push(`整体评分提升 ${scoreChange.toFixed(1)} 分 📈`);
  } else if (scoreChange < -5) {
    changes.push(`整体评分下降 ${Math.abs(scoreChange).toFixed(1)} 分 📉`);
  }
  
  if (headerChange > 10) {
    changes.push(`标头完整性提升 ${headerChange.toFixed(1)}%`);
  } else if (headerChange < -10) {
    changes.push(`标头完整性下降 ${Math.abs(headerChange).toFixed(1)}%`);
  }
  
  if (brandChange > 10) {
    changes.push(`品牌信息完整度提升 ${brandChange.toFixed(1)}%`);
  } else if (brandChange < -10) {
    changes.push(`品牌信息完整度下降 ${Math.abs(brandChange).toFixed(1)}%`);
  }
  
  if (namingChange > 10) {
    changes.push(`命名规范符合率提升 ${namingChange.toFixed(1)}%`);
  } else if (namingChange < -10) {
    changes.push(`命名规范符合率下降 ${Math.abs(namingChange).toFixed(1)}%`);
  }
  
  if (changes.length === 0) {
    return {
      trend: 'stable',
      message: '各项指标保持稳定',
    };
  }
  
  return {
    trend: scoreChange >= 0 ? 'improving' : 'declining',
    message: changes.join('，'),
  };
}

function generateTrendReport(history, reports) {
  console.log('\n📊 YYC³ 文档质量趋势报告');
  console.log('========================================\n');
  
  if (history.length === 0) {
    console.log('📋 暂无历史数据\n');
    return;
  }
  
  const latest = history[history.length - 1];
  
  console.log(`📅 检查时间: ${new Date(latest.timestamp).toLocaleString('zh-CN')}`);
  console.log(`📁 文档总数: ${latest.totalDocs}`);
  console.log('');
  
  console.log('📈 当前状态:');
  console.log(`   标头完整性: ${latest.headerComplete.toFixed(1)}%`);
  console.log(`   品牌信息完整: ${latest.brandComplete.toFixed(1)}%`);
  console.log(`   命名规范符合: ${latest.namingValid.toFixed(1)}%`);
  console.log(`   综合评分: ${latest.overallScore.toFixed(1)}/100`);
  console.log('');
  
  if (history.length >= 2) {
    const trend = calculateTrend(history);
    console.log('📊 趋势分析:');
    console.log(`   ${trend.message}`);
    console.log('');
  }
  
  console.log('📋 历史记录:');
  const recentHistory = history.slice(-10).reverse();
  for (const record of recentHistory) {
    const date = new Date(record.timestamp).toLocaleDateString('zh-CN');
    console.log(`   ${date}: ${record.overallScore.toFixed(1)}分`);
  }
  
  if (history.length > 10) {
    console.log(`   ... 还有 ${history.length - 10} 条记录`);
  }
  
  console.log('\n========================================\n');
}

function runChecks() {
  console.log('🔍 运行文档检查...\n');
  
  const reports = findLatestReports();
  
  if (reports.length === 0) {
    console.log('⚠️  未找到检查报告，请先运行文档检查');
    return null;
  }
  
  const standardCheck = reports.find(r => r.type === 'standard_check');
  const review = reports.find(r => r.type === 'review');
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalDocs: 0,
    headerComplete: 0,
    brandComplete: 0,
    namingValid: 0,
    overallScore: 0,
    approved: 0,
    needsRevision: 0,
    rejected: 0,
  };
  
  if (standardCheck && standardCheck.data.summary) {
    const s = standardCheck.data.summary;
    summary.totalDocs = s.totalDocs || 0;
    summary.headerComplete = s.headerComplete || 0;
    summary.brandComplete = s.brandComplete || 0;
    summary.namingValid = s.namingValid || 0;
    summary.overallScore = s.overallScore || 0;
  }
  
  if (review && review.data.summary) {
    const r = review.data.summary;
    summary.approved = r.approved || 0;
    summary.needsRevision = r.needs_revision || 0;
    summary.rejected = r.rejected || 0;
  }
  
  return summary;
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔄 YYC³ 文档定期检查工具');
  console.log('========================================\n');
  
  ensureDirectories();
  
  const summary = runChecks();
  
  if (!summary) {
    console.log('💡 提示: 请先运行以下命令生成检查报告');
    console.log('   pnpm run docs:check');
    process.exit(1);
  }
  
  const history = loadHistory();
  history.push(summary);
  
  // 只保留最近 30 条记录
  if (history.length > 30) {
    history.splice(0, history.length - 30);
  }
  
  saveHistory(history);
  generateTrendReport(history, findLatestReports());
  
  // 根据评分给出建议
  if (summary.overallScore >= 90) {
    console.log('🎉 文档质量优秀！继续保持！');
  } else if (summary.overallScore >= 80) {
    console.log('👍 文档质量良好，可以进一步优化');
  } else if (summary.overallScore >= 70) {
    console.log('⚠️  文档质量一般，需要改进');
    console.log('💡 建议: 运行 pnpm run docs:batch:all 进行批量处理');
  } else {
    console.log('❌ 文档质量不合格，需要大幅改进');
    console.log('💡 建议:');
    console.log('   1. 运行 pnpm run docs:batch:headers 添加标头');
    console.log('   2. 运行 pnpm run docs:batch:brand 补充品牌信息');
    console.log('   3. 检查并修正命名规范');
  }
}

// ============================================================
// 执行
// ============================================================

main();