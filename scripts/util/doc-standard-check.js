#!/usr/bin/env node

/**
 * YYC³ 文档标准检查脚本
 * ==========================
 * 自动检查文档是否符合 YYC³ 标准规范
 *
 * 检查项目：
 * - 文档标头完整性 (@file, @description, @author, @version, @created, @updated, @status, @tags)
 * - 文档命名规范
 * - 文档位置规范
 * - 品牌信息完整性
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================
// 配置
// ============================================================

const REQUIRED_HEADER_FIELDS = [
    '@file',
    '@description',
    '@author',
    '@version',
    '@created',
    '@updated',
    '@status',
    '@tags',
];

const REQUIRED_BRAND_INFO = [
    'YanYuCloudCube',
    '言启象限',
    '语枢未来',
    'Words Initiate Quadrants',
    'Language Serves as Core for Future',
    '万象归元于云枢',
    '深栈智启新纪元',
];

const DOCS_DIR = path.join(__dirname, '../../docs');
const ARCHIVE_DIR = path.join(__dirname, '../../.archive');

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

function checkHeaderCompleteness(header, filePath) {
    const missing = [];
    const empty = [];

    for (const field of REQUIRED_HEADER_FIELDS) {
        if (!header[field]) {
            missing.push(field);
        } else if (!header[field].trim()) {
            empty.push(field);
        }
    }

    return {
        filePath,
        missing,
        empty,
        isComplete: missing.length === 0 && empty.length === 0,
    };
}

function checkBrandInfo(content, filePath) {
    const missing = [];

    for (const brandInfo of REQUIRED_BRAND_INFO) {
        if (!content.includes(brandInfo)) {
            missing.push(brandInfo);
        }
    }

    return {
        filePath,
        missing,
        isComplete: missing.length === 0,
    };
}

function validateNaming(filePath) {
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));

    // 检查目录命名规范
    const dirPattern = /^\d{2}-YYC3-CP-IM-[^-]+(?:-[^-]+)?$/;
    const isDirValid = dirPattern.test(dirName);

    // 检查文件命名规范
    const filePattern = /^\d{3}-CP-IM-[^-]+(?:-[^-]+)?\.md$/;
    const isFileValid = filePattern.test(fileName);

    return {
        filePath,
        fileName,
        dirName,
        isDirValid,
        isFileValid,
        isValid: isDirValid && isFileValid,
    };
}

function scanDirectory(dir, recursive = true) {
    const results = [];

    function scan(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                // 跳过隐藏目录和归档目录
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

function generateReport(results) {
    const totalDocs = results.length;
    const headerComplete = results.filter(r => r.headerCheck.isComplete).length;
    const brandComplete = results.filter(r => r.brandCheck.isComplete).length;
    const namingValid = results.filter(r => r.namingCheck.isValid).length;

    console.log('\n📊 YYC³ 文档标准检查报告');
    console.log('========================================\n');

    console.log(`📁 总文档数: ${totalDocs}`);
    console.log(`✅ 标头完整: ${headerComplete}/${totalDocs} (${((headerComplete / totalDocs) * 100).toFixed(1)}%)`);
    console.log(`✅ 品牌信息完整: ${brandComplete}/${totalDocs} (${((brandComplete / totalDocs) * 100).toFixed(1)}%)`);
    console.log(`✅ 命名规范: ${namingValid}/${totalDocs} (${((namingValid / totalDocs) * 100).toFixed(1)}%)`);

    console.log('\n🔍 标头缺失字段详情:');
    const allMissingHeaders = results.flatMap(r => r.headerCheck.missing.map(m => ({ file: r.headerCheck.filePath, field: m })));
    if (allMissingHeaders.length > 0) {
        const fieldCounts = {};
        for (const item of allMissingHeaders) {
            fieldCounts[item.field] = (fieldCounts[item.field] || 0) + 1;
        }

        for (const [field, count] of Object.entries(fieldCounts)) {
            console.log(`   ${field}: ${count} 个文档`);
        }
    } else {
        console.log('   ✅ 无缺失');
    }

    console.log('\n🔍 品牌信息缺失详情:');
    const allMissingBrand = results.flatMap(r => r.brandCheck.missing.map(m => ({ file: r.brandCheck.filePath, info: m })));
    if (allMissingBrand.length > 0) {
        const brandCounts = {};
        for (const item of allMissingBrand) {
            brandCounts[item.info] = (brandCounts[item.info] || 0) + 1;
        }

        for (const [info, count] of Object.entries(brandCounts)) {
            console.log(`   ${info.substring(0, 20)}: ${count} 个文档`);
        }
    } else {
        console.log('   ✅ 无缺失');
    }

    console.log('\n🔍 命名不规范详情:');
    const invalidNaming = results.filter(r => !r.namingCheck.isValid);
    if (invalidNaming.length > 0) {
        console.log(`   发现 ${invalidNaming.length} 个命名不规范的文档:`);
        for (const item of invalidNaming.slice(0, 10)) {
            console.log(`   - ${item.namingCheck.fileName} (目录: ${item.namingCheck.dirName})`);
        }
        if (invalidNaming.length > 10) {
            console.log(`   ... 还有 ${invalidNaming.length - 10} 个`);
        }
    } else {
        console.log('   ✅ 全部符合规范');
    }

    const overallScore = (
        (headerComplete / totalDocs) * 0.4 +
        (brandComplete / totalDocs) * 0.3 +
        (namingValid / totalDocs) * 0.3
    ) * 100;

    console.log('\n📈 综合评分:');
    console.log(`   ${overallScore.toFixed(1)} / 100`);

    if (overallScore >= 90) {
        console.log('   🏆 优秀 - 符合 YYC³ 标准');
    } else if (overallScore >= 80) {
        console.log('   👍 良好 - 基本符合 YYC³ 标准');
    } else if (overallScore >= 70) {
        console.log('   ⚠️  一般 - 需要改进');
    } else {
        console.log('   ❌ 不合格 - 需要大幅改进');
    }

    console.log('\n========================================\n');

    return {
        totalDocs,
        headerComplete,
        brandComplete,
        namingValid,
        overallScore,
    };
}

// ============================================================
// 主函数
// ============================================================

function main() {
    console.log('🔍 YYC³ 文档标准检查工具');
    console.log('========================================\n');

    if (!fs.existsSync(DOCS_DIR)) {
        console.error(`❌ 文档目录不存在: ${DOCS_DIR}`);
        process.exit(1);
    }

    console.log(`📁 扫描目录: ${DOCS_DIR}`);
    console.log(`📋 检查项目: 标头完整性、品牌信息、命名规范\n`);

    const docFiles = scanDirectory(DOCS_DIR);

    if (docFiles.length === 0) {
        console.log('⚠️  未找到任何文档文件');
        process.exit(0);
    }

    const results = docFiles.map(filePath => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const header = extractHeader(content);

        return {
            filePath,
            headerCheck: header ? checkHeaderCompleteness(header, filePath) : { filePath, missing: REQUIRED_HEADER_FIELDS, empty: [], isComplete: false },
            brandCheck: checkBrandInfo(content, filePath),
            namingCheck: validateNaming(filePath),
        };
    });

    const report = generateReport(results);

    // 保存详细报告
    const reportPath = path.join(__dirname, '../.archive/reports/doc-standard-check-report.json');
    const reportData = {
        timestamp: new Date().toISOString(),
        summary: report,
        details: results,
    };

    if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 详细报告已保存: ${reportPath}`);
}

// ============================================================
// 执行
// ============================================================

main();