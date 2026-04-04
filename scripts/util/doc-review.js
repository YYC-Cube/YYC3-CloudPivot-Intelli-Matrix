#!/usr/bin/env node

/**
 * YYC³ 文档审核机制
 * ==========================
 * 文档审核检查清单和流程管理
 *
 * 功能：
 * - 文档质量审核
 * - 标准符合性检查
 * - 审核报告生成
 * - 审核状态跟踪
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const DOCS_DIR = path.join(__dirname, '../../docs');
const REVIEW_DIR = path.join(__dirname, '../../.archive/reviews');

// 审核检查项
const REVIEW_CHECKLIST = {
  // 标头完整性
  header: {
    name: '标头完整性',
    weight: 0.25,
    checks: [
      { id: 'file', name: '@file 字段', required: true },
      { id: 'description', name: '@description 字段', required: true },
      { id: 'author', name: '@author 字段', required: true },
      { id: 'version', name: '@version 字段', required: true },
      { id: 'created', name: '@created 字段', required: true },
      { id: 'updated', name: '@updated 字段', required: true },
      { id: 'status', name: '@status 字段', required: true },
      { id: 'tags', name: '@tags 字段', required: true },
    ],
  },
  
  // 品牌信息
  brand: {
    name: '品牌信息',
    weight: 0.20,
    checks: [
      { id: 'brand_name', name: 'YanYuCloudCube', required: true },
      { id: 'slogan_cn', name: '言启象限', required: true },
      { id: 'slogan_en', name: 'Words Initiate Quadrants', required: true },
      { id: 'vision_cn', name: '万象归元于云枢', required: false },
      { id: 'vision_en', name: 'Deep stacks ignite a new era', required: false },
    ],
  },
  
  // 核心理念
  philosophy: {
    name: '核心理念',
    weight: 0.15,
    checks: [
      { id: 'five_highs', name: '五高架构', required: true },
      { id: 'five_standards', name: '五标体系', required: true },
      { id: 'five_transformations', name: '五化转型', required: true },
      { id: 'five_dimensions', name: '五维评估', required: true },
    ],
  },
  
  // 内容质量
  content: {
    name: '内容质量',
    weight: 0.20,
    checks: [
      { id: 'structure', name: '文档结构清晰', required: true },
      { id: 'length', name: '内容长度适中 (>500字)', required: true },
      { id: 'formatting', name: '格式规范', required: true },
      { id: 'language', name: '语言表达准确', required: true },
    ],
  },
  
  // 命名规范
  naming: {
    name: '命名规范',
    weight: 0.10,
    checks: [
      { id: 'file_naming', name: '文件命名符合规范', required: true },
      { id: 'dir_naming', name: '目录命名符合规范', required: true },
    ],
  },
  
  // 追溯信息
  traceability: {
    name: '追溯信息',
    weight: 0.10,
    checks: [
      { id: 'checksum', name: '内容校验和', required: true },
      { id: 'version_info', name: '版本信息', required: true },
      { id: 'related_docs', name: '关联文档', required: false },
    ],
  },
};

// 审核状态
const REVIEW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  NEEDS_REVISION: 'needs_revision',
};

// ============================================================
// 工具函数
// ============================================================

function extractHeader(content) {
  const headerMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!headerMatch) return null;
  
  const headerText = headerMatch[1];
  const header = {};
  
  const lines = headerText.split('\n');
  for (const line of lines) {
    const match = line.match(/^@(\w+):\s*(.*)$/);
    if (match) {
      header[match[1]] = match[2].trim();
    }
  }
  
  return header;
}

function checkHeader(header) {
  const results = {};
  const category = REVIEW_CHECKLIST.header;
  
  for (const check of category.checks) {
    results[check.id] = {
      passed: header && header[check.id],
      required: check.required,
      name: check.name,
    };
  }
  
  return results;
}

function checkBrandInfo(content) {
  const results = {};
  const category = REVIEW_CHECKLIST.brand;
  
  for (const check of category.checks) {
    results[check.id] = {
      passed: content.includes(check.name),
      required: check.required,
      name: check.name,
    };
  }
  
  return results;
}

function checkPhilosophy(content) {
  const results = {};
  const category = REVIEW_CHECKLIST.philosophy;
  
  const philosophyPatterns = {
    five_highs: /五高架构|高可用|高性能|高安全|高扩展|高智能/,
    five_standards: /五标体系|标准化|规范化|自动化|可视化|智能化/,
    five_transformations: /五化转型|流程化|数字化|生态化|工具化|服务化/,
    five_dimensions: /五维评估|时间维|空间维|属性维|事件维|关联维/,
  };
  
  for (const check of category.checks) {
    const pattern = philosophyPatterns[check.id];
    results[check.id] = {
      passed: pattern && pattern.test(content),
      required: check.required,
      name: check.name,
    };
  }
  
  return results;
}

function checkContent(content) {
  const results = {};
  const category = REVIEW_CHECKLIST.content;
  
  results.structure = {
    passed: /^#+\s/.test(content) && /\n##\s/.test(content),
    required: true,
    name: '文档结构清晰',
  };
  
  results.length = {
    passed: content.length > 500,
    required: true,
    name: '内容长度适中 (>500字)',
  };
  
  results.formatting = {
    passed: /\n---\n/.test(content) || /\n\n/.test(content),
    required: true,
    name: '格式规范',
  };
  
  results.language = {
    passed: content.length > 100,
    required: true,
    name: '语言表达准确',
  };
  
  return results;
}

function checkNaming(filePath) {
  const results = {};
  const category = REVIEW_CHECKLIST.naming;
  
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  results.file_naming = {
    passed: /^\d{3}-CP-IM-[^-]+(?:-[^-]+)?\.md$/.test(fileName) || 
              fileName === 'README.md' ||
              fileName.startsWith('YYC'),
    required: true,
    name: '文件命名符合规范',
  };
  
  results.dir_naming = {
    passed: /^\d{2}-YYC3-CP-IM-[^-]+(?:-[^-]+)?$/.test(dirName),
    required: true,
    name: '目录命名符合规范',
  };
  
  return results;
}

function checkTraceability(content, header) {
  const results = {};
  const category = REVIEW_CHECKLIST.traceability;
  
  results.checksum = {
    passed: header && header.checksum,
    required: true,
    name: '内容校验和',
  };
  
  results.version_info = {
    passed: header && header.version && header.created && header.updated,
    required: true,
    name: '版本信息',
  };
  
  results.related_docs = {
    passed: header && header.related_docs && header.related_docs !== '无',
    required: false,
    name: '关联文档',
  };
  
  return results;
}

function calculateScore(reviewResults) {
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const [category, results] of Object.entries(reviewResults)) {
    const categoryConfig = REVIEW_CHECKLIST[category];
    const weight = categoryConfig.weight;
    
    let passedCount = 0;
    let totalCount = 0;
    
    for (const [checkId, result] of Object.entries(results)) {
      totalCount++;
      if (result.passed) {
        passedCount++;
      }
    }
    
    const categoryScore = totalCount > 0 ? passedCount / totalCount : 0;
    totalScore += categoryScore * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
}

function determineStatus(score) {
  if (score >= 90) return REVIEW_STATUS.APPROVED;
  if (score >= 70) return REVIEW_STATUS.NEEDS_REVISION;
  return REVIEW_STATUS.REJECTED;
}

// ============================================================
// 审核函数
// ============================================================

function reviewDocument(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const header = extractHeader(content);
  
  const reviewResults = {
    header: checkHeader(header),
    brand: checkBrandInfo(content),
    philosophy: checkPhilosophy(content),
    content: checkContent(content),
    naming: checkNaming(filePath),
    traceability: checkTraceability(content, header),
  };
  
  const score = calculateScore(reviewResults);
  const status = determineStatus(score);
  
  return {
    filePath,
    reviewResults,
    score,
    status,
    reviewedAt: new Date().toISOString(),
  };
}

function reviewDocuments(docFiles) {
  const results = {
    total: docFiles.length,
    approved: 0,
    needs_revision: 0,
    rejected: 0,
    averageScore: 0,
    details: [],
  };
  
  let totalScore = 0;
  
  for (const filePath of docFiles) {
    try {
      const review = reviewDocument(filePath);
      results.details.push(review);
      
      totalScore += review.score;
      
      if (review.status === REVIEW_STATUS.APPROVED) {
        results.approved++;
      } else if (review.status === REVIEW_STATUS.NEEDS_REVISION) {
        results.needs_revision++;
      } else {
        results.rejected++;
      }
    } catch (error) {
      results.details.push({
        filePath,
        error: error.message,
        score: 0,
        status: REVIEW_STATUS.REJECTED,
      });
    }
  }
  
  results.averageScore = docFiles.length > 0 ? totalScore / docFiles.length : 0;
  
  return results;
}

// ============================================================
// 报告生成
// ============================================================

function generateReviewReport(results) {
  console.log('\n📋 YYC³ 文档审核报告');
  console.log('========================================\n');
  
  console.log(`📊 审核统计:`);
  console.log(`   总文档数: ${results.total}`);
  console.log(`   ✅ 通过: ${results.approved} (${((results.approved/results.total)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  需要修订: ${results.needs_revision} (${((results.needs_revision/results.total)*100).toFixed(1)}%)`);
  console.log(`   ❌ 拒绝: ${results.rejected} (${((results.rejected/results.total)*100).toFixed(1)}%)`);
  console.log(`   📈 平均得分: ${results.averageScore.toFixed(1)}/100`);
  
  console.log('\n📋 分类得分:');
  
  const categoryScores = {};
  for (const detail of results.details) {
    for (const [category, checks] of Object.entries(detail.reviewResults)) {
      if (!categoryScores[category]) {
        categoryScores[category] = { total: 0, count: 0 };
      }
      
      let passed = 0;
      for (const check of Object.values(checks)) {
        if (check.passed) passed++;
      }
      
      categoryScores[category].total += passed / Object.keys(checks).length;
      categoryScores[category].count++;
    }
  }
  
  for (const [category, scores] of Object.entries(categoryScores)) {
    const avgScore = (scores.total / scores.count) * 100;
    const categoryName = REVIEW_CHECKLIST[category].name;
    const weight = REVIEW_CHECKLIST[category].weight;
    console.log(`   ${categoryName}: ${avgScore.toFixed(1)}% (权重: ${(weight*100).toFixed(0)}%)`);
  }
  
  console.log('\n🔍 需要改进的文档:');
  const needsImprovement = results.details.filter(d => d.status !== REVIEW_STATUS.APPROVED);
  if (needsImprovement.length > 0) {
    for (const doc of needsImprovement.slice(0, 10)) {
      const fileName = path.basename(doc.filePath);
      console.log(`   - ${fileName} (${doc.score.toFixed(1)}分)`);
    }
    if (needsImprovement.length > 10) {
      console.log(`   ... 还有 ${needsImprovement.length - 10} 个文档需要改进`);
    }
  } else {
    console.log('   ✅ 所有文档都符合标准');
  }
  
  console.log('\n========================================\n');
  
  return results;
}

function saveReviewReport(results, reportName) {
  if (!fs.existsSync(REVIEW_DIR)) {
    fs.mkdirSync(REVIEW_DIR, { recursive: true });
  }
  
  const reportPath = path.join(REVIEW_DIR, `${reportName}-${Date.now()}.json`);
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.total,
      approved: results.approved,
      needs_revision: results.needs_revision,
      rejected: results.rejected,
      averageScore: results.averageScore,
    },
    details: results.details,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`📄 审核报告已保存: ${reportPath}`);
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔍 YYC³ 文档审核工具');
  console.log('========================================\n');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ 文档目录不存在: ${DOCS_DIR}`);
    process.exit(1);
  }
  
  const docFiles = fs.readdirSync(DOCS_DIR, { recursive: true })
    .filter(file => file.endsWith('.md'))
    .map(file => path.join(DOCS_DIR, file));
  
  console.log(`📁 扫描到 ${docFiles.length} 个文档\n`);
  
  const results = reviewDocuments(docFiles);
  generateReviewReport(results);
  saveReviewReport(results, 'doc-review');
  
  if (results.averageScore >= 80) {
    console.log('🎉 文档质量良好！');
    process.exit(0);
  } else if (results.averageScore >= 60) {
    console.log('⚠️  文档质量需要改进');
    process.exit(1);
  } else {
    console.log('❌ 文档质量不合格，需要大幅改进');
    process.exit(2);
  }
}

// ============================================================
// 执行
// ============================================================

main();