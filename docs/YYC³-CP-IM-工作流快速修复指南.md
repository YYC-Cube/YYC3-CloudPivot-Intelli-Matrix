---
@file: YYC³-CP-IM-工作流快速修复指南.md
@description: YYC³ CloudPivot Intelli-Matrix · GitHub Actions 工作流快速修复指南
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: published
@tags: [github-actions, workflow, fix]
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ CloudPivot Intelli-Matrix · GitHub Actions 工作流快速修复指南

## 📋 问题说明

GitHub Actions 工作流遇到错误：

```
Error: Unable to locate executable file: pnpm
```

## 🔧 快速修复方法

### 方法：编辑 GitHub 上的工作流文件

#### 步骤 1：访问工作流文件

1. 访问：https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/blob/main/.github/workflows/ci-cd.yml
2. 点击铅笔图标 ✏️ 编辑文件

#### 步骤 2：修复 pnpm 安装顺序

**问题**：当前配置中，`Setup Node.js` 步骤在 `Install pnpm` 之前执行

**修复**：将两个步骤的顺序交换

**找到这两个部分（在 `test` job 中）**：

```yaml
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
        
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
```

**替换为**：

```yaml
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 9
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'pnpm'
```

**在 `deploy-github-pages` job 中也需要同样的修改**！

#### 步骤 3：提交更改

1. 在页面底部填写提交信息：
   - **Commit message**: `fix: 修复工作流 pnpm 安装顺序`
   - **Extended description**: `将 Install pnpm 步骤移到 Setup Node.js 之前，修复 pnpm 找不到的问题`
2. 点击绿色 "Commit changes" 按钮

---

## ✅ 验证修复

1. 访问仓库的 "Actions" 标签
2. 应该能看到新的工作流运行正在执行
3. 点击运行中的工作流查看日志
4. 确认不再出现 "Unable to locate executable file: pnpm" 错误

---

## 📊 预期结果

修复后，工作流应该能成功执行：

| 步骤 | 状态 | 说明 |
|------|------|------|
| Install pnpm | ✅ 成功 | pnpm 被正确安装 |
| Setup Node.js | ✅ 成功 | Node.js 环境配置完成 |
| Install dependencies | ✅ 成功 | 依赖安装成功 |
| Run ESLint | ✅ 成功 | 代码检查通过 |
| Type check | ✅ 成功 | 类型检查通过 |
| Run tests | ✅ 成功 | 903 个测试全部通过 |
| Build | ✅ 成功 | 构建成功 |
| Deploy to Pages | ✅ 成功 | 部署到 GitHub Pages |

---

## 🐛 如果仍然失败

### 检查点

1. **确认步骤顺序正确**
   - `Install pnpm` 必须在 `Setup Node.js` **之前**
   - 两个 job 都需要修改

2. **检查 YAML 缩进**
   - 使用空格缩进，不要使用 Tab
   - 每个缩进层级使用 2 个空格

3. **查看详细日志**
   - 点击失败的步骤
   - 查看完整的错误信息

### 获取帮助

如有问题，请：
1. 查看工作流日志
2. 提交 Issue: https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix/issues
3. 联系团队: admin@0379.email

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
