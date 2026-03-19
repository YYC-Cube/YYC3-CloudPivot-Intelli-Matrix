#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class DocumentSyncSystem {
  constructor(config = {}) {
    this.config = {
      watchPaths: ['docs/**/*.md'],
      excludePaths: ['node_modules/**', 'dist/**', '.git/**'],
      autoUpdateReadme: true,
      generateIndex: true,
      validateLinks: true,
      output: {
        indexPath: 'docs/00-YYC3-CP-IM-项目总览-目录索引/002-CP-IM-项目总览索引-文档架构导航.md',
        logPath: 'docs/.sync-log.json'
      },
      ...config
    };

    this.documentTree = new Map();
    this.mappingCache = new Map();
    this.changeLog = [];
  }

  async initialize() {
    console.log('🚀 初始化文档自动同步系统...');

    await this.scanDocuments();
    await this.generateMappings();
    await this.updateIndices();
    await this.validateDocuments();

    console.log('✅ 文档同步系统初始化完成');
  }

  async scanDocuments() {
    console.log('📂 扫描文档目录...');

    const docsPath = path.join(process.cwd(), 'docs');
    await this.scanDirectory(docsPath, docsPath);

    console.log(`📄 扫描完成，发现 ${this.documentTree.size} 个文档`);
  }

  async scanDirectory(dir, baseDir) {
    try {
      const entries = await readdir(dir);

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stats = await stat(fullPath);

        if (stats.isDirectory()) {
          await this.scanDirectory(fullPath, baseDir);
        } else if (entry.endsWith('.md')) {
          await this.processDocument(fullPath, baseDir);
        }
      }
    } catch (error) {
      console.error(`❌ 扫描目录失败: ${dir}`, error.message);
    }
  }

  async processDocument(filePath, baseDir) {
    const relativePath = path.relative(baseDir, filePath);
    const docInfo = {
      path: relativePath,
      fullPath: filePath,
      name: path.basename(filePath, '.md'),
      dir: path.dirname(relativePath),
      type: this.detectDocumentType(relativePath),
      stats: await stat(filePath),
      content: await this.extractMetadata(filePath)
    };

    this.documentTree.set(relativePath, docInfo);
    this.logChange('scan', relativePath);
  }

  detectDocumentType(filePath) {
    if (filePath.includes('README.md')) return 'index';
    if (filePath.includes('CP-IM-RES-DOC')) return 'resource';
    if (filePath.includes('项目规划')) return 'planning';
    if (filePath.includes('项目设计')) return 'design';
    if (filePath.includes('项目开发')) return 'development';
    if (filePath.includes('项目测试')) return 'testing';
    if (filePath.includes('项目部署')) return 'deployment';
    if (filePath.includes('项目运营')) return 'operations';
    if (filePath.includes('项目合规')) return 'compliance';
    if (filePath.includes('项目整合')) return 'integration';
    if (filePath.includes('项目资产')) return 'assets';
    if (filePath.includes('项目模版')) return 'templates';
    if (filePath.includes('用户指南')) return 'user-guide';
    if (filePath.includes('智能演进')) return 'evolution';
    return 'general';
  }

  async extractMetadata(filePath) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const metadata = {
        title: '',
        description: '',
        author: '',
        version: '',
        tags: [],
        lastModified: new Date()
      };

      const lines = content.split('\n');
      for (const line of lines) {
        if (line.startsWith('# ')) {
          metadata.title = line.substring(2).trim();
          break;
        }
        const titleMatch = line.match(/^#+\s+(.+)$/);
        if (titleMatch) {
          metadata.title = titleMatch[1].trim();
        }
        const tagMatch = line.match(/标签[:：]\s*(.+)$/);
        if (tagMatch) {
          metadata.tags = tagMatch[1].split(',').map(t => t.trim());
        }
      }

      return metadata;
    } catch (error) {
      console.error(`❌ 提取元数据失败: ${filePath}`, error.message);
      return {};
    }
  }

  async generateMappings() {
    console.log('🔗 生成文档映射...');

    this.mappingCache.clear();

    for (const [docPath, docInfo] of this.documentTree) {
      const mappings = this.createDocumentMappings(docPath, docInfo);
      for (const mapping of mappings) {
        this.mappingCache.set(mapping.key, mapping);
      }
    }

    console.log(`📊 生成 ${this.mappingCache.size} 个映射关系`);
  }

  createDocumentMappings(docPath, docInfo) {
    const mappings = [];
    const dirPath = path.dirname(docPath);
    const readmePath = path.join(dirPath, 'README.md');

    if (docInfo.type === 'index' && docPath.endsWith('README.md')) {
      mappings.push({
        key: `parent:${dirPath}`,
        type: 'parent_child',
        source: docPath,
        target: dirPath,
        description: '目录索引映射'
      });
    }

    const parentDir = path.dirname(dirPath);
    if (parentDir !== dirPath) {
      const parentReadme = path.join(parentDir, 'README.md');
      if (this.documentTree.has(parentReadme)) {
        mappings.push({
          key: `sibling:${docPath}`,
          type: 'sibling',
          source: docPath,
          target: parentReadme,
          description: '同级文档映射'
        });
      }
    }

    return mappings;
  }

  async updateIndices() {
    if (!this.config.autoUpdateReadme) {
      console.log('⏭️ 跳过README更新');
      return;
    }

    console.log('📝 更新索引文档...');

    const directories = this.findDirectories();
    for (const dir of directories) {
      await this.updateDirectoryReadme(dir);
    }

    await this.updateMainIndex();

    console.log('✅ 索引文档更新完成');
  }

  findDirectories() {
    const directories = new Set();

    for (const [docPath] of this.documentTree) {
      const dir = path.dirname(docPath);
      directories.add(dir);
    }

    return Array.from(directories);
  }

  async updateDirectoryReadme(dirPath) {
    const readmePath = path.join(process.cwd(), 'docs', dirPath, 'README.md');
    const docsInDir = this.getDocumentsInDirectory(dirPath);

    if (docsInDir.length === 0) return;

    const readmeContent = this.generateReadmeContent(dirPath, docsInDir);
    await writeFile(readmePath, readmeContent, 'utf-8');

    this.logChange('update', readmePath);
  }

  getDocumentsInDirectory(dirPath) {
    const docs = [];

    for (const [docPath, docInfo] of this.documentTree) {
      const docDir = path.dirname(docPath);
      if (docDir === dirPath && !docPath.endsWith('README.md')) {
        docs.push(docInfo);
      }
    }

    return docs.sort((a, b) => a.name.localeCompare(b.name));
  }

  generateReadmeContent(dirPath, docs) {
    const dirName = path.basename(dirPath);
    const title = this.formatDirectoryName(dirName);

    let content = `# ${title}\n\n`;
    content += `## 文档索引\n\n`;
    content += `本目录包含以下文档：\n\n`;

    if (docs.length > 0) {
      content += `### 文档列表\n\n`;
      content += `| 序号 | 文档名称 | 类型 | 状态 |\n`;
      content += `|------|----------|------|------|\n`;

      docs.forEach((doc, index) => {
        const status = this.getDocumentStatus(doc);
        const typeLabel = this.getTypeLabel(doc.type);
        content += `| ${index + 1} | [${doc.name}](${doc.path}) | ${typeLabel} | ${status} |\n`;
      });

      content += `\n`;
    }

    const subDirs = this.getSubDirectories(dirPath);
    if (subDirs.length > 0) {
      content += `### 子目录\n\n`;
      subDirs.forEach(subDir => {
        content += `- [${subDir.name}](${subDir.path}/)\n`;
      });
      content += `\n`;
    }

    content += `---\n\n`;
    content += `*最后更新: ${new Date().toLocaleString('zh-CN')}*\n`;
    content += `*文档数量: ${docs.length}*\n`;

    return content;
  }

  formatDirectoryName(dirName) {
    const nameMap = {
      '00-YYC3-CP-IM-项目总览-目录索引': '项目总览',
      '01-YYC3-CP-IM-项目规划-启动阶段': '项目规划 - 启动阶段',
      '02-YYC3-CP-IM-项目规划-设计阶段': '项目规划 - 设计阶段',
      '03-YYC3-CP-IM-项目开发-实施阶段': '项目开发 - 实施阶段',
      '04-YYC3-CP-IM-项目测试-审核阶段': '项目测试 - 审核阶段',
      '05-YYC3-CP-IM-项目部署-文档闭环': '项目部署 - 文档闭环',
      '06-YYC3-CP-IM-项目运营-维护阶段': '项目运营 - 维护阶段',
      '07-YYC3-CP-IM-项目合规-安全保障': '项目合规 - 安全保障',
      '08-YYC3-CP-IM-项目整合-实施阶段': '项目整合 - 实施阶段',
      '09-YYC3-CP-IM-项目资产-知识管理': '项目资产 - 知识管理',
      '10-YYC3-CP-IM-项目模版-标准规范': '项目模版 - 标准规范',
      '11-YYC3-CP-IM-智能演进-优化阶段': '智能演进 - 优化阶段',
      '12-YYC3-CP-IM-用户指南-操作手册': '用户指南 - 操作手册'
    };

    return nameMap[dirName] || dirName;
  }

  getDocumentStatus(doc) {
    return '✅ 完成';
  }

  getTypeLabel(type) {
    const labels = {
      'index': '索引',
      'resource': '资源',
      'planning': '规划',
      'design': '设计',
      'development': '开发',
      'testing': '测试',
      'deployment': '部署',
      'operations': '运营',
      'compliance': '合规',
      'integration': '整合',
      'assets': '资产',
      'templates': '模板',
      'user-guide': '指南',
      'evolution': '演进',
      'general': '通用'
    };

    return labels[type] || type;
  }

  getSubDirectories(dirPath) {
    const subDirs = new Set();

    for (const [docPath] of this.documentTree) {
      const docDir = path.dirname(docPath);
      if (docDir.startsWith(dirPath + path.sep) && docDir !== dirPath) {
        const relativeDir = docDir.substring(dirPath.length + 1);
        const firstSegment = relativeDir.split(path.sep)[0];
        if (firstSegment) {
          subDirs.add({
            name: this.formatDirectoryName(firstSegment),
            path: path.join(dirPath, firstSegment)
          });
        }
      }
    }

    return Array.from(subDirs);
  }

  async updateMainIndex() {
    const indexPath = path.join(process.cwd(), this.config.output.indexPath);
    const mainDirs = this.getMainDirectories();

    let content = `# YYC³ CP-IM 文档架构导航\n\n`;
    content += `## 目录结构\n\n`;
    content += `本文档系统采用分层结构，按项目阶段和功能模块组织。\n\n`;

    content += `### 主要目录\n\n`;
    mainDirs.forEach(dir => {
      const docCount = this.getDocumentsInDirectory(dir.path).length;
      content += `- [${dir.name}](${dir.path}/) - ${docCount} 个文档\n`;
    });

    content += `\n## 文档统计\n\n`;
    content += `- 总文档数: ${this.documentTree.size}\n`;
    content += `- 总目录数: ${mainDirs.length}\n`;
    content += `- 映射关系数: ${this.mappingCache.size}\n`;

    content += `\n## 快速导航\n\n`;
    content += `### 按类型\n\n`;
    const typeGroups = this.groupByType();
    for (const [type, docs] of Object.entries(typeGroups)) {
      const typeLabel = this.getTypeLabel(type);
      content += `- **${typeLabel}**: ${docs.length} 个文档\n`;
    }

    content += `\n---\n\n`;
    content += `*最后更新: ${new Date().toLocaleString('zh-CN')}*\n`;
    content += `*自动生成: 文档自动同步系统*\n`;

    await writeFile(indexPath, content, 'utf-8');
    this.logChange('update', indexPath);
  }

  getMainDirectories() {
    const mainDirs = [];
    const docsPath = path.join(process.cwd(), 'docs');

    for (const [docPath] of this.documentTree) {
      const docDir = path.dirname(docPath);
      const relativeDir = path.relative(docsPath, docDir);
      const segments = relativeDir.split(path.sep);

      if (segments.length === 1) {
        const existing = mainDirs.find(d => d.path === docDir);
        if (!existing) {
          mainDirs.push({
            name: this.formatDirectoryName(segments[0]),
            path: docDir
          });
        }
      }
    }

    return mainDirs.sort((a, b) => a.name.localeCompare(b.name));
  }

  groupByType() {
    const groups = {};

    for (const [docPath, docInfo] of this.documentTree) {
      const type = docInfo.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(docInfo);
    }

    return groups;
  }

  async validateDocuments() {
    if (!this.config.validateLinks) {
      console.log('⏭️ 跳过文档验证');
      return;
    }

    console.log('🔍 验证文档...');

    const errors = [];
    const warnings = [];

    for (const [docPath, docInfo] of this.documentTree) {
      const validation = await this.validateDocument(docInfo);
      if (validation.errors.length > 0) {
        errors.push(...validation.errors);
      }
      if (validation.warnings.length > 0) {
        warnings.push(...validation.warnings);
      }
    }

    console.log(`✅ 验证完成: ${errors.length} 错误, ${warnings.length} 警告`);

    if (errors.length > 0) {
      console.error('❌ 发现错误:');
      errors.forEach(err => console.error(`  - ${err}`));
    }

    if (warnings.length > 0) {
      console.warn('⚠️  发现警告:');
      warnings.forEach(warn => console.warn(`  - ${warn}`));
    }
  }

  async validateDocument(docInfo) {
    const errors = [];
    const warnings = [];

    try {
      const content = await readFile(docInfo.fullPath, 'utf-8');

      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const links = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        links.push({
          text: match[1],
          url: match[2]
        });
      }

      for (const link of links) {
        if (link.url.startsWith('../') || link.url.startsWith('./')) {
          const targetPath = path.resolve(path.dirname(docInfo.fullPath), link.url);
          if (!fs.existsSync(targetPath)) {
            errors.push(`文档 ${docInfo.path} 中的链接无效: ${link.url}`);
          }
        }
      }

      if (!content.includes('# ')) {
        warnings.push(`文档 ${docInfo.path} 缺少标题`);
      }

    } catch (error) {
      errors.push(`验证文档 ${docInfo.path} 失败: ${error.message}`);
    }

    return { errors, warnings };
  }

  logChange(eventType, filePath) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      event: eventType,
      path: filePath,
      actions: []
    };

    this.changeLog.push(logEntry);
  }

  async saveLog() {
    const logPath = path.join(process.cwd(), this.config.output.logPath);
    const logContent = JSON.stringify(this.changeLog, null, 2);
    await writeFile(logPath, logContent, 'utf-8');
  }

  getStatistics() {
    return {
      totalDocuments: this.documentTree.size,
      totalMappings: this.mappingCache.size,
      totalChanges: this.changeLog.length,
      documentTypes: this.groupByType(),
      mainDirectories: this.getMainDirectories()
    };
  }
}

async function main() {
  try {
    const syncSystem = new DocumentSyncSystem();
    await syncSystem.initialize();
    await syncSystem.saveLog();

    const stats = syncSystem.getStatistics();
    console.log('\n📊 同步统计:');
    console.log(`  总文档数: ${stats.totalDocuments}`);
    console.log(`  映射关系数: ${stats.totalMappings}`);
    console.log(`  变更记录数: ${stats.totalChanges}`);

    console.log('\n✅ 文档自动同步完成！');

    process.exit(0);
  } catch (error) {
    console.error('❌ 文档同步失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DocumentSyncSystem;
