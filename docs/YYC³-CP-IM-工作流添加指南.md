---
@file: YYC³-CP-IM-工作流添加指南.md
@description: YYC³ CloudPivot Intelli-Matrix · GitHub Actions 工作流添加指南
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: published
@tags: [github-actions, workflow, troubleshooting]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix · GitHub Actions 工作流添加指南

## 📋 问题说明

由于 OAuth 权限限制，无法通过命令行推送 GitHub Actions 工作流文件。错误信息：

```
! [remote rejected] main -> main (refusing to allow an OAuth App to create or update workflow `.github/workflows/ci-cd.yml` without `workflow` scope)
```

## ✅ 解决方案

### 方法 1：通过 GitHub Web UI 添加（推荐）

这是最简单的方法，不需要配置任何权限。

#### 步骤 1：访问仓库

1. 打开浏览器，访问: https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix
2. 确保已登录 GitHub 账户

#### 步骤 2：创建工作流文件

1. 点击 "Add file" 按钮
2. 选择 "Create new file"
3. 在文件名输入框中输入: `.github/workflows/ci-cd.yml`
4. 复制以下 YAML 配置到编辑器中：

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

#### 步骤 3：提交文件

1. 在页面底部的 "Commit changes" 部分：
   - **Commit message**: `feat: 添加 CI/CD 工作流`
   - **Extended description**: `添加 GitHub Actions 工作流配置，支持自动化测试、构建和部署`
2. 点击绿色 "Commit changes" 按钮

#### 步骤 4：配置 GitHub Pages

1. 点击仓库页面的 "Settings" 标签
2. 在左侧菜单中找到并点击 "Pages"
3. 在 "Build and deployment" 部分：
   - **Source**: 选择 "GitHub Actions"
4. 点击 "Save" 保存设置

#### 步骤 5：启用 Actions 权限

1. Settings -> Actions -> General
2. 在 "Workflow permissions" 部分：
   - 选择 "Read and write permissions"
   - 勾选 "Allow GitHub Actions to create and approve pull requests"
3. 点击 "Save" 保存

---

### 方法 2：使用 SSH 推送（需要 SSH 密钥配置）

如果您已配置 SSH 密钥，可以使用 SSH URL 推送：

```bash
# 修改远程仓库 URL 为 SSH
git remote set-url origin git@github.com:YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git

# 推送代码
git push origin main
```

---

### 方法 3：使用 Personal Access Token（PAT）

#### 步骤 1：创建 Personal Access Token

1. 访问: https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 设置：
   - **Note**: `YYC3-Project-Workflow`
   - **Expiration**: 选择过期时间（建议 90 days）
   - **Scopes**: 勾选 `workflow` 权限
4. 点击 "Generate token"
5. **重要**: 复制生成的 token（只显示一次）

#### 步骤 2：使用 Token 推送

```bash
# 使用 token 推送
git push https://YOUR_TOKEN@github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git main

# 或者更新远程 URL
git remote set-url origin https://YOUR_TOKEN@github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix.git
git push origin main
```

---

## 🚀 验证部署

### 查看工作流状态

1. 访问仓库的 "Actions" 标签
2. 应该能看到 "CI/CD Pipeline" 工作流正在运行
3. 点击运行中的工作流查看详细日志

### 部署完成后

访问: https://yyc-cube.github.io/YYC3-CloudPivot-Intelli-Matrix/

应该能看到您的应用已部署成功！

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
1. Settings -> Actions -> General -> Workflow permissions
2. 选择 "Read and write permissions"
3. 勾选 "Allow GitHub Actions to create and approve pull requests"

### 问题 3：页面 404

**原因**: GitHub Pages 未启用或配置错误

**解决**:
1. Settings -> Pages
2. 确保 Source 设置为 "GitHub Actions"
3. 等待首次部署完成（3-5 分钟）

---

## 📊 工作流说明

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

### 预计时间

| 步骤 | 时间 |
|------|------|
| 依赖安装 | 30s |
| ESLint 检查 | 15s |
| 类型检查 | 20s |
| 测试运行 | 60s |
| 构建 | 30s |
| 部署 | 60s |
| **总计** | **3-5 分钟** |

---

## 📞 支持

如有问题，请：
1. 查看本文档的故障排除部分
2. 访问 GitHub Actions 日志
3. 提交 Issue: https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues
4. 联系团队: admin@0379.email

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
