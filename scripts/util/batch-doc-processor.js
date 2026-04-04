#!/usr/bin/env node

/**
 * YYC³ 批量文档处理脚本
 * ==========================
 * 批量处理文档标准化：添加标头、统一命名、补充品牌信息
 *
 * 功能：
 * - 批量添加 YYC³ 标准标头
 * - 统一文档命名规范
 * - 补充品牌信息
 * - 生成处理报告
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const DOCS_DIR = path.join(__dirname, '../../docs');
const ARCHIVE_DIR = path.join(__dirname, '../../.archive');
const REPORT_DIR = path.join(ARCHIVE_DIR, 'reports');

const BRAND_HEADER = `> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***`;

const BRAND_FOOTER = `<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

**© 2025-2026 YYC³ Team. All Rights Reserved.**
</div>`;

const CORE_PHILOSOPHY = `## 核心理念

**五高架构**：高可用 | 高性能 | 高安全 | 高扩展 | 高智能
**五标体系**：标准化 | 规范化 | 自动化 | 可视化 | 智能化
**五化转型**：流程化 | 数字化 | 生态化 | 工具化 | 服务化
**五维评估**：时间维 | 空间维 | 属性维 | 事件维 | 关联维`;

// ============================================================
// 工具函数
// ============================================================

function generateChecksum(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function extractExistingHeader(content) {
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

function addHeader(content, metadata) {
  const existingHeader = extractExistingHeader(content);
  const header = existingHeader || {};
  
  const mergedHeader = {
    file: metadata.file || header['file'] || path.basename(metadata.filePath),
    description: metadata.description || header['description'] || 'YYC³项目文档',
    author: metadata.author || header['author'] || 'YanYuCloudCube Team',
    version: metadata.version || header['version'] || 'v3.0.0',
    created: metadata.created || header['created'] || getCurrentDate(),
    updated: metadata.updated || header['updated'] || getCurrentDate(),
    status: metadata.status || header['status'] || 'published',
    tags: metadata.tags || header['tags'] || 'YYC³,文档',
    checksum: metadata.checksum || header['checksum'] || generateChecksum(content),
  };
  
  const headerText = `---
@file: ${mergedHeader.file}
@description: ${mergedHeader.description}
@author: ${mergedHeader.author}
@version: ${mergedHeader.version}
@created: ${mergedHeader.created}
@updated: ${mergedHeader.updated}
@status: ${mergedHeader.status}
@tags: ${mergedHeader.tags}
@checksum: ${mergedHeader.checksum}
---

${BRAND_HEADER}

---

${CORE_PHILOSOPHY}

---

`;

  return headerText + content;
}

function addBrandInfo(content) {
  if (hasBrandInfo(content)) {
    return content;
  }
  
  const lines = content.split('\n');
  const firstHeadingIndex = lines.findIndex(line => line.startsWith('#'));
  
  if (firstHeadingIndex === -1) {
    return content;
  }
  
  const newContent = [
    ...lines.slice(0, firstHeadingIndex),
    BRAND_HEADER,
    '',
    '---',
    '',
    ...lines.slice(firstHeadingIndex)
  ].join('\n');
  
  return newContent;
}

function validateNaming(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  const dirPattern = /^\d{2}-YYC3-CP-IM-[^-]+(?:-[^-]+)?$/;
  const filePattern = /^\d{3}-CP-IM-[^-]+(?:-[^-]+)?\.md$/;
  
  return {
    isValid: dirPattern.test(dirName) && filePattern.test(fileName),
    dirName,
    fileName,
    dirValid: dirPattern.test(dirName),
    fileValid: filePattern.test(fileName),
  };
}

function generateNewName(filePath) {
  const fileName = path.basename(filePath);
  const dirName = path.basename(path.dirname(filePath));
  
  if (fileName === 'README.md') {
    return filePath;
  }
  
  if (fileName.startsWith('YYC') && fileName.includes('-')) {
    return filePath;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '文档';
  
  const newFileName = `${fileName.replace('.md', '')}-${title.replace(/\s+/g, '-')}.md`;
  return path.join(path.dirname(filePath), newFileName);
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
// 处理函数
// ============================================================

function processAddHeaders(docFiles, options = {}) {
  const results = {
    total: docFiles.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };
  
  for (const filePath of docFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const existingHeader = extractExistingHeader(content);
      
      if (existingHeader && !options.force) {
        results.skipped++;
        results.details.push({
          filePath,
          status: 'skipped',
          reason: '已有标头',
        });
        continue;
      }
      
      const newContent = addHeader(content, {
        filePath,
        force: options.force,
      });
      
      if (!options.dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
      }
      
      results.processed++;
      results.details.push({
        filePath,
        status: 'processed',
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        filePath,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  return results;
}

function processAddBrandInfo(docFiles, options = {}) {
  const results = {
    total: docFiles.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    details: [],
  };
  
  for (const filePath of docFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      if (hasBrandInfo(content)) {
        results.skipped++;
        results.details.push({
          filePath,
          status: 'skipped',
          reason: '已有品牌信息',
        });
        continue;
      }
      
      const newContent = addBrandInfo(content);
      
      if (!options.dryRun) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
      }
      
      results.processed++;
      results.details.push({
        filePath,
        status: 'processed',
      });
    } catch (error) {
      results.failed++;
      results.details.push({
        filePath,
        status: 'failed',
        error: error.message,
      });
    }
  }
  
  return results;
}

function processValidateNaming(docFiles) {
  const results = {
    total: docFiles.length,
    valid: 0,
    invalid: 0,
    details: [],
  };
  
  for (const filePath of docFiles) {
    const validation = validateNaming(filePath);
    
    if (validation.isValid) {
      results.valid++;
    } else {
      results.invalid++;
    }
    
    results.details.push({
      filePath,
      ...validation,
    });
  }
  
  return results;
}

// ============================================================
// 报告生成
// ============================================================

function generateReport(results) {
  console.log('\n📊 YYC³ 批量文档处理报告');
  console.log('========================================\n');
  
  for (const [operation, result] of Object.entries(results)) {
    console.log(`📋 ${operation}:`);
    console.log(`   总数: ${result.total}`);
    console.log(`   处理: ${result.processed || result.valid || 0}`);
    console.log(`   跳过: ${result.skipped || 0}`);
    console.log(`   失败: ${result.failed || result.invalid || 0}`);
    console.log('');
  }
  
  console.log('========================================\n');
}

function saveReport(results, reportName) {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
  
  const reportPath = path.join(REPORT_DIR, `${reportName}-${Date.now()}.json`);
  const reportData = {
    timestamp: new Date().toISOString(),
    results,
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  console.log(`📄 报告已保存: ${reportPath}`);
}

// ============================================================
// 主函数
// ============================================================

function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🔧 YYC³ 批量文档处理工具');
  console.log('========================================\n');
  
  if (!fs.existsSync(DOCS_DIR)) {
    console.error(`❌ 文档目录不存在: ${DOCS_DIR}`);
    process.exit(1);
  }
  
  const docFiles = scanDirectory(DOCS_DIR);
  console.log(`📁 扫描到 ${docFiles.length} 个文档\n`);
  
  const options = {
    dryRun: args.includes('--dry-run'),
    force: args.includes('--force'),
  };
  
  if (options.dryRun) {
    console.log('⚠️  预览模式 - 不会实际修改文件\n');
  }
  
  const results = {};
  
  switch (command) {
    case 'headers':
      console.log('📝 批量添加文档标头...\n');
      results.addHeaders = processAddHeaders(docFiles, options);
      break;
      
    case 'brand':
      console.log('🏷️  批量补充品牌信息...\n');
      results.addBrandInfo = processAddBrandInfo(docFiles, options);
      break;
      
    case 'naming':
      console.log('🔍 验证命名规范...\n');
      results.validateNaming = processValidateNaming(docFiles);
      break;
      
    case 'all':
      console.log('🚀 执行所有处理...\n');
      results.addHeaders = processAddHeaders(docFiles, options);
      results.addBrandInfo = processAddBrandInfo(docFiles, options);
      results.validateNaming = processValidateNaming(docFiles);
      break;
      
    default:
      console.log('用法: node batch-doc-processor.js <command> [options]');
      console.log('');
      console.log('命令:');
      console.log('  headers   - 批量添加文档标头');
      console.log('  brand     - 批量补充品牌信息');
      console.log('  naming    - 验证命名规范');
      console.log('  all       - 执行所有处理');
      console.log('');
      console.log('选项:');
      console.log('  --dry-run - 预览模式，不实际修改文件');
      console.log('  --force   - 强制覆盖已有标头');
      process.exit(0);
  }
  
  generateReport(results);
  saveReport(results, `batch-doc-processor-${command}`);
}

// ============================================================
// 执行
// ============================================================

main();