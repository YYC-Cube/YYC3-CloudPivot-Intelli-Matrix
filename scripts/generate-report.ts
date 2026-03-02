/**
 * generate-report.ts
 * ===================
 * 检测报告生成脚本
 *
 * 功能：
 * - 生成 Markdown 格式报告
 * - 生成 JSON 格式报告
 * - 生成 HTML 格式报告
 * - 保存到本地文件
 */

import { runAllDetections, generateFullReport } from "./run-all-detections";

export interface ReportOptions {
  format: "md" | "json" | "html" | "all";
  filename?: string;
  saveToLocalStorage?: boolean;
}

export async function generateDetectionReport(options?: ReportOptions): Promise<{
  success: boolean;
  report: string;
  filename?: string;
  error?: string;
}> {
  try {
    const results = await runAllDetections({ testLLM: false, testOllama: false });
    const format = options?.format || "md";
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = options?.filename || `detection-report-${timestamp}`;

    if (format === "md" || format === "all") {
      const mdReport = generateMarkdownReport(results, filename);
      if (options?.saveToLocalStorage) {
        localStorage.setItem(`${filename}.md`, mdReport);
      }
      return { success: true, report: mdReport, filename: `${filename}.md` };
    }

    if (format === "json") {
      const jsonReport = generateJsonReport(results, filename);
      if (options?.saveToLocalStorage) {
        localStorage.setItem(`${filename}.json`, JSON.stringify(jsonReport));
      }
      return { success: true, report: JSON.stringify(jsonReport, null, 2), filename: `${filename}.json` };
    }

    if (format === "html") {
      const htmlReport = generateHtmlReport(results, filename);
      if (options?.saveToLocalStorage) {
        localStorage.setItem(`${filename}.html`, htmlReport);
      }
      return { success: true, report: htmlReport, filename: `${filename}.html` };
    }

    if (format === "all") {
      const mdReport = generateMarkdownReport(results, filename);
      const jsonReport = generateJsonReport(results, filename);
      const htmlReport = generateHtmlReport(results, filename);

      if (options?.saveToLocalStorage) {
        localStorage.setItem(`${filename}.md`, mdReport);
        localStorage.setItem(`${filename}.json`, JSON.stringify(jsonReport));
        localStorage.setItem(`${filename}.html`, htmlReport);
      }

      return {
        success: true,
        report: `已生成所有格式报告：\n\n${mdReport}\n\nJSON:\n${JSON.stringify(jsonReport, null, 2)}`,
        filename: `${filename}.md`,
      };
    }

    return { success: false, report: "", error: "不支持的格式" };
  } catch (error) {
    return {
      success: false,
      report: "",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
}

function generateMarkdownReport(results: any, filename: string): string {
  let report = `# YYC³ 智能校测报告\n\n`;
  report += `> **报告ID**: ${filename}\n`;
  report += `> **生成时间**: ${new Date().toLocaleString("zh-CN")}\n`;
  report += `> **总体状态**: ${results.summary.overallStatus}\n\n`;

  report += `## 📊 总体摘要\n\n`;
  report += `| 指标 | 数值 |\n`;
  report += `|------|------|\n`;
  report += `| 总检测项 | ${results.summary.totalChecks} |\n`;
  report += `| 通过 | ${results.summary.totalPassed} (${((results.summary.totalPassed / results.summary.totalChecks) * 100).toFixed(1)}%) |\n`;
  report += `| 警告 | ${results.summary.totalWarned} |\n`;
  report += `| 失败 | ${results.summary.totalFailed} |\n`;
  report += `| 待测试 | ${results.summary.totalPending} |\n\n`;

  report += `## 🔍 各模块检测结果\n\n`;

  // 环境可用性
  report += `### 环境可用性\n\n`;
  report += `**状态**: ${results.environment.status}\n`;
  report += `**通过**: ${results.environment.passed}/${results.environment.total}\n\n`;
  results.environment.details.forEach((check: any) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    report += `- ${icon} **${check.name}**: ${check.message}${check.details ? ` (${check.details})` : ""}\n`;
  });
  report += `\n`;

  // 功能完整性
  report += `### 功能完整性\n\n`;
  report += `**状态**: ${results.functionality.status}\n`;
  report += `**通过**: ${results.functionality.passed}/${results.functionality.total}\n\n`;
  results.functionality.details.forEach((check: any) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    report += `- ${icon} **${check.name}**: ${check.message}\n`;
  });
  report += `\n`;

  // 本地存储
  report += `### 本地存储\n\n`;
  report += `**状态**: ${results.storage.status}\n`;
  report += `**通过**: ${results.storage.passed}/${results.storage.total}\n\n`;
  results.storage.details.forEach((check: any) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    report += `- ${icon} **${check.name}**: ${check.message}${check.details ? ` (${check.details})` : ""}\n`;
  });
  report += `\n`;

  // 大模型 API
  report += `### 大模型 API\n\n`;
  report += `**状态**: ${results.llmApi.status}\n`;
  report += `**通过**: ${results.llmApi.passed}/${results.llmApi.total}\n\n`;
  results.llmApi.details.forEach((check: any) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : check.status === "pending" ? "⏳" : "❌";
    report += `- ${icon} **${check.name}**: ${check.message}${check.details ? ` (${check.details})` : ""}${check.latency ? ` (${check.latency}ms)` : ""}\n`;
  });
  report += `\n`;

  // Ollama 本地
  report += `### Ollama 本地\n\n`;
  report += `**状态**: ${results.ollama.status}\n`;
  report += `**通过**: ${results.ollama.passed}/${results.ollama.total}\n\n`;
  results.ollama.details.forEach((check: any) => {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : check.status === "pending" ? "⏳" : "❌";
    report += `- ${icon} **${check.name}**: ${check.message}${check.details ? ` (${check.details})` : ""}${check.latency ? ` (${check.latency}ms)` : ""}\n`;
  });
  report += `\n`;

  report += `---\n\n`;
  report += `> 本报告由 YYC³ 智能校测系统自动生成\n`;
  report += `> YanYuCloudCube | 言启象限 语枢未来\n`;

  return report;
}

function generateJsonReport(results: any, filename: string): any {
  return {
    reportId: filename,
    generatedAt: new Date().toISOString(),
    summary: results.summary,
    modules: {
      environment: results.environment,
      functionality: results.functionality,
      storage: results.storage,
      llmApi: results.llmApi,
      ollama: results.ollama,
    },
  };
}

function generateHtmlReport(results: any, filename: string): string {
  let html = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n`;
  html += `<meta charset="UTF-8">\n`;
  html += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  html += `<title>YYC³ 智能校测报告 - ${filename}</title>\n`;
  html += `<style>\n`;
  html += `body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }\n`;
  html += `.header { text-align: center; margin-bottom: 30px; }\n`;
  html += `.summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }\n`;
  html += `.module { margin-bottom: 30px; }\n`;
  html += `.module h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }\n`;
  html += `.check { padding: 8px 0; }\n`;
  html += `.pass { color: #28a745; }\n`;
  html += `.warn { color: #ffc107; }\n`;
  html += `.fail { color: #dc3545; }\n`;
  html += `.pending { color: #6c757d; }\n`;
  html += `</style>\n</head>\n<body>\n`;

  html += `<div class="header">\n`;
  html += `<h1>YYC³ 智能校测报告</h1>\n`;
  html += `<p><strong>报告ID:</strong> ${filename}</p>\n`;
  html += `<p><strong>生成时间:</strong> ${new Date().toLocaleString("zh-CN")}</p>\n`;
  html += `<p><strong>总体状态:</strong> <span class="${results.summary.overallStatus.toLowerCase()}">${results.summary.overallStatus}</span></p>\n`;
  html += `</div>\n`;

  html += `<div class="summary">\n`;
  html += `<h2>📊 总体摘要</h2>\n`;
  html += `<p><strong>总检测项:</strong> ${results.summary.totalChecks}</p>\n`;
  html += `<p><strong>通过:</strong> ${results.summary.totalPassed} (${((results.summary.totalPassed / results.summary.totalChecks) * 100).toFixed(1)}%)</p>\n`;
  html += `<p><strong>警告:</strong> ${results.summary.totalWarned}</p>\n`;
  html += `<p><strong>失败:</strong> ${results.summary.totalFailed}</p>\n`;
  html += `<p><strong>待测试:</strong> ${results.summary.totalPending}</p>\n`;
  html += `</div>\n`;

  html += `<div class="module">\n`;
  html += `<h2>🔍 各模块检测结果</h2>\n`;

  const modules = [
    { key: "environment", title: "环境可用性" },
    { key: "functionality", title: "功能完整性" },
    { key: "storage", title: "本地存储" },
    { key: "llmApi", title: "大模型 API" },
    { key: "ollama", title: "Ollama 本地" },
  ];

  modules.forEach(module => {
    html += `<h3>${module.title}</h3>\n`;
    html += `<p><strong>状态:</strong> <span class="${results[module.key].status.toLowerCase()}">${results[module.key].status}</span></p>\n`;
    html += `<p><strong>通过:</strong> ${results[module.key].passed}/${results[module.key].total}</p>\n`;
    html += `<ul>\n`;
    results[module.key].details.forEach((check: any) => {
      html += `<li class="check"><span class="${check.status}">${check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : check.status === "pending" ? "⏳" : "❌"}</span> <strong>${check.name}:</strong> ${check.message}${check.details ? ` (${check.details})` : ""}${check.latency ? ` (${check.latency}ms)` : ""}</li>\n`;
    });
    html += `</ul>\n`;
  });

  html += `</div>\n`;
  html += `<hr>\n`;
  html += `<p><em>本报告由 YYC³ 智能校测系统自动生成</em></p>\n`;
  html += `<p><em>YanYuCloudCube | 言启象限 语枢未来</em></p>\n`;
  html += `</body>\n</html>\n`;

  return html;
}
