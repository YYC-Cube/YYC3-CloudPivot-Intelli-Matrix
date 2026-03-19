/**
 * @file: check-headers.js
 * @description: 代码标头规范检查工具 · 自动检查所有代码文件的标头是否符合 YYC³ 规范
 * @author: YanYuCloudCube Team
 * @version: v1.0.0
 * @created: 2026-03-05
 * @updated: 2026-03-05
 * @status: active
 * @tags: [script],[tool],[lint]
 *
 * @brief: 代码标头规范检查工具
 *
 * @details:
 * - 自动检查所有 TypeScript/JavaScript/CSS 文件的标头
 * - 验证必填字段是否存在
 * - 验证字段格式是否正确
 * - 生成检查报告
 * - 支持命令行参数（--fix 自动修复）
 *
 * @dependencies: Node.js fs, path
 * @exports: checkFile, checkDirectory, main
 * @notes: 在 package.json 中添加脚本命令："check-headers": "node scripts/check-headers.js"
 */

const fs = require('fs');
const path = require('path');

// 必填字段
const REQUIRED_FIELDS = ['@file', '@description', '@author', '@version', '@created', '@updated', '@status', '@tags'];

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

// 作者名称
const AUTHOR_NAME = 'YanYuCloudCube Team';

// 状态值
const STATUS_VALUES = ['active', 'deprecated', 'experimental', 'stable', 'draft'];

/**
 * 检查单个文件的标头
 * @param {string} filePath - 文件路径
 * @returns {Object} 检查结果
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 检查是否有标头
  if (!lines[0].includes('/**')) {
    return {
      valid: false,
      error: 'Missing header',
      file: filePath
    };
  }

  // 检查必填字段
  const missingFields = REQUIRED_FIELDS.filter(field => !content.includes(field));
  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing fields: ${missingFields.join(', ')}`,
      file: filePath
    };
  }

  // 检查作者名称
  if (!content.includes(`@author: ${AUTHOR_NAME}`)) {
    return {
      valid: false,
      error: `Author should be "${AUTHOR_NAME}"`,
      file: filePath
    };
  }

  // 检查版本号格式
  const versionMatch = content.match(/@version:\s*(v\d+\.\d+\.\d+)/);
  if (!versionMatch) {
    return {
      valid: false,
      error: 'Version should follow semantic versioning (e.g., v1.0.0)',
      file: filePath
    };
  }

  // 检查日期格式
  const dateMatches = content.match(/@(created|updated):\s*(\d{4}-\d{2}-\d{2})/g);
  if (!dateMatches || dateMatches.length < 2) {
    return {
      valid: false,
      error: 'Dates should follow YYYY-MM-DD format',
      file: filePath
    };
  }

  // 检查状态值
  const statusMatch = content.match(/@status:\s*(\w+)/);
  if (!statusMatch || !STATUS_VALUES.includes(statusMatch[1])) {
    return {
      valid: false,
      error: `Status should be one of: ${STATUS_VALUES.join(', ')}`,
      file: filePath
    };
  }

  // 检查标签格式
  const tagsMatch = content.match(/@tags:\s*\[([^\]]+)\]/);
  if (!tagsMatch) {
    return {
      valid: false,
      error: 'Tags should be in format: [tag1],[tag2],[tag3]',
      file: filePath
    };
  }

  return {
    valid: true,
    file: filePath
  };
}

/**
 * 修复单个文件的标头
 * @param {string} filePath - 文件路径
 * @returns {boolean} 是否修复成功
 */
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 如果没有标头，添加标头
  if (!lines[0].includes('/**')) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    const today = new Date().toISOString().split('T')[0];

    let header = `/**\n`;
    header += ` * @file: ${fileName}\n`;
    header += ` * @description: ${fileName} description\n`;
    header += ` * @author: ${AUTHOR_NAME}\n`;
    header += ` * @version: v1.0.0\n`;
    header += ` * @created: ${today}\n`;
    header += ` * @updated: ${today}\n`;
    header += ` * @status: active\n`;
    header += ` * @tags: [tag1],[tag2],[tag3]\n`;
    header += ` */\n\n`;

    fs.writeFileSync(filePath, header + content);
    return true;
  }

  return false;
}

/**
 * 递归检查目录
 * @param {string} dir - 目录路径
 * @param {Object} options - 选项
 * @returns {Object} 检查结果
 */
function checkDirectory(dir, options = {}) {
  const { fix = false, verbose = false } = options;
  const files = getAllFiles(dir);
  let validCount = 0;
  let invalidCount = 0;
  const invalidFiles = [];
  const fixedFiles = [];

  files.forEach(file => {
    const ext = path.extname(file);
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return;
    }

    if (fix) {
      const fixed = fixFile(file);
      if (fixed) {
        fixedFiles.push(file);
        validCount++;
      } else {
        const result = checkFile(file);
        if (result.valid) {
          validCount++;
        } else {
          invalidCount++;
          invalidFiles.push(result);
        }
      }
    } else {
      const result = checkFile(file);
      if (result.valid) {
        validCount++;
      } else {
        invalidCount++;
        invalidFiles.push(result);
      }
    }
  });

  const result = {
    total: validCount + invalidCount,
    valid: validCount,
    invalid: invalidCount,
    invalidFiles,
    fixedFiles
  };

  if (verbose) {
    console.log(`\n📊 检查结果:`);
    console.log(`   总文件数: ${result.total}`);
    console.log(`   ✅ 有效: ${result.valid}`);
    console.log(`   ❌ 无效: ${result.invalid}`);

    if (result.fixedFiles.length > 0) {
      console.log(`\n🔧 已修复文件 (${result.fixedFiles.length}):`);
      result.fixedFiles.forEach(file => {
        console.log(`   - ${file}`);
      });
    }

    if (result.invalidFiles.length > 0) {
      console.log(`\n❌ 无效文件 (${result.invalidFiles.length}):`);
      result.invalidFiles.forEach(({ file, error }) => {
        console.log(`   - ${file}`);
        console.log(`     ${error}`);
      });
    }
  }

  return result;
}

/**
 * 递归获取目录下所有文件
 * @param {string} dir - 目录路径
 * @returns {Array} 文件列表
 */
function getAllFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (item === 'node_modules' || item === '.git' || item === 'dist') {
        return;
      }
      files.push(...getAllFiles(itemPath));
    } else {
      files.push(itemPath);
    }
  });

  return files;
}

/**
 * 主函数
 */
function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const verbose = !args.includes('--quiet');
  const dir = args.find(arg => !arg.startsWith('--')) || './src';

  console.log('🔍 YYC³ 代码标头规范检查工具\n');

  const result = checkDirectory(dir, { fix, verbose });

  if (result.invalid > 0) {
    console.log(`\n❌ 检查失败: ${result.invalid} 个文件不符合规范`);
    console.log(`   运行 'node scripts/check-headers.js --fix' 自动修复`);
    process.exit(1);
  } else {
    console.log(`\n✅ 检查通过: 所有 ${result.valid} 个文件符合规范`);
    process.exit(0);
  }
}

// 如果直接运行此脚本，执行主函数
if (require.main === module) {
  main();
}

// 导出函数供其他模块使用
module.exports = {
  checkFile,
  fixFile,
  checkDirectory,
  getAllFiles
};
