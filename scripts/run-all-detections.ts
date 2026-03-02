/**
 * run-all-detections.ts
 * =====================
 * 执行所有检测的脚本
 *
 * 统一执行所有检测脚本并汇总结果
 */

import { detectEnvironment, generateEnvironmentReport } from "./detect-environment";
import { detectFunctionality, generateFunctionalityReport } from "./detect-functionality";
import { detectStorage, generateStorageReport } from "./detect-storage";
import { detectLLMApi, generateLLMApiReport, testLLMApiConnection } from "./detect-llm-api";
import { detectOllama, generateOllamaReport, testOllamaConnection } from "./detect-ollama";

export interface DetectionResult {
  name: string;
  status: "pass" | "fail" | "warn" | "pending";
  passed: number;
  failed: number;
  warned: number;
  pending: number;
  total: number;
  details: any[];
}

export async function runAllDetections(options?: {
  testLLM?: boolean;
  testOllama?: boolean;
}): Promise<{
  environment: DetectionResult;
  functionality: DetectionResult;
  storage: DetectionResult;
  llmApi: DetectionResult;
  ollama: DetectionResult;
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    totalWarned: number;
    totalPending: number;
    overallStatus: "PASS" | "WARN" | "FAIL";
  };
}> {
  const environmentChecks = detectEnvironment();
  const functionalityChecks = detectFunctionality();
  const storageChecks = detectStorage();
  let llmApiChecks = detectLLMApi();
  let ollamaChecks = detectOllama();

  // 如果需要测试 LLM API
  if (options?.testLLM) {
    const apiKey = localStorage.getItem("openai-api-key") || "";
    const customBaseUrl = localStorage.getItem("custom-base-url") || undefined;
    if (apiKey) {
      try {
        llmApiChecks = await testLLMApiConnection(apiKey, customBaseUrl);
      } catch (error) {
        console.error("LLM API 测试失败:", error);
      }
    }
  }

  // 如果需要测试 Ollama
  if (options?.testOllama) {
    try {
      ollamaChecks = await testOllamaConnection();
    } catch (error) {
      console.error("Ollama 测试失败:", error);
    }
  }

  // 汇总结果
  const environment: DetectionResult = {
    name: "环境可用性",
    status: getOverallStatus(environmentChecks),
    passed: environmentChecks.filter(c => c.status === "pass").length,
    failed: environmentChecks.filter(c => c.status === "fail").length,
    warned: environmentChecks.filter(c => c.status === "warn").length,
    pending: environmentChecks.filter(c => c.status === "pending").length,
    total: environmentChecks.length,
    details: environmentChecks,
  };

  const functionality: DetectionResult = {
    name: "功能完整性",
    status: getOverallStatus(functionalityChecks),
    passed: functionalityChecks.filter(c => c.status === "pass").length,
    failed: functionalityChecks.filter(c => c.status === "fail").length,
    warned: functionalityChecks.filter(c => c.status === "warn").length,
    pending: functionalityChecks.filter(c => c.status === "pending").length,
    total: functionalityChecks.length,
    details: functionalityChecks,
  };

  const storage: DetectionResult = {
    name: "本地存储",
    status: getOverallStatus(storageChecks),
    passed: storageChecks.filter(c => c.status === "pass").length,
    failed: storageChecks.filter(c => c.status === "fail").length,
    warned: storageChecks.filter(c => c.status === "warn").length,
    pending: storageChecks.filter(c => c.status === "pending").length,
    total: storageChecks.length,
    details: storageChecks,
  };

  const llmApi: DetectionResult = {
    name: "大模型 API",
    status: getOverallStatus(llmApiChecks),
    passed: llmApiChecks.filter(c => c.status === "pass").length,
    failed: llmApiChecks.filter(c => c.status === "fail").length,
    warned: llmApiChecks.filter(c => c.status === "warn").length,
    pending: llmApiChecks.filter(c => c.status === "pending").length,
    total: llmApiChecks.length,
    details: llmApiChecks,
  };

  const ollama: DetectionResult = {
    name: "Ollama 本地",
    status: getOverallStatus(ollamaChecks),
    passed: ollamaChecks.filter(c => c.status === "pass").length,
    failed: ollamaChecks.filter(c => c.status === "fail").length,
    warned: ollamaChecks.filter(c => c.status === "warn").length,
    pending: ollamaChecks.filter(c => c.status === "pending").length,
    total: ollamaChecks.length,
    details: ollamaChecks,
  };

  // 总体汇总
  const totalChecks = environment.total + functionality.total + storage.total + llmApi.total + ollama.total;
  const totalPassed = environment.passed + functionality.passed + storage.passed + llmApi.passed + ollama.passed;
  const totalFailed = environment.failed + functionality.failed + storage.failed + llmApi.failed + ollama.failed;
  const totalWarned = environment.warned + functionality.warned + storage.warned + llmApi.warned + ollama.warned;
  const totalPending = environment.pending + functionality.pending + storage.pending + llmApi.pending + ollama.pending;

  const summary = {
    totalChecks,
    totalPassed,
    totalFailed,
    totalWarned,
    totalPending,
    overallStatus: totalFailed > 0 ? "FAIL" : totalPending > 0 ? "WARN" : "PASS",
  };

  return {
    environment,
    functionality,
    storage,
    llmApi,
    ollama,
    summary,
  };
}

function getOverallStatus(checks: { status: string }[]): "PASS" | "WARN" | "FAIL" | "pending" {
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const pending = checks.filter(c => c.status === "pending").length;

  if (failed > 0) return "FAIL";
  if (pending > 0) return "WARN";
  if (warned > 0) return "WARN";
  return "PASS";
}

export function generateFullReport(results: {
  environment: DetectionResult;
  functionality: DetectionResult;
  storage: DetectionResult;
  llmApi: DetectionResult;
  ollama: DetectionResult;
  summary: {
    totalChecks: number;
    totalPassed: number;
    totalFailed: number;
    totalWarned: number;
    totalPending: number;
    overallStatus: "PASS" | "WARN" | "FAIL";
  };
}): string {
  let report = "========================================\n";
  report += "      YYC³ 智能校测完整报告\n";
  report += "========================================\n\n";
  report += `生成时间: ${new Date().toLocaleString("zh-CN")}\n`;
  report += `总体状态: ${results.summary.overallStatus}\n`;
  report += `总检测项: ${results.summary.totalChecks}\n`;
  report += `通过: ${results.summary.totalPassed} (${((results.summary.totalPassed / results.summary.totalChecks) * 100).toFixed(1)}%)\n`;
  report += `警告: ${results.summary.totalWarned}\n`;
  report += `失败: ${results.summary.totalFailed}\n`;
  report += `待测试: ${results.summary.totalPending}\n`;
  report += "\n========================================\n\n";

  // 各模块报告
  report += generateEnvironmentReport() + "\n";
  report += generateFunctionalityReport() + "\n";
  report += generateStorageReport() + "\n";
  report += generateLLMApiReport() + "\n";
  report += generateOllamaReport() + "\n";

  return report;
}
