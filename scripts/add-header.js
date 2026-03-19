/**
 * @file: add-header.js
 * @description: 代码标头自动化脚本 · 批量为代码文件添加或更新标头
 * @author: YanYuCloudCube Team
 * @version: v1.0.0
 * @created: 2026-03-05
 * @updated: 2026-03-05
 * @status: active
 * @tags: [script],[automation],[header]
 *
 * @brief: 代码标头自动化工具
 *
 * @details:
 * - 批量为代码文件添加标头
 * - 根据文件类型自动生成标头模板
 * - 支持交互式输入（文件描述、标签等）
 * - 支持批量处理目录
 * - 支持更新现有标头
 *
 * @dependencies: Node.js fs, path, readline
 * @exports: addHeader, addHeaderToDirectory, main
 * @notes: 在 package.json 中添加脚本命令："add-header": "node scripts/add-header.js"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 作者名称
const AUTHOR_NAME = 'YanYuCloudCube Team';

// 今天的日期
const TODAY = new Date().toISOString().split('T')[0];

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.css', '.scss'];

// 文件类型标签映射
const FILE_TYPE_TAGS = {
  '.ts': '[type]',
  '.tsx': '[component]',
  '.js': '[script]',
  '.jsx': '[component]',
  '.css': '[style]',
  '.scss': '[style]',
};

/**
 * 创建交互式输入接口
 * @returns {Object} readline 接口
 */
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * 询问用户输入
 * @param {string} question - 问题
 * @returns {Promise<string>} 用户输入
 */
function ask(question) {
  const rl = createInterface();
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * 生成标头模板
 * @param {string} filePath - 文件路径
 * @param {Object} options - 选项
 * @returns {string} 标头内容
 */
function generateHeader(filePath, options = {}) {
  const {
    description = '',
    tags = '',
    brief = '',
    details = '',
    dependencies = '',
    exports = '',
    notes = ''
  } = options;

  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  const defaultTags = tags || FILE_TYPE_TAGS[ext] || '[tag1],[tag2],[tag3]';

  let header = `/**\n`;
  header += ` * @file: ${fileName}\n`;
  header += ` * @description: ${description || `${fileName} description`}\n`;
  header += ` * @author: ${AUTHOR_NAME}\n`;
  header += ` * @version: v1.0.0\n`;
  header += ` * @created: ${TODAY}\n`;
  header += ` * @updated: ${TODAY}\n`;
  header += ` * @status: active\n`;
  header += ` * @tags: ${defaultTags}\n`;

  if (brief || details || dependencies || exports || notes) {
    header += ` *\n`;
  }

  if (brief) {
    header += ` * @brief: ${brief}\n`;
  }

  if (details) {
    header += ` *\n`;
    header += ` * @details:\n`;
    details.split('\n').forEach(line => {
      header += ` * ${line}\n`;
    });
  }

  if (dependencies) {
    header += ` *\n`;
    header += ` * @dependencies: ${dependencies}\n`;
  }

  if (exports) {
    header += ` * @exports: ${exports}\n`;
  }

  if (notes) {
    header += ` * @notes: ${notes}\n`;
  }

  header += ` */\n\n`;

  return header;
}

/**
 * 为文件添加标头
 * @param {string} filePath - 文件路径
 * @param {Object} options - 选项
 * @returns {boolean} 是否成功
 */
function addHeader(filePath, options = {}) {
  const ext = path.extname(filePath);

  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    console.log(`⚠️  跳过不支持的文件类型: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 检查是否已有标头
  if (lines[0].includes('/**')) {
    console.log(`⚠️  文件已有标头，跳过: ${filePath}`);
    return false;
  }

  // 生成标头
  const header = generateHeader(filePath, options);

  // 写入文件
  fs.writeFileSync(filePath, header + content);
  console.log(`✅ 已添加标头: ${filePath}`);
  return true;
}

/**
 * 为目录添加标头
 * @param {string} dir - 目录路径
 * @param {Object} options - 选项
 * @returns {Object} 处理结果
 */
function addHeaderToDirectory(dir, options = {}) {
  const { interactive = false, recursive = true } = options;
  const files = getAllFiles(dir, recursive);
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  files.forEach(file => {
    try {
      const success = addHeader(file, options);
      if (success) {
        successCount++;
      } else {
        skipCount++;
      }
    } catch (error) {
      console.error(`❌ 处理文件失败: ${file}`, error.message);
      errorCount++;
    }
  });

  return {
    total: files.length,
    success: successCount,
    skip: skipCount,
    error: errorCount
  };
}

/**
 * 递归获取目录下所有文件
 * @param {string} dir - 目录路径
 * @param {boolean} recursive - 是否递归
 * @returns {Array} 文件列表
 */
function getAllFiles(dir, recursive = true) {
  const files = [];
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      if (recursive) {
        // 跳过 node_modules 和 .git 目录
        if (item === 'node_modules' || item === '.git' || item === 'dist') {
          return;
        }
        files.push(...getAllFiles(itemPath, recursive));
      }
    } else {
      files.push(itemPath);
    }
  });

  return files;
}

/**
 * 交互式添加标头
 * @param {string} filePath - 文件路径
 */
async function interactiveAddHeader(filePath) {
  console.log(`\n📝 为文件添加标头: ${filePath}\n`);

  const description = await ask('📄 文件描述（一句话概括）: ');
  const brief = await ask('📝 简要说明（可选，按 Enter 跳过）: ');
  const tags = await ask('🏷️  标签（可选，格式: [tag1],[tag2]，按 Enter 跳过）: ');
  const dependencies = await ask('📦 依赖（可选，按 Enter 跳过）: ');
  const exports = await ask('📤 导出（可选，按 Enter 跳过）: ');
  const notes = await ask('⚠️  注意事项（可选，按 Enter 跳过）: ');

  const details = await ask('📋 详细说明（可选，按 Enter 跳过）: ');

  const options = {
    description,
    brief: brief || undefined,
    tags: tags || undefined,
    dependencies: dependencies || undefined,
    exports: exports || undefined,
    notes: notes || undefined,
    details: details || undefined
  };

  addHeader(filePath, options);
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive') || args.includes('-i');
  const recursive = !args.includes('--no-recursive');
  const targetPath = args.find(arg => !arg.startsWith('--')) || './src';

  console.log('🔧 YYC³ 代码标头自动化工具\n');

  if (interactive) {
    // 交互式模式
    if (fs.statSync(targetPath).isDirectory()) {
      console.log('❌ 交互式模式仅支持单个文件');
      process.exit(1);
    }
    await interactiveAddHeader(targetPath);
  } else {
    // 批量模式
    const result = addHeaderToDirectory(targetPath, { interactive, recursive });

    console.log(`\n📊 处理结果:`);
    console.log(`   总文件数: ${result.total}`);
    console.log(`   ✅ 成功: ${result.success}`);
    console.log(`   ⏭️  跳过: ${result.skip}`);
    console.log(`   ❌ 失败: ${result.error}`);
  }
}

// 如果直接运行此脚本，执行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 发生错误:', error.message);
    process.exit(1);
  });
}

// 导出函数供其他模块使用
module.exports = {
  addHeader,
  addHeaderToDirectory,
  generateHeader,
  getAllFiles
};
