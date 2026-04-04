#!/usr/bin/env node

/**
 * YYC³ 智能文档检查脚本
 * ==========================
 * 智能识别文档状态，避免重复处理已符合标准的文档
 *
 * 功能：
 * - 智能识别文档状态
 * - 只处理需要改进的文档
 * - 生成详细的处理报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const DOCS_DIR = path.join(__dirname, '../../docs');
const REPORTS_DIR = path.join(__dirname, '../../.archive/reports');

const BRAND_HEADER = `> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***`;

const CORE_PHILOSOPHY = `## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维`;

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

function hasCompleteHeader(header) {
  const requiredFields = ['file', 'description', 'author', 'version', 'created', 'updated', 'status', 'tags'];
  if (!header) return false;
  
  return requiredFields.every(field => header[field] && header[field].trim());
}

function hasBrandInfo(content) {
  const brandKeywords = [
    'YanYuCloudCube',
    '言启象限',
    '语枢未来',
    'Words Initiate Quadrants',
    '万象归元于云枢',
    '深栈智启新纪元'
  ];
  
  return brandKeywords.some(keyword => content.includes(keyword));
}

function hasCorePhilosophy(content) {
  const philosophyKeywords = [
    '五高架构',
    '五标体系',
    '五化转型',
    '五维评估'
  ];
  
  return philosophyKeywords.some(keyword => content.includes(keyword));
}

function analyzeDocument(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const header = extractHeader(content);
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  const analysis = {
    filePath,
    fileName,
    dirName,
    hasHeader: !!header,
    headerComplete: hasCompleteHeader(header),
    hasBrandInfo: hasBrandInfo(content),
    hasCorePhilosophy: hasCorePhilosophy(content),
    needsProcessing: false,
    processingReasons: [],
  };
  
  // 判断是否需要处理
  if (!analysis.headerComplete) {
    analysis.needsProcessing = true;
    analysis.processingReasons.push('缺少完整标头');
  }
  
  if (!analysis.hasBrandInfo) {
    analysis.needsProcessing = true;
    analysis.processingReasons.push('缺少品牌信息');
  }
  
  if (!analysis.hasCorePhilosophy) {
    analysis.needsProcessing = true;
    analysis.processingReasons.push('缺少核心理念');
  }
  
  return analysis;
}

function scanDirectory(dir, recursive = true) {
  const results = [];
  
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== '.archive') {
          if (recursive) {
            scan(fullPath);
          }
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return results;
}

// ============================================================
// 主函数
// ============================================================

function main() {
  console.log('🔍 YYC³ 智能文档检查工具');
  console.log('========================================\n');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ 文档目录不存在: ${DOCS_DIR}`);
    process.exit(1);
  }
  
  const docFiles = scanDirectory(DOCS_DIR);
  console.log(`📁 扫描到 ${docFiles.length} 个文档\n`);
  
  const analyses = docFiles.map(filePath => analyzeDocument(filePath));
  
  const needsProcessing = analyses.filter(a => a.needsProcessing);
  const alreadyCompliant = analyses.filter(a => !a.needsProcessing);
  
  console.log('📊 文档状态分析:');
  console.log(`   ✅ 已符合标准: ${alreadyCompliant.length} (${((alreadyCompliant.length/docFiles.length)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  需要处理: ${needsProcessing.length} (${((needsProcessing.length/docFiles.length)*100).toFixed(1)}%)`);
  console.log('');
  
  if (needsProcessing.length > 0) {
    console.log('🔍 需要处理的文档详情:');
    
    const reasonGroups = {};
    for (const analysis of needsProcessing) {
      for (const reason of analysis.processingReasons) {
        if (!reasonGroups[reason]) {
          reasonGroups[reason] = [];
        }
        reasonGroups[reason].push(analysis.fileName);
      }
    }
    
    for (const [reason, files] of Object.entries(reasonGroups)) {
      console.log(`\n   ${reason} (${files.length} 个):`);
      for (const file of files.slice(0, 5)) {
        console.log(`     - ${file}`);
      }
      if (files.length > 5) {
        console.log(`     ... 还有 ${files.length - 5} 个`);
      }
    }
    
    console.log('\n💡 建议:');
    console.log('   运行以下命令处理需要改进的文档:');
    console.log('   pnpm run docs:batch:headers  # 添加标头');
    console.log('   pnpm run docs:batch:brand     # 补充品牌信息');
  } else {
    console.log('🎉 所有文档都符合 YYC³ 标准！');
  }
  
  console.log('\n========================================\n');
  
  // 保存分析报告
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  
  const reportPath = path.join(REPORTS_DIR, `smart-doc-check-${Date.now()}.json`);
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {
      total: docFiles.length,
      alreadyCompliant: alreadyCompliant.length,
      needsProcessing: needsProcessing.length,
      compliantRate: (alreadyCompliant.length / docFiles.length * 100).toFixed(1),
    },
    details: analyses,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`📄 分析报告已保存: ${reportPath}`);
  
  // 返回退出码
  if (needsProcessing.length === 0) {
    process.exit(0);
  } else if (needsProcessing.length < docFiles.length * 0.1) {
    console.log('✅ 文档质量良好，只有少量文档需要处理');
    process.exit(0);
  } else {
    console.log('⚠️  有较多文档需要处理，建议运行批量处理命令');
    process.exit(1);
  }
}

// ============================================================
// 执行
// ============================================================

main();