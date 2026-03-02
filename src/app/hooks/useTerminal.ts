/**
 * useTerminal.ts
 * ===============
 * CLI 终端模拟 Hook
 * 解析 cpim 命令、维护历史记录、模拟命令补全
 *
 * 支持:
 * - cpim 系列管理命令
 * - 常见 *nix 工具命令 (ls, cat, ping …)
 * - goto / open 路由跳转
 * - ai <prompt> Text-to-CLI (模拟)
 */

import { useState, useCallback, useRef } from "react";
import type { TerminalHistoryEntry } from "../types";

// ============================================================
// Command Registry
// ============================================================

interface CommandResult {
  output: string;
  status: "success" | "error" | "info";
  /** 如果命令需要触发路由跳转，返回目标路径 */
  navigate?: string;
  /** 如果命令需要执行 AI 查询 */
  aiQuery?: string;
}

const COMMANDS: Record<string, string[]> = {
  cpim:   ["status", "node", "model", "alerts", "patrol", "report", "config", "help"],
  status: [],
  node:   ["GPU-A100-01", "GPU-A100-02", "GPU-A100-03", "GPU-A100-04", "GPU-H100-01", "GPU-H100-02", "restart", "--all", "--force"],
  model:  ["deploy", "list", "migrate", "status"],
  alerts: ["--unresolved", "--critical", "--all"],
  patrol: ["run", "--full", "--quick", "history", "status"],
  report: ["--type", "performance", "health", "security", "--format", "json", "markdown", "--output"],
  config: ["set", "get", "list", "patrol.interval", "notification.email"],
  help:   [],
  goto:   ["/", "/follow-up", "/patrol", "/operations", "/files", "/ai", "/loop", "/pwa", "/design-system", "/dev-guide", "/models", "/theme", "/terminal", "/ide", "/audit", "/users", "/settings"],
  open:   ["/", "/follow-up", "/patrol", "/operations", "/files", "/ai", "/loop", "/pwa", "/design-system", "/dev-guide", "/models", "/theme", "/terminal", "/ide", "/audit", "/users", "/settings"],
  ai:     [],
};

/** 路由路径 → 中文名 映射 */
const ROUTE_LABELS: Record<string, string> = {
  "/": "数据监控",
  "/follow-up": "一键跟进",
  "/patrol": "巡查模式",
  "/operations": "操作中心",
  "/files": "文件管理",
  "/ai": "AI 决策",
  "/loop": "服务闭环",
  "/pwa": "PWA 状态",
  "/design-system": "设计系统",
  "/dev-guide": "开发指南",
  "/models": "模型供应商",
  "/theme": "主题定制",
  "/terminal": "终端",
  "/ide": "IDE 面板",
  "/audit": "操作审计",
  "/users": "用户管理",
  "/settings": "系统设置",
};

// ============================================================
// AI Text-to-CLI Mock
// ============================================================

/** 模拟 AI 将自然语言翻译为 CLI 命令 */
function aiTextToCli(prompt: string): { suggestion: string; explanation: string } {
  const p = prompt.toLowerCase();

  if (p.includes("节点") && (p.includes("状态") || p.includes("列表") || p.includes("查看"))) {
    return { suggestion: "cpim node", explanation: "列出所有节点的状态信息" };
  }
  if (p.includes("重启") && p.includes("节点")) {
    return { suggestion: "cpim node restart --all --force", explanation: "强制重启所有异常节点" };
  }
  if (p.includes("告警") || p.includes("报警") || p.includes("异常")) {
    return { suggestion: "cpim alerts --unresolved", explanation: "显示所有未解决的告警" };
  }
  if (p.includes("巡查") || p.includes("巡检") || p.includes("健康检查")) {
    return { suggestion: "cpim patrol run --full", explanation: "执行完整巡查并生成报告" };
  }
  if (p.includes("模型") && (p.includes("列表") || p.includes("部署") || p.includes("查看"))) {
    if (p.includes("部署")) {
      const modelMatch = p.match(/(llama|deepseek|qwen|gpt)/i);
      return { suggestion: `cpim model deploy ${modelMatch?.[0] ?? "LLaMA-70B"}`, explanation: "部署指定模型到可用节点" };
    }
    return { suggestion: "cpim model list", explanation: "列出所有已部署模型及状态" };
  }
  if (p.includes("报告") || p.includes("性能") || p.includes("报表")) {
    return { suggestion: "cpim report --type performance --format json", explanation: "生成性能分析报告" };
  }
  if (p.includes("配置") || p.includes("设置") || p.includes("config")) {
    return { suggestion: "cpim config list", explanation: "查看所有系统配置项" };
  }
  if (p.includes("存储") || p.includes("磁盘") || p.includes("硬盘")) {
    return { suggestion: "df", explanation: "查看文件系统磁盘使用情况" };
  }
  if (p.includes("进程") || p.includes("cpu") || p.includes("内存")) {
    return { suggestion: "htop", explanation: "查看当前运行进程和资源使用" };
  }
  if (p.includes("网络") || (p.includes("ping") || p.includes("延迟"))) {
    return { suggestion: "ping 192.168.3.1", explanation: "测试与网关的网络连通性" };
  }
  if (p.includes("系统") && (p.includes("信息") || p.includes("版本"))) {
    return { suggestion: "neofetch", explanation: "显示系统详细信息" };
  }
  if (p.includes("跳转") || p.includes("打开") || p.includes("去")) {
    if (p.includes("监控")) {return { suggestion: "goto /", explanation: "跳转到数据监控页面" };}
    if (p.includes("巡查")) {return { suggestion: "goto /patrol", explanation: "跳转到巡查模式" };}
    if (p.includes("操作")) {return { suggestion: "goto /operations", explanation: "跳转到操作中心" };}
    if (p.includes("设置")) {return { suggestion: "goto /settings", explanation: "跳转到系统设置" };}
    return { suggestion: "goto /", explanation: "跳转到首页" };
  }
  if (p.includes("清") && (p.includes("屏") || p.includes("空"))) {
    return { suggestion: "clear", explanation: "清空终端屏幕" };
  }
  if (p.includes("帮助") || p.includes("help") || p.includes("命令")) {
    return { suggestion: "help", explanation: "显示所有可用命令列表" };
  }

  // fallback
  return { suggestion: "cpim status", explanation: "无法精确匹配意图，显示系统总览" };
}

// ============================================================
// Command Processor
// ============================================================

function processCommand(input: string): CommandResult {
  const parts = input.trim().split(/\s+/);
  const base = parts[0]?.toLowerCase();

  if (!base) {
    return { output: "", status: "info" };
  }

  if (base === "clear") {
    return { output: "__CLEAR__", status: "info" };
  }

  // ── goto / open 路由跳转 ──────────────────────
  if (base === "goto" || base === "open") {
    const target = parts[1];
    if (!target) {
      const routeList = Object.entries(ROUTE_LABELS)
        .map(([path, label]) => `  ${path.padEnd(18)} ${label}`)
        .join("\n");
      return {
        status: "info",
        output: `用法: ${base} <path>\n\n可用路由:\n${routeList}`,
      };
    }
    // 模糊匹配：支持不带 / 前缀
    let matchedPath = target.startsWith("/") ? target : `/${target}`;
    // 支持中文名匹配
    const byLabel = Object.entries(ROUTE_LABELS).find(
      ([, label]) => label.includes(target)
    );
    if (byLabel) {matchedPath = byLabel[0];}

    const label = ROUTE_LABELS[matchedPath];
    if (label) {
      return {
        status: "success",
        output: `导航至: ${label} (${matchedPath})`,
        navigate: matchedPath,
      };
    }
    return {
      status: "error",
      output: `未知路由: ${target}\n输入 ${base} 查看所有可用路由`,
    };
  }

  // ── ai <prompt> Text-to-CLI ──────────────────
  if (base === "ai") {
    const prompt = parts.slice(1).join(" ");
    if (!prompt) {
      return {
        status: "info",
        output: `用法: ai <自然语言描述>\n\n示例:\n  ai 查看所有节点状态\n  ai 重启异常节点\n  ai 打开巡查面板\n  ai 生成性能报告\n  ai 部署 DeepSeek 模型`,
      };
    }
    return {
      status: "info",
      output: "",
      aiQuery: prompt,
    };
  }

  if (base === "help" || input === "cpim help" || input === "cpim --help") {
    return {
      status: "info",
      output: `YYC³ CloudPivot Intelli-Matrix CLI v3.2.0

CPIM 命令:
  cpim status                     查看系统总览
  cpim node [name]                查看节点列表/详情
  cpim node restart [--all]       重启节点
  cpim model list                 列出已部署模型
  cpim model deploy <name>        部署模型
  cpim alerts [--unresolved]      查看告警列表
  cpim patrol run [--full]        执行巡查
  cpim patrol history             查看巡查历史
  cpim report [--type perf]       生成报告
  cpim config [get|set|list]      配置管理

路由跳转:
  goto <path>   导航到指定页面     open <path>   同义
  goto          列出所有可用路由

AI 助手:
  ai <描述>     自然语言转 CLI 命令 (Text-to-CLI)

系统命令:
  ls [dir]      列出目录内容      cat <file>    查看文件内容
  pwd           当前目录          cd <dir>      切换目录
  whoami        当前用户          date          当前时间
  uptime        运行时间          df            磁盘用量
  htop / top    进程列表          ping <host>   网络测试
  neofetch      系统信息          echo <text>   输出文本
  history       命令历史          clear         清屏
  exit          关闭终端

快捷键:  ↑/↓ 历史导航 · Tab 自动补全 · Ctrl+\` 切换终端`,
    };
  }

  if (base === "cpim") {
    const sub = parts[1]?.toLowerCase();

    if (!sub || sub === "status") {
      return {
        status: "success",
        output: `┌─────────────────────────────────────────┐
│  YYC³ CloudPivot Intelli-Matrix  v3.2.0         │
│  ─────────────────────────────────────  │
│  活跃节点:    7/8        ✅             │
│  GPU 利用率:  82.4%      ●●●●●●●●○○    │
│  推理 QPS:    3,842      ↑12.3%        │
│  平均延迟:    48ms       ↓5.2%         │
│  Token 吞吐:  138K/s                    │
│  存储使用:    12.8TB / 48TB             │
│  告警:        5 条 (1 严重)             │
│  ─────────────────────────────────────  │
│  上次巡查: 30 分钟前 · 健康度 96%      │
│  WebSocket: ws://localhost:3113 ✅      │
│  PostgreSQL: localhost:5433 ✅          │
└─────────────────────────────────────────┘`,
      };
    }

    if (sub === "node") {
      const target = parts[2];
      if (!target) {
        return {
          status: "success",
          output: `节点列表:
  ✅ GPU-A100-01   GPU: 72%  Mem: 65%  45°C  LLaMA-70B    3 任务
  ✅ GPU-A100-02   GPU: 68%  Mem: 58%  42°C  DeepSeek-V3  2 任务
  ⚠️  GPU-A100-03   GPU: 91%  Mem: 89%  78°C  LLaMA-70B    5 任务  延迟高
  ✅ GPU-A100-04   GPU: 45%  Mem: 32%  38°C  Qwen-72B     1 任务
  ✅ GPU-H100-01   GPU: 55%  Mem: 48%  41°C  DeepSeek-V3  2 任务
  🔴 GPU-H100-02   GPU: 98%  Mem: 95%  85°C  LLaMA-70B    0 任务  显存不足
  ✅ M4-Max-01     GPU: 30%  Mem: 42%  52°C  Qwen-72B     1 任务

  共 7 节点, 6 正常, 1 警告, 1 异常`,
        };
      }
      if (target === "restart") {
        const force = parts.includes("--force");
        return {
          status: "success",
          output: `${force ? "强制" : ""}重启节点...
  ⏳ GPU-A100-03  重启中...    [████████░░] 80%
  ⏳ GPU-H100-02  重启中...    [██████░░░░] 60%
  ✅ 2 个节点已发送重启指令`,
        };
      }
      return {
        status: "success",
        output: `节点详情: ${target}
  状态:    ✅ 在线
  GPU:     72% ●●●●●●●○○○
  内存:    65% ●●●●●●○○○○
  温度:    45°C
  模型:    LLaMA-70B
  活跃任务: 3
  运行时间: 48h 23m
  最近告警: 无`,
      };
    }

    if (sub === "model") {
      const action = parts[2]?.toLowerCase();
      if (action === "list" || !action) {
        return {
          status: "success",
          output: `已部署模型:
  │ 模型          │ 节点         │ 延迟     │ 状态   │
  │───────────────│──────────────│──────────│────────│
  │ LLaMA-70B     │ GPU-A100-01  │ 820ms   │ ✅     │
  │ DeepSeek-V3   │ GPU-A100-02  │ 1,200ms │ ✅     │
  │ Qwen-72B      │ GPU-A100-04  │ 950ms   │ ✅     │
  │ LLaMA-70B     │ GPU-A100-03  │ 2,450ms │ ⚠️     │

  共 4 个部署实例`,
        };
      }
      if (action === "deploy") {
        const modelName = parts[3] ?? "unknown";
        return {
          status: "success",
          output: `部署模型: ${modelName}
  ⏳ 检查节点可用性...  ✅
  ⏳ 上传模型权重...    [████████████████████] 100%
  ⏳ 配置推理参数...    ✅
  ⏳ 冒烟测试...        ✅  延迟 890ms
  ✅ 模型 ${modelName} 部署成功`,
        };
      }
      return { status: "error", output: `未知模型操作: ${action}\n使用 cpim model --help 查看帮助` };
    }

    if (sub === "alerts") {
      return {
        status: "success",
        output: `告警列表:
  🔴 [AL-0032] GPU-A100-03 推理延迟异常   2,450ms > 2,000ms     活跃
  🟠 [AL-0035] NAS-Storage-01 存储 85.8%  接近阈值 85%          活跃
  🟠 [AL-0038] 网络延迟偏高               平均 45ms > 30ms      排查中
  🟠 [AL-0040] GPU-H100-02 显存使用率 98% 接近满载              活跃
  🔵 [AL-0042] 推理队列积压               等待任务 23 > 15      已解决

  共 5 条告警: 1 严重, 1 错误, 2 警告, 1 信息`,
      };
    }

    if (sub === "patrol") {
      const action = parts[2]?.toLowerCase();
      if (action === "run") {
        return {
          status: "success",
          output: `执行巡查${parts.includes("--full") ? " (完整模式)" : ""}...
  ⏳ 检查节点健康...    [████████████] 6/6 ✅
  ⏳ 检查存储容量...    [████████████] 3/3 ⚠️
  ⏳ 检查网络延迟...    [████████████] 3/3 ⚠️
  ⏳ 检查模型服务...    [████████████] 3/3 ✅
  ⏳ 检查数据库...      [████████████] 2/2 ✅
  ⏳ 检查进程状态...    [████████████] 3/3 ✅

  巡查完成!
  健康度: 85%  耗时: 12s
  通过: 17  警告: 3  严重: 0`,
        };
      }
      if (action === "history") {
        return {
          status: "success",
          output: `巡查历史:
  │ 时间               │ 健康度 │ 通过 │ 警告 │ 严重 │ 触发   │
  │────────────────────│────────│──────│──────│──────│────────│
  │ 2026-02-25 10:00   │  96%   │  18  │   2  │   0  │ 自动   │
  │ 2026-02-25 09:30   │  95%   │  17  │   3  │   0  │ 自动   │
  │ 2026-02-25 09:00   │  97%   │  19  │   1  │   0  │ 自动   │
  │ 2026-02-25 08:00   │  92%   │  16  │   3  │   1  │ 手动   │

  共 4 条记录`,
        };
      }
      return {
        status: "success",
        output: `巡查状态:
  自动巡查: ✅ 启用 (每 15 分钟)
  上次巡查: 30 分钟前  健康度 96%
  下次巡查: 约 15 分钟后
  累计巡查: 127 次`,
      };
    }

    if (sub === "report") {
      return {
        status: "success",
        output: `生成报告...
  类型: ${parts.includes("health") ? "健康" : "性能"}报告
  格式: ${parts.includes("markdown") ? "Markdown" : "JSON"}
  ✅ 报告已生成: ~/.cpim-cloudpivot/reports/daily/2026-02-25.json
  📊 节点性能: 82.4% 平均 GPU 利用率
  📈 推理延迟: 48ms 平均 (↓5.2%)
  📁 文件大小: 156KB`,
      };
    }

    if (sub === "config") {
      const action = parts[2]?.toLowerCase();
      if (action === "list") {
        return {
          status: "success",
          output: `系统配置:
  patrol.interval         = 15
  patrol.auto_enabled     = true
  notification.email      = admin@cpim.local
  ws.endpoint             = ws://localhost:3113/ws
  db.host                 = localhost:5433
  storage.cache_dir       = ~/.cpim-cloudpivot/cache
  log.retention_days      = 30`,
        };
      }
      if (action === "get") {
        const key = parts[3] ?? "unknown";
        const values: Record<string, string> = {
          "patrol.interval": "15",
          "notification.email": "admin@cpim.local",
          "ws.endpoint": "ws://localhost:3113/ws",
        };
        return {
          status: values[key] ? "success" : "error",
          output: values[key] ? `${key} = ${values[key]}` : `未找到配置项: ${key}`,
        };
      }
      if (action === "set") {
        const key = parts[3];
        const val = parts[4];
        if (key && val) {
          return { status: "success", output: `✅ ${key} = ${val}  (已更新)` };
        }
        return { status: "error", output: "用法: cpim config set <key> <value>" };
      }
      return { status: "info", output: "用法: cpim config [get|set|list]" };
    }

    return { status: "error", output: `未知子命令: ${sub}\n输入 cpim help 查看帮助` };
  }

  // Non-cpim commands
  if (base === "ls") {
    const dir = parts[1];
    if (!dir) {
      return { status: "success", output: "logs/  reports/  backups/  configs/  cache/" };
    }
    const dirs: Record<string, string> = {
      "logs": "node/  system/",
      "logs/": "node/  system/",
      "reports": "daily/  weekly/  monthly/",
      "reports/": "daily/  weekly/  monthly/",
      "configs": "patrol.json  alerts.json  templates.json",
      "configs/": "patrol.json  alerts.json  templates.json",
      "backups": "nodes/  models/  config/",
      "backups/": "nodes/  models/  config/",
      "cache": "queries/",
      "cache/": "queries/",
      "logs/node": "GPU-A100-01/  GPU-A100-02/  GPU-A100-03/  GPU-A100-04/  GPU-H100-01/  GPU-H100-02/  M4-Max-01/",
      "logs/system": "app.log  performance.json",
    };
    return {
      status: dirs[dir] ? "success" : "error",
      output: dirs[dir] ?? `ls: cannot access '${dir}': No such file or directory`,
    };
  }
  if (base === "pwd") {
    return { status: "success", output: "~/.cpim-cloudpivot" };
  }
  if (base === "whoami") {
    return { status: "success", output: "admin@cpim-cloudpivot" };
  }
  if (base === "date") {
    return { status: "success", output: new Date().toLocaleString("zh-CN") };
  }
  if (base === "uptime") {
    return {
      status: "success",
      output: ` ${new Date().toLocaleTimeString("zh-CN")} up 48 days, 12:37,  3 users,  load average: 2.15, 1.89, 1.72`,
    };
  }
  if (base === "neofetch" || base === "fastfetch") {
    return {
      status: "info",
      output: `        ╭──────────────────────────────╮
   ╱╲   │  YYC³ CP-IM v3.2.0          │
  ╱  ╲  │  ──────────────────────────  │
 ╱ ╱╲ ╲ │  OS:     macOS 15.3 (M4 Max) │
╱ ╱──╲ ╲│  Host:   Mac Studio (2025)   │
╲ ╲──╱ ╱│  Kernel: Darwin 24.3.0       │
 ╲ ╲╱ ╱ │  Shell:  cpim-cli 3.2.0      │
  ╲  ╱  │  CPU:    M4 Max (16-core)    │
   ╲╱   │  GPU:    M4 Max (40-core)    │
         │  Memory: 128GB Unified       │
         │  Nodes:  7/8 Active          │
         │  Models: 4 Deployed          │
         │  Uptime: 48d 12h 37m         │
         ╰──────────────────────────────╯`,
    };
  }
  if (base === "htop" || base === "top") {
    return {
      status: "info",
      output: `PID    USER      CPU%  MEM%  TIME+     COMMAND
 1024  admin     72.3  65.2  12:45:23  llama-inference (GPU-A100-01)
 1156  admin     68.1  58.4  10:32:11  deepseek-serve  (GPU-A100-02)
 1287  admin     91.2  89.1  08:15:47  llama-inference (GPU-A100-03) ⚠️
 1345  admin     45.3  32.1  06:42:33  qwen-inference  (GPU-A100-04)
 1478  admin     55.7  48.9  04:28:15  deepseek-serve  (GPU-H100-01)
 1589  admin     98.1  95.2  02:14:08  llama-inference (GPU-H100-02) 🔴
 1623  admin     30.4  42.6  01:05:44  qwen-inference  (M4-Max-01)
 ────────────────────────────────────────────────────
 Tasks: 7 total, 7 running | CPU: 65.9% | Mem: 61.5%`,
    };
  }
  if (base === "ping") {
    const host = parts[1] ?? "localhost";
    return {
      status: "success",
      output: `PING ${host} (192.168.3.${Math.floor(Math.random() * 254) + 1}): 56 data bytes
64 bytes: icmp_seq=0 ttl=64 time=0.${Math.floor(Math.random() * 900) + 100} ms
64 bytes: icmp_seq=1 ttl=64 time=0.${Math.floor(Math.random() * 900) + 100} ms
64 bytes: icmp_seq=2 ttl=64 time=0.${Math.floor(Math.random() * 900) + 100} ms

--- ${host} ping statistics ---
3 packets transmitted, 3 packets received, 0.0% packet loss
round-trip min/avg/max = 0.123/0.456/0.789 ms`,
    };
  }
  if (base === "df") {
    return {
      status: "success",
      output: `Filesystem      Size  Used  Avail  Use%  Mounted on
/dev/nvme0n1    2.0T  1.2T  800G   60%   /
/dev/nas0       48T   12.8T 35.2T  27%   /mnt/nas
tmpfs           64G   12G   52G    19%   /dev/shm`,
    };
  }
  if (base === "echo") {
    return { status: "success", output: parts.slice(1).join(" ") };
  }
  if (base === "cat") {
    const file = parts[1];
    if (file === "configs/patrol.json") {
      return {
        status: "success",
        output: `{
  "interval": 15,
  "auto_enabled": true,
  "checks": ["nodes", "storage", "network", "models", "database", "processes"],
  "thresholds": { "gpu_temp": 80, "mem_usage": 90, "latency_ms": 100 }
}`,
      };
    }
    if (file === "configs/alerts.json") {
      return {
        status: "success",
        output: `{
  "thresholds": {
    "gpu_usage": 90,
    "memory_usage": 85,
    "latency_ms": 2000,
    "storage_percent": 85,
    "temperature_c": 80
  },
  "notification": { "email": true, "push": true, "sound": false }
}`,
      };
    }
    if (file === "configs/templates.json") {
      return {
        status: "success",
        output: `{
  "templates": [
    { "id": "t-001", "name": "模型部署标准流程", "steps": 5 },
    { "id": "t-002", "name": "节点故障排查流程", "steps": 8 },
    { "id": "t-003", "name": "每日备份任务", "steps": 3 }
  ]
}`,
      };
    }
    return { status: "error", output: file ? `cat: ${file}: No such file or directory` : "cat: missing operand" };
  }
  if (base === "cd") {
    return { status: "success", output: "" };
  }
  if (base === "history") {
    return { status: "info", output: "Command history is maintained in session.\nUse ↑/↓ arrow keys to navigate." };
  }
  if (base === "exit" || base === "quit") {
    return { status: "info", output: "Use Ctrl+` or click ✕ to close the integrated terminal." };
  }

  return {
    status: "error",
    output: `命令未找到: ${base}\n输入 help 查看可用命令`,
  };
}

// ============================================================
// Autocomplete
// ============================================================

function getCompletions(input: string): string[] {
  const parts = input.trim().split(/\s+/);
  if (parts.length === 1) {
    const prefix = parts[0].toLowerCase();
    return ["cpim", "help", "clear", "ls", "pwd", "whoami", "date", "uptime", "neofetch", "htop", "top", "ping", "df", "echo", "cat", "cd", "history", "goto", "open", "ai", "exit"]
      .filter((c) => c.startsWith(prefix) && c !== prefix);
  }
  const base = parts[0].toLowerCase();
  if (base === "cpim") {
    if (parts.length === 2) {
      const prefix = parts[1].toLowerCase();
      return (COMMANDS.cpim ?? []).filter((c) => c.startsWith(prefix) && c !== prefix);
    }
    if (parts.length >= 3) {
      const sub = parts[1].toLowerCase();
      const prefix = parts[parts.length - 1].toLowerCase();
      return (COMMANDS[sub] ?? []).filter((c) => c.startsWith(prefix) && c !== prefix);
    }
  }
  if (base === "goto" || base === "open") {
    const prefix = parts[parts.length - 1].toLowerCase();
    return (COMMANDS.goto ?? []).filter((c) => c.toLowerCase().startsWith(prefix) && c.toLowerCase() !== prefix);
  }
  if (base === "ls" || base === "cat") {
    const prefix = parts[parts.length - 1].toLowerCase();
    const dirs = ["logs", "reports", "backups", "configs", "cache", "logs/node", "logs/system", "configs/patrol.json", "configs/alerts.json", "configs/templates.json"];
    return dirs.filter((d) => d.startsWith(prefix) && d !== prefix);
  }
  return [];
}

// ============================================================
// Hook
// ============================================================

interface UseTerminalOptions {
  /** 路由跳转回调 */
  onNavigate?: (path: string) => void;
  /** 终端标识 (多 Tab 唯一 ID) */
  tabId?: string;
}

export function useTerminal(options: UseTerminalOptions = {}) {
  const { onNavigate, tabId = "main" } = options;

  const [history, setHistory] = useState<TerminalHistoryEntry[]>([
    {
      id: `init-${tabId}`,
      input: "",
      output: "YYC³ CloudPivot Intelli-Matrix CLI v3.2.0\n本地闭环终端 · 输入 help 查看可用命令\n提示: ai <自然语言> 可将描述转为 CLI 命令 · goto <path> 跳转页面\n",
      timestamp: Date.now(),
      status: "info",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [completions, setCompletions] = useState<string[]>([]);

  const inputHistory = useRef<string[]>([]);

  const execute = useCallback((input: string) => {
    if (!input.trim()) {return;}

    inputHistory.current = [input, ...inputHistory.current.slice(0, 49)];
    setHistoryIndex(-1);

    const result = processCommand(input);

    if (result.output === "__CLEAR__") {
      setHistory([]);
      setInputValue("");
      setCompletions([]);
      return;
    }

    // ── AI Text-to-CLI ──
    if (result.aiQuery) {
      const { suggestion, explanation } = aiTextToCli(result.aiQuery);
      const aiEntry: TerminalHistoryEntry = {
        id: `cmd-${Date.now()}`,
        input,
        output: `🤖 AI Text-to-CLI\n  意图: ${result.aiQuery}\n  建议: ${suggestion}\n  说明: ${explanation}\n\n  ▶ 正在自动执行: ${suggestion}`,
        timestamp: Date.now(),
        status: "info",
      };
      setHistory((prev) => [...prev, aiEntry]);

      // 自动执行建议命令（延迟模拟）
      setTimeout(() => {
        const followUp = processCommand(suggestion);
        if (followUp.navigate && onNavigate) {
          onNavigate(followUp.navigate);
        }
        if (followUp.output !== "__CLEAR__") {
          const followEntry: TerminalHistoryEntry = {
            id: `cmd-ai-${Date.now()}`,
            input: suggestion,
            output: followUp.output,
            timestamp: Date.now(),
            status: followUp.status,
          };
          setHistory((prev) => [...prev, followEntry]);
        }
      }, 400);

      setInputValue("");
      setCompletions([]);
      return;
    }

    // ── 路由跳转 ──
    if (result.navigate && onNavigate) {
      onNavigate(result.navigate);
    }

    const entry: TerminalHistoryEntry = {
      id: `cmd-${Date.now()}`,
      input,
      output: result.output,
      timestamp: Date.now(),
      status: result.status,
    };

    setHistory((prev) => [...prev, entry]);
    setInputValue("");
    setCompletions([]);
  }, [onNavigate]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (value.trim()) {
      setCompletions(getCompletions(value));
    } else {
      setCompletions([]);
    }
  }, []);

  const handleHistoryNav = useCallback((direction: "up" | "down") => {
    const hist = inputHistory.current;
    if (hist.length === 0) {return;}

    if (direction === "up") {
      const next = Math.min(historyIndex + 1, hist.length - 1);
      setHistoryIndex(next);
      setInputValue(hist[next]);
    } else {
      if (historyIndex <= 0) {
        setHistoryIndex(-1);
        setInputValue("");
      } else {
        const next = historyIndex - 1;
        setHistoryIndex(next);
        setInputValue(hist[next]);
      }
    }
  }, [historyIndex]);

  const applyCompletion = useCallback((completion: string) => {
    const parts = inputValue.trim().split(/\s+/);
    parts[parts.length - 1] = completion;
    const newValue = parts.join(" ") + " ";
    setInputValue(newValue);
    setCompletions([]);
  }, [inputValue]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setInputValue("");
    setCompletions([]);
  }, []);

  return {
    history,
    inputValue,
    completions,
    execute,
    handleInputChange,
    handleHistoryNav,
    applyCompletion,
    clearHistory,
  };
}
