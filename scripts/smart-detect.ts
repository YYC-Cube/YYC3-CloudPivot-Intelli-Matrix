/**
 * smart-detect.ts
 * ==================
 * YYC³ 智能校测主脚本
 *
 * 统一的智能检测入口，集成所有检测模块
 *
 * 使用方式：
 * - 浏览器控制台：SmartDetect.run()
 * - 命令行：pnpm tsx scripts/smart-detect.ts
 */

import { runAllDetections } from "./run-all-detections";
import { generateDetectionReport } from "./generate-report";

export class SmartDetect {
  private static instance: SmartDetect;

  private constructor() {}

  public static getInstance(): SmartDetect {
    if (!SmartDetect.instance) {
      SmartDetect.instance = new SmartDetect();
    }
    return SmartDetect.instance;
  }

  /**
   * 运行快速检测
   */
  public async quickCheck(): Promise<{
    success: boolean;
    summary: any;
    report?: string;
    error?: string;
  }> {
    try {
      const results = await runAllDetections({ testLLM: false, testOllama: false });
      return {
        success: true,
        summary: results.summary,
        report: this.formatQuickSummary(results),
      };
    } catch (error) {
      return {
        success: false,
        summary: null,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 运行完整检测
   */
  public async fullCheck(options?: {
    testLLM?: boolean;
    testOllama?: boolean;
    saveReport?: boolean;
    reportFormat?: "md" | "json" | "html" | "all";
  }): Promise<{
    success: boolean;
    results?: any;
    report?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      const results = await runAllDetections({
        testLLM: options?.testLLM,
        testOllama: options?.testOllama,
      });

      let report;
      let filename;

      if (options?.saveReport) {
        const reportResult = await generateDetectionReport({
          format: options?.reportFormat || "md",
          saveToLocalStorage: true,
        });
        report = reportResult.report;
        filename = reportResult.filename;
      } else {
        report = this.formatFullResults(results);
      }

      return {
        success: true,
        results,
        report,
        filename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 生成并下载报告
   */
  public async downloadReport(format: "md" | "json" | "html" = "md"): Promise<{
    success: boolean;
    filename?: string;
    error?: string;
  }> {
    try {
      const reportResult = await generateDetectionReport({
        format,
        saveToLocalStorage: false,
      });

      if (!reportResult.success) {
        return {
          success: false,
          error: reportResult.error,
        };
      }

      const blob = new Blob([reportResult.report], {
        type: format === "html" ? "text/html" : "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = reportResult.filename || `detection-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filename: reportResult.filename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  }

  /**
   * 格式化快速摘要
   */
  private formatQuickSummary(results: any): string {
    let summary = "========================================\n";
    summary += "      YYC³ 快速校测摘要\n";
    summary += "========================================\n\n";
    summary += `总体状态: ${results.summary.overallStatus}\n`;
    summary += `总检测项: ${results.summary.totalChecks}\n`;
    summary += `通过: ${results.summary.totalPassed} (${((results.summary.totalPassed / results.summary.totalChecks) * 100).toFixed(1)}%)\n`;
    summary += `警告: ${results.summary.totalWarned}\n`;
    summary += `失败: ${results.summary.totalFailed}\n`;
    summary += `待测试: ${results.summary.totalPending}\n\n`;

    summary += "各模块状态:\n";
    summary += `  ${this.getStatusIcon(results.environment.status)} 环境可用性\n`;
    summary += `  ${this.getStatusIcon(results.functionality.status)} 功能完整性\n`;
    summary += `  ${this.getStatusIcon(results.storage.status)} 本地存储\n`;
    summary += `  ${this.getStatusIcon(results.llmApi.status)} 大模型 API\n`;
    summary += `  ${this.getStatusIcon(results.ollama.status)} Ollama 本地\n`;

    summary += "\n========================================\n";

    return summary;
  }

  /**
   * 格式化完整结果
   */
  private formatFullResults(results: any): string {
    let report = "========================================\n";
    report += "      YYC³ 完整校测结果\n";
    report += "========================================\n\n";
    report += `生成时间: ${new Date().toLocaleString("zh-CN")}\n`;
    report += `总体状态: ${results.summary.overallStatus}\n\n`;
    report += `总检测项: ${results.summary.totalChecks}\n`;
    report += `通过: ${results.summary.totalPassed} (${((results.summary.totalPassed / results.summary.totalChecks) * 100).toFixed(1)}%)\n`;
    report += `警告: ${results.summary.totalWarned}\n`;
    report += `失败: ${results.summary.totalFailed}\n`;
    report += `待测试: ${results.summary.totalPending}\n\n`;

    report += "环境可用性:\n";
    results.environment.details.forEach((check: any) => {
      report += `  ${this.getStatusIcon(check.status)} ${check.name}: ${check.message}\n`;
    });

    report += "\n功能完整性:\n";
    results.functionality.details.forEach((check: any) => {
      report += `  ${this.getStatusIcon(check.status)} ${check.name}: ${check.message}\n`;
    });

    report += "\n本地存储:\n";
    results.storage.details.forEach((check: any) => {
      report += `  ${this.getStatusIcon(check.status)} ${check.name}: ${check.message}\n`;
    });

    report += "\n大模型 API:\n";
    results.llmApi.details.forEach((check: any) => {
      report += `  ${this.getStatusIcon(check.status)} ${check.name}: ${check.message}\n`;
    });

    report += "\nOllama 本地:\n";
    results.ollama.details.forEach((check: any) => {
      report += `  ${this.getStatusIcon(check.status)} ${check.name}: ${check.message}\n`;
    });

    report += "\n========================================\n";

    return report;
  }

  /**
   * 获取状态图标
   */
  private getStatusIcon(status: string): string {
    switch (status) {
      case "PASS":
      case "pass":
        return "✅";
      case "WARN":
      case "warn":
        return "⚠️";
      case "FAIL":
      case "fail":
        return "❌";
      case "pending":
        return "⏳";
      default:
        return "❓";
    }
  }

  /**
   * 显示检测进度
   */
  public showProgress(message: string): void {
    if (typeof console !== "undefined") {
      console.log(`[YYC³ 智能校测] ${message}`);
    }
  }

  /**
   * 保存检测历史
   */
  public saveHistory(results: any): void {
    try {
      const history = JSON.parse(localStorage.getItem("detection-history") || "[]");
      history.push({
        timestamp: new Date().toISOString(),
        summary: results.summary,
      });
      localStorage.setItem("detection-history", JSON.stringify(history.slice(-10)));
    } catch (error) {
      console.error("保存检测历史失败:", error);
    }
  }

  /**
   * 获取检测历史
   */
  public getHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem("detection-history") || "[]");
    } catch {
      return [];
    }
  }

  /**
   * 清除检测历史
   */
  public clearHistory(): void {
    localStorage.removeItem("detection-history");
  }
}

export const SmartDetect = {
  /**
   * 快速检测
   */
  quickCheck: () => SmartDetect.getInstance().quickCheck(),

  /**
   * 完整检测
   */
  fullCheck: (options?: any) => SmartDetect.getInstance().fullCheck(options),

  /**
   * 下载报告
   */
  downloadReport: (format?: "md" | "json" | "html") =>
    SmartDetect.getInstance().downloadReport(format),

  /**
   * 获取历史
   */
  getHistory: () => SmartDetect.getInstance().getHistory(),

  /**
   * 清除历史
   */
  clearHistory: () => SmartDetect.getInstance().clearHistory(),

  /**
   * 运行检测（快捷方式）
   */
  run: async () => {
    const result = await SmartDetect.getInstance().quickCheck();
    console.log(result.report);
    return result;
  },
};

if (typeof window !== "undefined") {
  (window as any).SmartDetect = SmartDetect;
}

export default SmartDetect;
