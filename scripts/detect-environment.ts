/**
 * detect-environment.ts
 * ===================
 * 环境可用性检测脚本
 *
 * 检测项：
 * - Node.js 版本
 * - pnpm 是否可用
 * - 浏览器 API 支持
 * - 本地存储可用性
 * - 网络连接状态
 */

import * as os from "os";

interface EnvironmentCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

export function detectEnvironment(): EnvironmentCheck[] {
  const checks: EnvironmentCheck[] = [];

  // 检测 Node.js 版本
  const nodeVersion = process.versions?.node || "unknown";
  const nodeMajorVersion = parseInt(nodeVersion.split(".")[0], 10);
  checks.push({
    name: "Node.js 版本",
    status: nodeMajorVersion >= 18 ? "pass" : "warn",
    message: `当前版本: ${nodeVersion}`,
    details: `推荐: >= 18.0.0`,
  });

  // 检测 pnpm 可用性
  try {
    const result = require("child_process").execSync("pnpm --version", { encoding: "utf-8" });
    checks.push({
      name: "pnpm",
      status: "pass",
      message: result.stdout.trim(),
    });
  } catch {
    checks.push({
      name: "pnpm",
      status: "fail",
      message: "未安装",
      details: "请运行: npm install -g pnpm",
    });
  }

  // 检测平台
  checks.push({
    name: "操作系统",
    status: "pass",
    message: os.platform(),
  });

  // 检测本地存储可用性
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      checks.push({
        name: "本地存储",
        status: "pass",
        message: "可用",
      });
    } else {
      checks.push({
        name: "本地存储",
        status: "warn",
        message: "不可用",
        details: "运行在非浏览器环境",
      });
    }
  } catch {
    checks.push({
      name: "本地存储",
      status: "warn",
      message: "可能受限",
      details: "隐私模式或存储已满",
    });
  }

  // 检测网络连接
  const isOnline = typeof navigator !== "undefined" && "onLine" in navigator;
  checks.push({
    name: "网络状态",
    status: isOnline ? "pass" : "warn",
    message: isOnline ? "在线" : "未知",
  });

  // 检测浏览器 API 支持
  const apiChecks: { name: string; supported: boolean }[] = [
    { name: "Web Worker", supported: typeof Worker !== "undefined" },
    { name: "Service Worker", supported: "serviceWorker" in navigator },
    { name: "IndexedDB", supported: typeof indexedDB !== "undefined" },
    { name: "Web Speech API", supported: typeof SpeechRecognition !== "undefined" && typeof webkitSpeechRecognition !== "undefined" },
    { name: "WebGL", supported: typeof document !== "undefined" && !!document.createElement("canvas")?.getContext("webgl") },
  ];

  apiChecks.forEach(({ name, supported }) => {
    checks.push({
      name: `API: ${name}`,
      status: supported ? "pass" : "warn",
      message: supported ? "支持" : "不支持",
    });
  });

  return checks;
}

export function generateEnvironmentReport(): string {
  const checks = detectEnvironment();
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const total = checks.length;

  const status = failed > 0 ? "FAIL" : warned > 0 ? "WARN" : "PASS";

  let report = "========================================\n";
  report += "        YYC³ 环境可用性检测报告\n";
  report += "========================================\n\n";
  report += `状态: ${status}\n`;
  report += `通过: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`;
  report += `警告: ${warned}\n`;
  report += `失败: ${failed}\n`;
  report += "\n检测详情:\n";

  checks.forEach(c => {
    const icon = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
    report += `  ${icon} ${c.name.padEnd(20, " " ")} ${c.message}`;
    if (c.details) {
      report += "\n      ".repeat(6) + c.details;
    }
    report += "\n";
  });

  report += "\n========================================\n";

  return report;
}
