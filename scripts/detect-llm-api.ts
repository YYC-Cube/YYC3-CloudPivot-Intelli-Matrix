/**
 * detect-llm-api.ts
 * =================
 * 大模型 API 检测脚本
 *
 * 检测项：
 * - OpenAI API 连接
 * - API Key 配置
 * - 模型列表获取
 * - API 响应测试
 */

interface LLMApiCheck {
  name: string;
  status: "pass" | "fail" | "warn" | "pending";
  message: string;
  details?: string;
  latency?: number;
}

export function detectLLMApi(): LLMApiCheck[] {
  const checks: LLMApiCheck[] = [];

  // 检测 API Key 配置
  const apiKey = localStorage.getItem("openai-api-key");
  if (apiKey && apiKey.length > 10) {
    checks.push({
      name: "OpenAI API Key",
      status: "pass",
      message: "已配置",
      details: `${apiKey.slice(0, 8)}...`,
    });
  } else {
    checks.push({
      name: "OpenAI API Key",
      status: "warn",
      message: "未配置",
      details: "请在设置中配置 API Key",
    });
  }

  // 检测自定义 Base URL
  const customBaseUrl = localStorage.getItem("custom-base-url");
  if (customBaseUrl && customBaseUrl.length > 0) {
    checks.push({
      name: "自定义 Base URL",
      status: "pass",
      message: customBaseUrl,
    });
  } else {
    checks.push({
      name: "自定义 Base URL",
      status: "warn",
      message: "未配置",
      details: "使用默认 OpenAI 端点",
    });
  }

  // 检测网络连接
  checks.push({
    name: "网络连接",
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

  // 检测 API 响应
  checks.push({
    name: "API 响应测试",
    status: "pending",
    message: "待测试",
    details: "需要实际 API 调用",
  });

  return checks;
}

export async function testLLMApiConnection(apiKey: string, baseUrl?: string): Promise<LLMApiCheck[]> {
  const checks: LLMApiCheck[] = [];
  const url = baseUrl || "https://api.openai.com/v1";

  try {
    // 测试模型列表获取
    const startTime = Date.now();
    const response = await fetch(`${url}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json();
      checks.push({
        name: "网络连接",
        status: "pass",
        message: "正常",
        details: `延迟: ${latency}ms`,
        latency,
      });

      checks.push({
        name: "模型列表",
        status: "pass",
        message: "获取成功",
        details: `共 ${data.data?.length || 0} 个模型`,
        latency,
      });
    } else {
      checks.push({
        name: "网络连接",
        status: "fail",
        message: "连接失败",
        details: response.statusText,
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
      name: "网络连接",
      status: "fail",
      message: "连接异常",
      details: error instanceof Error ? error.message : "未知错误",
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

export function generateLLMApiReport(): string {
  const checks = detectLLMApi();
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const pending = checks.filter(c => c.status === "pending").length;
  const total = checks.length;

  const status = failed > 0 ? "FAIL" : pending > 0 ? "WARN" : "PASS";

  let report = "========================================\n";
  report += "        YYC³ 大模型 API 检测报告\n";
  report += "========================================\n\n";
  report += `状态: ${status}\n`;
  report += `通过: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`;
  report += `警告: ${warned}\n`;
  report += `失败: ${failed}\n`;
  report += `待测试: ${pending}\n`;
  report += "\nAPI 检测详情:\n";

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
