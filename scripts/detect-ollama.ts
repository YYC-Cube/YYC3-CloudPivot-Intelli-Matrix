/**
 * detect-ollama.ts
 * =================
 * Ollama 本地检测脚本
 *
 * 检测项：
 * - Ollama 服务状态
 * - 模型列表
 * - API 响应测试
 */

interface OllamaCheck {
  name: string;
  status: "pass" | "fail" | "warn" | "pending";
  message: string;
  details?: string;
  latency?: number;
}

const DEFAULT_OLLAMA_URL = "http://localhost:11434";

export function detectOllama(): OllamaCheck[] {
  const checks: OllamaCheck[] = [];

  // 检测 Ollama 配置
  const ollamaUrl = localStorage.getItem("ollama-url") || DEFAULT_OLLAMA_URL;
  checks.push({
    name: "Ollama URL",
    status: "pass",
    message: ollamaUrl,
    details: "配置正常",
  });

  // 检测服务状态
  checks.push({
    name: "Ollama 服务",
    status: "pending",
    message: "待测试",
    details: "需要实际 API 调用",
  });

  // 检测模型列表
  checks.push({
    name: "模型列表",
    status: "pending",
    message: "待测试",
    details: "需要实际 API 调用",
  });

  return checks;
}

export async function testOllamaConnection(url?: string): Promise<OllamaCheck[]> {
  const checks: OllamaCheck[] = [];
  const ollamaUrl = url || localStorage.getItem("ollama-url") || DEFAULT_OLLAMA_URL;

  try {
    // 测试服务连接
    const startTime = Date.now();
    const response = await fetch(`${ollamaUrl}/api/tags`);
    const latency = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      checks.push({
        name: "Ollama 服务",
        status: "pass",
        message: "运行中",
        details: `延迟: ${latency}ms`,
        latency,
      });

      const models = data.models || [];
      checks.push({
        name: "模型列表",
        status: "pass",
        message: "获取成功",
        details: `共 ${models.length} 个模型: ${models.map((m: any) => m.name).join(", ") || "无"}`,
        latency,
      });
    } else {
      checks.push({
        name: "Ollama 服务",
        status: "fail",
        message: "连接失败",
        details: `HTTP ${response.status}: ${response.statusText}`,
      });

      checks.push({
        name: "模型列表",
        status: "fail",
        message: "获取失败",
        details: response.statusText,
      });
    }
  } catch (error) {
    checks.push({
      name: "Ollama 服务",
      status: "fail",
      message: "未运行或无法连接",
      details: error instanceof Error ? error.message : "请确保 Ollama 已启动",
    });

    checks.push({
      name: "模型列表",
      status: "fail",
      message: "获取失败",
      details: error instanceof Error ? error.message : "未知错误",
    });
  }

  return checks;
}

export function generateOllamaReport(): string {
  const checks = detectOllama();
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const pending = checks.filter(c => c.status === "pending").length;
  const total = checks.length;

  const status = failed > 0 ? "FAIL" : pending > 0 ? "WARN" : "PASS";

  let report = "========================================\n";
  report += "        YYC³ Ollama 本地检测报告\n";
  report += "========================================\n\n";
  report += `状态: ${status}\n`;
  report += `通过: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`;
  report += `警告: ${warned}\n`;
  report += `失败: ${failed}\n`;
  report += `待测试: ${pending}\n`;
  report += "\nOllama 检测详情:\n";

  checks.forEach(c => {
    const icon = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : c.status === "pending" ? "⏳" : "❌";
    report += `  ${icon} ${c.name.padEnd(20, " " ")} ${c.message}${c.details ? `\n      ".repeat(6) + c.details : ""}`;
    if (c.latency) {
      report += ` (${c.latency}ms)`;
    }
    report += "\n";
  });

  report += "\n========================================\n";

  return report;
}
