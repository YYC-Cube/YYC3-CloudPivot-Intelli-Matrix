---
@file: YYC³-CP-IM-CICD部署指南.md
@description: YYC³ CloudPivot Intelli-Matrix · CI/CD 部署完整指南
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: published
@tags: [cicd, github-actions, deployment, automation]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix · CI/CD 部署指南

## 📋 概述

本文档提供 YYC³ CloudPivot Intelli-Matrix 项目的 CI/CD 自动化部署完整指南，包括 GitHub Actions 配置、GitHub Pages 自动部署等内容。

---

## 🚀 快速开始

### 项目仓库

- **GitHub 仓库**: https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix
- **状态**: ✅ 代码已推送
- **测试通过率**: 100% (903/903)
- **构建状态**: ✅ 成功

---

## 📝 步骤 1：通过 GitHub Web UI 添加 CI/CD 工作流

由于 OAuth 权限限制，需要通过 GitHub Web UI 手动添加工作流文件。

### 操作步骤

1. **访问仓库**
   - 打开浏览器，访问: https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix

2. **创建工作流目录**
   - 点击仓库根目录的 `.github` 文件夹
   - 如果不存在，点击 "Add file" -> "Create new file"
   - 输入路径: `.github/workflows/ci-cd.yml`

3. **添加工作流配置**
   - 复制以下 YAML 配置到文件中：

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    name: Test & Build
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Run ESLint
      run: pnpm lint
      
    - name: Type check
      run: pnpm type-check
      
    - name: Run tests
      run: pnpm test
      
    - name: Build
      run: pnpm build
      
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: dist
        path: dist/
        retention-days: 7

  deploy-github-pages:
    name: Deploy to GitHub Pages
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    permissions:
      contents: read
      pages: write
      id-token: write
      
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
      
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
        
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
      
    - name: Build for GitHub Pages
      run: pnpm build
      env:
        VITE_BASE_PATH: /YYC3-CloudPivot-Intelli-Matrix/
        
    - name: Setup Pages
      uses: actions/configure-pages@v5
      
    - name: Upload artifact
      uses: actions/upload-pages-artifact@v3
      with:
        path: dist/
        
    - name: Deploy to GitHub Pages
      id: deployment
      uses: actions/deploy-pages@v4
```

4. **提交更改**
   - 在页面底部填写提交信息:
     - "Add CI/CD pipeline with GitHub Pages deployment"
   - 点击 "Commit changes"

---

## 📝 步骤 2：配置 GitHub Pages

### 操作步骤

1. **访问仓库设置**
   - 在仓库页面点击 "Settings" 标签
   - 在左侧菜单中找到 "Pages"

2. **配置 Pages 设置**
   - **Build and deployment**:
     - Source: 选择 "GitHub Actions"
   - **保存设置**

3. **等待首次部署**
   - 提交工作流文件后，GitHub Actions 会自动触发
   - 访问 "Actions" 标签查看部署状态
   - 首次部署可能需要 3-5 分钟

4. **访问部署站点**
   - 部署完成后，访问: https://yyc-cube.github.io/YYC3-CloudPivot-Intelli-Matrix/

---

## 📝 步骤 3：配置仓库设置

### 仓库可见性

确保仓库设置为 **Public**：
- Settings -> General -> Danger Zone -> Change visibility -> Public

### 仓库描述和主题

- **Description**: 现代化的智能监控与运维平台，基于 React 18 + TypeScript
- **Website**: https://yyc-cube.github.io/YYC3-CloudPivot-Intelli-Matrix/
- **Topics**: `react`, `typescript`, `vite`, `monitoring`, `dashboard`, `ai`, `pwa`

### 开源许可证

确保 **MIT License** 已设置：
- Settings -> General -> License -> MIT License

---

## 🔍 CI/CD 流水线说明

### 触发条件

| 事件 | 分支 | 说明 |
|------|------|------|
| push | main, develop | 自动触发测试和构建 |
| pull_request | main, develop | 自动触发测试 |

### 工作流程

```
1. 代码推送
   ↓
2. 运行测试
   - ESLint 代码检查
   - TypeScript 类型检查
   - Vitest 单元测试
   - Vite 构建测试
   ↓
3. 构建产物
   - 生成 dist/ 目录
   - 上传构建产物
   ↓
4. 部署（仅 main 分支）
   - 构建生产版本
   - 部署到 GitHub Pages
```

### 工作流任务

| 任务 | 说明 | 时间 |
|------|------|------|
| Checkout | 检出代码 | 5s |
| Setup Node.js | 配置 Node.js 环境 | 10s |
| Install dependencies | 安装依赖 | 30s |
| Run ESLint | 代码检查 | 15s |
| Type check | 类型检查 | 20s |
| Run tests | 运行测试 | 60s |
| Build | 构建项目 | 30s |
| Deploy | 部署到 Pages | 60s |

**总时间**: 约 3-5 分钟

---

## 🐛 故障排除

### 问题 1：工作流未触发

**原因**: 工作流文件路径或名称错误

**解决**:
- 确保文件位于 `.github/workflows/` 目录
- 文件扩展名为 `.yml` 或 `.yaml`
- 检查 YAML 语法是否正确

### 问题 2：部署失败

**原因**: GitHub Pages 权限未配置

**解决**:
- Settings -> Actions -> General -> Workflow permissions
- 选择 "Read and write permissions"
- 勾选 "Allow GitHub Actions to create and approve pull requests"

### 问题 3：页面 404

**原因**: Vite base path 配置错误

**解决**:
- 检查 `vite.config.ts` 中的 `base` 配置
- 确保设置为 `/YYC3-CloudPivot-Intelli-Matrix/`
- 重新构建和部署

### 问题 4：路由不工作

**原因**: 单页应用路由需要配置

**解决**:
- GitHub Pages 已配置为 SPA
- 如果仍有问题，添加 `404.html` 重定向

---

## 📊 监控和维护

### 查看部署状态

访问仓库的 "Actions" 标签查看所有工作流运行状态：
- ✅ 绿色勾: 成功
- ❌ 红色叉: 失败
- 🟡 黄色圈: 进行中

### 查看部署日志

1. 点击具体的工作流运行
2. 点击失败的步骤查看详细日志
3. 查找错误信息并修复

### 更新部署

每次推送到 `main` 分支会自动触发部署：
```bash
git add .
git commit -m "feat: 新功能"
git push origin main
```

---

## 🎯 最佳实践

### 1. 分支策略

| 分支 | 用途 | 部署 |
|------|------|------|
| main | 生产环境 | ✅ 自动部署 |
| develop | 开发环境 | ❌ 仅测试 |
| feature/* | 功能开发 | ❌ 仅测试 |

### 2. 提交规范

遵循 Conventional Commits 规范：
- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建/工具

### 3. 版本管理

使用语义化版本 (Semantic Versioning)：
- `MAJOR.MINOR.PATCH`
- 例如: `0.1.0`, `0.2.0`, `1.0.0`

---

## 📚 相关文档

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [项目 README](../README.md)
- [贡献指南](../CONTRIBUTING.md)

---

## 📞 支持

如有问题，请：
1. 查看本文档的故障排除部分
2. 搜索 GitHub Issues
3. 提交新的 Issue
4. 联系团队: admin@0379.email

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
