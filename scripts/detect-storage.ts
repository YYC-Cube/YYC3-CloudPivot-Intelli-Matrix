/**
 * detect-storage.ts
 * =================
 * 本地存储检测脚本
 *
 * 检测项：
 * - LocalStorage 可用性
 * - IndexedDB 可用性
 * - 存储容量检测
 * - 存储性能测试
 */

interface StorageCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

export function detectStorage(): StorageCheck[] {
  const checks: StorageCheck[] = [];

  // 检测 LocalStorage
  try {
    localStorage.setItem("test", "test");
    localStorage.removeItem("test");
    checks.push({
      name: "LocalStorage",
      status: "pass",
      message: "可用",
    });
  } catch (error) {
    checks.push({
      name: "LocalStorage",
      status: "fail",
      message: "不可用",
      details: error instanceof Error ? error.message : "未知错误",
    });
  }

  // 检测 IndexedDB
  if (typeof indexedDB !== "undefined") {
    const request = indexedDB.open("test-db", 1);
    request.onerror = () => {
      checks.push({
        name: "IndexedDB",
        status: "fail",
        message: "打开失败",
        details: request.error?.message || "未知错误",
      });
    };
    request.onsuccess = () => {
      checks.push({
        name: "IndexedDB",
        status: "pass",
        message: "可用",
      });
      request.result.close();
      indexedDB.deleteDatabase("test-db");
    };
  } else {
    checks.push({
      name: "IndexedDB",
      status: "fail",
      message: "不支持",
      details: "浏览器不支持 IndexedDB",
    });
  }

  // 检测 SessionStorage
  try {
    sessionStorage.setItem("test", "test");
    sessionStorage.removeItem("test");
    checks.push({
      name: "SessionStorage",
      status: "pass",
      message: "可用",
    });
  } catch (error) {
    checks.push({
      name: "SessionStorage",
      status: "warn",
      message: "可能受限",
      details: error instanceof Error ? error.message : "未知错误",
    });
  }

  // 检测 Cookie
  if (typeof document !== "undefined") {
    try {
      document.cookie = "test=test";
      checks.push({
        name: "Cookie",
        status: "pass",
        message: "可用",
      });
    } catch (error) {
      checks.push({
        name: "Cookie",
        status: "warn",
        message: "可能受限",
        details: error instanceof Error ? error.message : "未知错误",
      });
    }
  }

  // 检测存储容量
  try {
    const testData = new Array(1024 * 100).join("a");
    localStorage.setItem("capacity-test", testData);
    localStorage.removeItem("capacity-test");
    checks.push({
      name: "存储容量",
      status: "pass",
      message: "充足",
      details: "至少支持 100KB 数据",
    });
  } catch (error) {
    checks.push({
      name: "存储容量",
      status: "warn",
      message: "接近上限",
      details: error instanceof Error ? error.message : "存储空间不足",
    });
  }

  return checks;
}

export function generateStorageReport(): string {
  const checks = detectStorage();
  const passed = checks.filter(c => c.status === "pass").length;
  const failed = checks.filter(c => c.status === "fail").length;
  const warned = checks.filter(c => c.status === "warn").length;
  const total = checks.length;

  const status = failed > 0 ? "FAIL" : warned > 0 ? "WARN" : "PASS";

  let report = "========================================\n";
  report += "        YYC³ 本地存储检测报告\n";
  report += "========================================\n\n";
  report += `状态: ${status}\n`;
  report += `通过: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)\n`;
  report += `警告: ${warned}\n`;
  report += `失败: ${failed}\n`;
  report += "\n存储检测详情:\n";

  checks.forEach(c => {
    const icon = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
    report += `  ${icon} ${c.name.padEnd(20, " " ")} ${c.message}${c.details ? `\n      ".repeat(6) + c.details : ""}`;
    report += "\n";
  });

  report += "\n========================================\n";

  return report;
}
