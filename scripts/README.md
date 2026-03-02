---
@file: scripts/README.md
@description: YYC³ CloudPivot Intelli-Matrix 智能校测脚本系统
@author: YanYuCloudCube Team
@version: 1.0.0
@created: 2026-02-27
@updated: 2026-02-27
@status: Production
@tags: yyc3,detection,testing,pre-deployment
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ 智能校测脚本系统

## 概述

YYC³ 智能校测脚本系统是一个全面的生产部署前检测工具集，旨在确保 YYC³ CloudPivot Intelli-Matrix 项目的多维度质量保证。

### 核心特性

- **多维度检测**：环境可用性、功能完整性、本地存储、大模型 API、Ollama 本地服务
- **智能协同**：自动化检测流程，支持批量执行和报告生成
- **实用高效**：轻量级设计，快速响应，适合 CI/CD 集成
- **灵活配置**：支持自定义检测选项和报告格式
- **详细报告**：生成 Markdown、JSON、HTML 多格式报告

---

## 📋 检测模块

### 1. 环境可用性检测

**文件**：`detect-environment.ts`

**检测项**：
- Node.js 版本检查
- pnpm 包管理器可用性
- 操作系统平台
- 本地存储可用性
- 网络连接状态
- 浏览器 API 支持

**使用方式**：

```typescript
import { detectEnvironment, generateEnvironmentReport } from "./scripts/detect-environment";

// 执行检测
const checks = detectEnvironment();

// 生成报告
const report = generateEnvironmentReport();
console.log(report);
```

---

### 2. 功能完整性检测

**文件**：`detect-functionality.ts`

**检测项**：
- 核心功能模块
- 用户交互功能
- 数据处理功能
- API 集成功能

**使用方式**：

```typescript
import { detectFunctionality, generateFunctionalityReport } from "./scripts/detect-functionality";

// 执行检测
const checks = detectFunctionality();

// 生成报告
const report = generateFunctionalityReport();
console.log(report);
```

---

### 3. 本地存储检测

**文件**：`detect-storage.ts`

**检测项**：
- LocalStorage 可用性
- IndexedDB 可用性
- SessionStorage 可用性
- Cookie 可用性
- 存储容量检测

**使用方式**：

```typescript
import { detectStorage, generateStorageReport } from "./scripts/detect-storage";

// 执行检测
const checks = detectStorage();

// 生成报告
const report = generateStorageReport();
console.log(report);
```

---

### 4. 大模型 API 检测

**文件**：`detect-llm-api.ts`

**检测项**：
- OpenAI API Key 配置
- 自定义 Base URL 配置
- 网络连接测试
- 模型列表获取
- API 响应测试

**使用方式**：

```typescript
import { detectLLMApi, testLLMApiConnection, generateLLMApiReport } from "./scripts/detect-llm-api";

// 基础检测
const checks = detectLLMApi();

// 实际连接测试
const apiKey = "your-api-key";
const customBaseUrl = "https://api.openai.com/v1";
const liveChecks = await testLLMApiConnection(apiKey, customBaseUrl);

// 生成报告
const report = generateLLMApiReport();
console.log(report);
```

---

### 5. Ollama 本地检测

**文件**：`detect-ollama.ts`

**检测项**：
- Ollama URL 配置
- Ollama 服务状态
- 模型列表获取

**使用方式**：

```typescript
import { detectOllama, testOllamaConnection, generateOllamaReport } from "./scripts/detect-ollama";

// 基础检测
const checks = detectOllama();

// 实际连接测试
const liveChecks = await testOllamaConnection("http://localhost:11434");

// 生成报告
const report = generateOllamaReport();
console.log(report);
```

---

## 🚀 快速开始

### 浏览器控制台使用

在浏览器开发者工具的控制台中执行：

```javascript
// 快速检测
await SmartDetect.run();

// 完整检测
await SmartDetect.fullCheck({
  testLLM: true,
  testOllama: true,
  saveReport: true,
  reportFormat: "md"
});

// 下载报告
await SmartDetect.downloadReport("md");

// 查看历史
const history = SmartDetect.getHistory();
console.log(history);

// 清除历史
SmartDetect.clearHistory();
```

### 命令行使用

```bash
# 快速检测
pnpm tsx scripts/smart-detect.ts quick

# 完整检测
pnpm tsx scripts/smart-detect.ts full --test-llm --test-ollama

# 生成报告
pnpm tsx scripts/smart-detect.ts report --format md
```

---

## 📊 报告格式

### Markdown 报告

生成可读性强的 Markdown 格式报告，适合文档归档和团队分享。

```typescript
const result = await SmartDetect.fullCheck({
  saveReport: true,
  reportFormat: "md"
});
```

### JSON 报告

生成结构化的 JSON 格式报告，适合自动化处理和数据分析。

```typescript
const result = await SmartDetect.fullCheck({
  saveReport: true,
  reportFormat: "json"
});
```

### HTML 报告

生成可视化 HTML 格式报告，适合直接在浏览器中查看。

```typescript
const result = await SmartDetect.fullCheck({
  saveReport: true,
  reportFormat: "html"
});
```

---

## 🔧 高级配置

### 自定义检测选项

```typescript
await SmartDetect.fullCheck({
  // 是否测试 LLM API 连接
  testLLM: false,
  
  // 是否测试 Ollama 连接
  testOllama: false,
  
  // 是否保存报告到本地存储
  saveReport: true,
  
  // 报告格式：md | json | html | all
  reportFormat: "all"
});
```

### 自定义报告文件名

```typescript
import { generateDetectionReport } from "./scripts/generate-report";

const result = await generateDetectionReport({
  format: "md",
  filename: "my-custom-report",
  saveToLocalStorage: true
});
```

---

## 📈 检测历史

智能校测系统自动保存检测历史（最近 10 次），方便追踪系统状态变化。

### 查看历史

```javascript
const history = SmartDetect.getHistory();
console.log(history);
```

### 清除历史

```javascript
SmartDetect.clearHistory();
```

---

## 🎯 生产部署前检查清单

在部署到生产环境前，请确保完成以下检查：

- [ ] **环境可用性检测**：通过（无失败项）
- [ ] **功能完整性检测**：通过（无失败项）
- [ ] **本地存储检测**：通过（无失败项）
- [ ] **大模型 API 检测**：通过（如果使用外部 API）
- [ ] **Ollama 本地检测**：通过（如果使用本地 Ollama）
- [ ] **生成完整报告**：保存为 Markdown 和 JSON 格式
- [ ] **审查检测结果**：确认所有警告项
- [ ] **备份检测报告**：归档到项目文档

---

## 📚 API 参考

### SmartDetect

全局智能检测对象，可通过 `SmartDetect` 直接访问。

#### 方法

| 方法 | 描述 | 参数 | 返回值 |
|------|------|------|--------|
| `quickCheck()` | 快速检测 | - | Promise<{success, summary, report, error}> |
| `fullCheck(options)` | 完整检测 | options?: {testLLM?, testOllama?, saveReport?, reportFormat?} | Promise<{success, results, report, filename, error}> |
| `downloadReport(format)` | 下载报告 | format?: "md" \| "json" \| "html" | Promise<{success, filename, error}> |
| `getHistory()` | 获取历史 | - | any[] |
| `clearHistory()` | 清除历史 | - | void |
| `run()` | 运行检测（快捷方式）| - | Promise<{success, summary, report, error}> |

---

## 🔍 故障排查

### 常见问题

#### 1. 检测脚本无法加载

**原因**：浏览器环境不支持 ES6 模块。

**解决方案**：确保使用现代浏览器（Chrome 61+, Firefox 60+, Safari 10.1+, Edge 16+）。

#### 2. LLM API 检测失败

**原因**：API Key 未配置或网络连接问题。

**解决方案**：
- 在设置中配置 OpenAI API Key
- 检查网络连接
- 验证自定义 Base URL 配置

#### 3. Ollama 检测失败

**原因**：Ollama 服务未启动或 URL 配置错误。

**解决方案**：
- 确保 Ollama 服务正在运行：`ollama serve`
- 检查 Ollama URL 配置（默认：`http://localhost:11434`）
- 验证防火墙设置

#### 4. 本地存储检测失败

**原因**：隐私模式或存储已满。

**解决方案**：
- 退出隐私模式
- 清理浏览器缓存
- 检查存储配额

---

## 🤝 贡献指南

欢迎贡献智能校测脚本的改进！

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: 添加惊人的特性'`
4. 推送到分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

---

## 📄 许可证

YYC³ CloudPivot Intelli-Matrix 智能校测脚本系统遵循 MIT 许可证。

---

## 📞 支持

如有问题或建议，请联系：

- **邮箱**：<admin@0379.email>
- **GitHub**：https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix
- **文档**：https://yyccube.xin/docs

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for Future***」
> 「***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
