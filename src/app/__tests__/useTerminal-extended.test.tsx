// @vitest-environment jsdom
/**
 * useTerminal-extended.test.tsx
 * ============================
 * useTerminal Hook 缺口回补测试（W3 P2）
 *
 * 补齐 useTerminal.test.tsx 未覆盖路径:
 * - aiTextToCli 13 类意图全分支（Text-to-CLI）
 * - env 命令真实读写全分支（list/get/set/reset/export + 类型转换）
 * - goto/open 路由跳转（中文标签匹配 / 未知路由 / onNavigate 回调）
 * - cpim 子命令残余分支（node restart / model deploy / patrol history / config get）
 * - Unix 命令全量（ls/pwd/whoami/date/uptime/neofetch/htop/ping/df/echo/cat/cd/history/exit）
 * - 自动补全深层分支（env/cpim/goto/ls/cat 前缀过滤）
 * - AI 自动执行流（400ms 延迟 + clear 不追加 + onNavigate 联动）
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTerminal } from "../hooks/useTerminal";
import { resetEnvConfig } from "../lib/env-config";

import type { TerminalHistoryEntry } from "../types";

type HookResult = ReturnType<typeof renderHook<ReturnType<typeof useTerminal>, unknown>>["result"];

function runCmd(result: HookResult, input: string): TerminalHistoryEntry {
  const before = result.current.history.length;
  act(() => {
    result.current.execute(input);
  });
  expect(result.current.history.length, `执行 ${input} 应追加历史`).toBe(before + 1);
  return result.current.history[result.current.history.length - 1];
}

/** AI 流程: fake timers 驱动 400ms 自动执行 */
function runAi(prompt: string, onNavigate?: (p: string) => void) {
  vi.useFakeTimers();
  try {
    const { result } = renderHook(() => useTerminal({ onNavigate }));
    act(() => {
      result.current.execute(`ai ${prompt}`);
    });
    const aiEntry = result.current.history[result.current.history.length - 1];
    act(() => {
      vi.advanceTimersByTime(400);
    });
    const entries = result.current.history;
    return {
      aiEntry,
      follow: entries[entries.length - 1],
      hasFollow: entries.length > 2,
    };
  } finally {
    vi.useRealTimers();
    cleanup();
  }
}

describe("useTerminal 扩展（W3 缺口回补）", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEnvConfig();
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // AI Text-to-CLI 意图全分支
  // ----------------------------------------------------------

  describe("AI Text-to-CLI 意图映射", () => {
    it.each([
      ["查看所有节点状态", "cpim node", "列出所有节点"],
      ["重启异常节点", "cpim node restart --all --force", "强制重启"],
      ["显示所有未解决告警", "cpim alerts --unresolved", "未解决的告警"],
      ["执行完整巡查", "cpim patrol run --full", "完整巡查"],
      ["查看已部署模型列表", "cpim model deploy LLaMA-70B", "部署指定模型"], // 「部署」优先于「列表」命中
      ["查看模型", "cpim model list", "列出所有已部署模型"], // 纯查看意图（无部署词）→ list
      ["部署 llama 模型", "cpim model deploy llama", "部署指定模型"],
      ["部署模型", "cpim model deploy LLaMA-70B", "部署指定模型"],
      ["生成性能报告", "cpim report --type performance --format json", "性能分析报告"],
      ["查看环境变量", "env list", "环境变量配置"],
      ["查看磁盘使用情况", "df", "磁盘使用"],
      ["查看当前进程", "htop", "进程和资源"],
      ["测试网络延迟", "ping 192.168.3.1", "网络连通性"],
      ["显示系统信息", "neofetch", "系统详细信息"],
      ["跳转到监控页面", "goto /", "数据监控"],
      ["打开操作中心", "goto /operations", "操作中心"],
      ["去设置", "goto /settings", "系统设置"],
      ["打开页面", "goto /", "跳转到首页"],
      ["清空屏幕", "clear", "清空终端屏幕"],
      ["显示帮助", "help", "可用命令列表"],
    ])("「%s」→ %s", (prompt, suggestion, explanationFragment) => {
      const { aiEntry, follow, hasFollow } = runAi(prompt);
      expect(aiEntry.status).toBe("info");
      expect(aiEntry.output).toContain(`意图: ${prompt}`);
      expect(aiEntry.output).toContain(`建议: ${suggestion}`);
      expect(aiEntry.output).toContain(explanationFragment);

      if (suggestion === "clear") {
        // clear 执行返回 __CLEAR__，不追加 follow 条目
        expect(hasFollow).toBe(false);
      } else {
        expect(follow.input).toBe(suggestion);
      }
    });

    it("兜底: 无法匹配意图 → cpim status 总览", () => {
      const { aiEntry, follow } = runAi("你好世界");
      expect(aiEntry.output).toContain("建议: cpim status");
      expect(aiEntry.output).toContain("无法精确匹配意图");
      expect(follow.input).toBe("cpim status");
    });

    it("ai 无参数 → 用法提示", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "ai");
      expect(entry.status).toBe("info");
      expect(entry.output).toContain("用法: ai <自然语言描述>");
      expect(entry.output).toContain("ai 查看所有节点状态");
    });

    it("goto 类建议自动执行后触发 onNavigate", () => {
      const onNavigate = vi.fn();
      const { follow } = runAi("打开操作中心", onNavigate);
      expect(follow.input).toBe("goto /operations");
      expect(onNavigate).toHaveBeenCalledWith("/operations");
    });
  });

  // ----------------------------------------------------------
  // env 命令（真实读写 env-config）
  // ----------------------------------------------------------

  describe("env 命令", () => {
    it("env list 列出全部配置并提示优先级", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env list");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("环境变量配置 (");
      expect(entry.output).toContain("SYSTEM_NAME");
      expect(entry.output).toContain("优先级: import.meta.env > localStorage > 默认值");
    });

    it("env 等价于 env list", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("环境变量配置 (");
    });

    it("env get 读取存在的键（字符串带引号）", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env get SYSTEM_NAME");
      expect(entry.status).toBe("success");
      expect(entry.output).toMatch(/^SYSTEM_NAME = "/);
    });

    it("env get 读取数值/布尔键（无引号）", () => {
      const { result } = renderHook(() => useTerminal());
      const num = runCmd(result, "env get DEFAULT_AI_TEMPERATURE");
      expect(num.status).toBe("success");
      expect(num.output).toBe("DEFAULT_AI_TEMPERATURE = 0.7");

      const bool = runCmd(result, "env get ENABLE_MOCK_MODE");
      expect(bool.output).toBe("ENABLE_MOCK_MODE = true");
    });

    it("env get 缺参数 → 用法提示", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env get");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("用法: env get <KEY>");
    });

    it("env get 不存在的键 → 未找到 + 列表指引", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env get TOTALLY_MISSING_KEY_123");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("未找到环境变量: TOTALLY_MISSING_KEY_123");
      expect(entry.output).toContain("env list");
    });

    it("env get 模糊匹配 → 相似变量提示", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env get system");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("相似变量");
      expect(entry.output).toContain("SYSTEM_NAME");
    });

    it("env set 字符串值剥离引号并持久化", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, 'env set SYSTEM_NAME "My System"');
      expect(entry.status).toBe("success");
      expect(entry.output).toContain('SYSTEM_NAME = "My System"');
      expect(entry.output).toContain("已保存到 localStorage");
      expect(entry.output).toContain("旧值:");
      // 验证持久化读取
      const back = runCmd(result, "env get SYSTEM_NAME");
      expect(back.output).toBe('SYSTEM_NAME = "My System"');
    });

    it("env set 不带引号的字符串", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env set SYSTEM_NAME ProdSystem");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain('SYSTEM_NAME = "ProdSystem"');
    });

    it("env set 布尔键: true/false/1 类型转换", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "env set ENABLE_DEBUG true").output).toContain("ENABLE_DEBUG = true");
      expect(runCmd(result, "env set ENABLE_DEBUG 1").output).toContain("ENABLE_DEBUG = true");
      expect(runCmd(result, "env set ENABLE_DEBUG false").output).toContain("ENABLE_DEBUG = false");
    });

    it("env set 浮点/整型键类型转换", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "env set DEFAULT_AI_TEMPERATURE 0.8").output).toContain(
        "DEFAULT_AI_TEMPERATURE = 0.8"
      );
      expect(runCmd(result, "env set DEFAULT_AI_MAX_TOKENS 4096").output).toContain(
        "DEFAULT_AI_MAX_TOKENS = 4096"
      );
    });

    it("env set 数值键传非法值 → 无效数值", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env set DEFAULT_AI_TEMPERATURE abc");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("无效数值: abc");
    });

    it("env set 缺参数 → 用法提示", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "env set").status).toBe("error");
      const entry = runCmd(result, "env set SYSTEM_NAME");
      expect(entry.output).toContain("用法: env set <KEY> <VALUE>");
    });

    it("env set 未知键 → 未知变量", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env set UNKNOWN_KEY xyz");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("未知变量: UNKNOWN_KEY");
    });

    it("env reset 无确认 → info 提示", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env reset");
      expect(entry.status).toBe("info");
      expect(entry.output).toContain("确认执行: env reset --confirm");
    });

    it("env reset --confirm / -y → 重置成功", () => {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.execute("env set SYSTEM_NAME TempName");
      });
      const entry = runCmd(result, "env reset --confirm");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("环境变量已重置");

      const shortFlag = runCmd(result, "env set ENABLE_DEBUG true");
      expect(shortFlag.status).toBe("success");
      const reset2 = runCmd(result, "env reset -y");
      expect(reset2.output).toContain("环境变量已重置");
    });

    it("env export 输出 JSON", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env export");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("环境变量导出 JSON");
      expect(entry.output).toContain('"_type": "env-config"');
    });

    it("env 未知操作 → 错误 + 用法", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "env bogus");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("未知 env 操作: bogus");
      expect(entry.output).toContain("env [list|get|set|reset|export]");
    });
  });

  // ----------------------------------------------------------
  // goto / open 路由跳转
  // ----------------------------------------------------------

  describe("goto / open 路由跳转", () => {
    it("goto 无参数 → 列出全部路由", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "goto");
      expect(entry.status).toBe("info");
      expect(entry.output).toContain("用法: goto <path>");
      expect(entry.output).toContain("/patrol");
      expect(entry.output).toContain("巡查模式");
    });

    it("goto <path> 精确跳转并触发 onNavigate", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() => useTerminal({ onNavigate }));
      const entry = runCmd(result, "goto /models");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("导航至: 模型供应商 (/models)");
      expect(onNavigate).toHaveBeenCalledWith("/models");
    });

    it("goto 中文标签匹配（无斜杠前缀）", () => {
      const onNavigate = vi.fn();
      const { result } = renderHook(() => useTerminal({ onNavigate }));
      const entry = runCmd(result, "goto 巡查");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("巡查模式 (/patrol)");
      expect(onNavigate).toHaveBeenCalledWith("/patrol");
    });

    it("open 是 goto 的同义词", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "open /theme");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("主题定制 (/theme)");
    });

    it("未知路由 → 错误提示", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "goto /nonexistent-path");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("未知路由: /nonexistent-path");
    });

    it("无 onNavigate 时跳转不报错", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "goto /alerts");
      expect(entry.status).toBe("success");
    });
  });

  // ----------------------------------------------------------
  // cpim 子命令残余分支
  // ----------------------------------------------------------

  describe("cpim 子命令残余", () => {
    it("cpim node restart [--force]", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "cpim node restart");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("重启节点");
      expect(entry.output).not.toContain("强制");

      const forced = runCmd(result, "cpim node restart --force");
      expect(forced.output).toContain("强制重启节点");
    });

    it("cpim model deploy <name>", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "cpim model deploy DeepSeek-V3");
      expect(entry.status).toBe("success");
      expect(entry.output).toContain("模型 DeepSeek-V3 部署成功");
    });

    it("cpim model 未知操作 → 错误", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "cpim model badaction");
      expect(entry.status).toBe("error");
      expect(entry.output).toContain("未知模型操作: badaction");
    });

    it("cpim patrol history / 默认状态", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "cpim patrol history").output).toContain("巡查历史");
      expect(runCmd(result, "cpim patrol").output).toContain("巡查状态");
    });

    it("cpim report health markdown 变体", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "cpim report health markdown");
      expect(entry.output).toContain("类型: 健康");
      expect(entry.output).toContain("格式: Markdown");
    });

    it("cpim config get 命中/未命中", () => {
      const { result } = renderHook(() => useTerminal());
      const hit = runCmd(result, "cpim config get patrol.interval");
      expect(hit.status).toBe("success");
      expect(hit.output).toBe("patrol.interval = 15");

      const miss = runCmd(result, "cpim config get nope.key");
      expect(miss.status).toBe("error");
      expect(miss.output).toContain("未找到配置项: nope.key");
    });

    it("cpim config set 缺参数 / config 无 action", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "cpim config set").output).toContain("用法: cpim config set <key> <value>");
      expect(runCmd(result, "cpim config").output).toContain("用法: cpim config [get|set|list]");
    });

    it("cpim help / cpim --help 等价 help", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "cpim help").output).toContain("CPIM 命令");
      expect(runCmd(result, "cpim --help").output).toContain("CPIM 命令");
    });
  });

  // ----------------------------------------------------------
  // Unix-like 命令
  // ----------------------------------------------------------

  describe("Unix-like 命令", () => {
    it("ls 目录列举", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "ls").output).toContain("logs/");
      expect(runCmd(result, "ls logs").output).toBe("node/  system/");
      expect(runCmd(result, "ls logs/").output).toBe("node/  system/");
      expect(runCmd(result, "ls configs").output).toContain("patrol.json");
      expect(runCmd(result, "ls cache/").output).toBe("queries/");
      const miss = runCmd(result, "ls nonexistent");
      expect(miss.status).toBe("error");
      expect(miss.output).toContain("ls: cannot access 'nonexistent'");
    });

    it("pwd / whoami / cd", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "pwd").output).toBe("~/.cpim-cloudpivot");
      expect(runCmd(result, "whoami").output).toBe("admin@cpim-cloudpivot");
      expect(runCmd(result, "cd /tmp").output).toBe("");
    });

    it("date / uptime 输出非空", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "date").output.length).toBeGreaterThan(0);
      const up = runCmd(result, "uptime");
      expect(up.output).toContain("up 48 days");
      expect(up.output).toContain("load average");
    });

    it("neofetch / fastfetch / htop / top", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "neofetch").status).toBe("info");
      expect(runCmd(result, "fastfetch").output).toContain("OS:");
      expect(runCmd(result, "htop").output).toContain("PID");
      expect(runCmd(result, "top").output).toContain("Tasks: 7 total");
    });

    it("ping 带/不带 host", () => {
      const { result } = renderHook(() => useTerminal());
      const withHost = runCmd(result, "ping 8.8.8.8");
      expect(withHost.output).toContain("PING 8.8.8.8");
      expect(withHost.output).toContain("0.0% packet loss");
      expect(runCmd(result, "ping").output).toContain("PING localhost");
    });

    it("df 磁盘用量", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "df");
      expect(entry.output).toContain("Filesystem");
      expect(entry.output).toContain("/mnt/nas");
    });

    it("echo 输出拼接", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "echo hello world").output).toBe("hello world");
    });

    it.each([
      "configs/patrol.json",
      "configs/alerts.json",
      "configs/templates.json",
    ])("cat %s 返回 JSON", (file) => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, `cat ${file}`);
      expect(entry.status).toBe("success");
      expect(entry.output.trim().startsWith("{")).toBe(true);
    });

    it("cat configs/env.json 返回导出配置", () => {
      const { result } = renderHook(() => useTerminal());
      const entry = runCmd(result, "cat configs/env.json");
      expect(entry.output).toContain('"_type": "env-config"');
    });

    it("cat 缺失文件 / 缺参数", () => {
      const { result } = renderHook(() => useTerminal());
      const miss = runCmd(result, "cat nope.txt");
      expect(miss.status).toBe("error");
      expect(miss.output).toContain("cat: nope.txt: No such file or directory");

      const noArg = runCmd(result, "cat");
      expect(noArg.output).toBe("cat: missing operand");
    });

    it("history / exit / quit", () => {
      const { result } = renderHook(() => useTerminal());
      expect(runCmd(result, "history").output).toContain("Command history is maintained");
      expect(runCmd(result, "exit").output).toContain("Ctrl+`");
      expect(runCmd(result, "quit").output).toContain("Ctrl+`");
    });
  });

  // ----------------------------------------------------------
  // 自动补全深层分支
  // ----------------------------------------------------------

  describe("自动补全深层分支", () => {
    function completionsOf(input: string): string[] {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.handleInputChange(input);
      });
      return result.current.completions;
    }

    it("根命令前缀", () => {
      expect(completionsOf("en")).toEqual(["env"]);
      expect(completionsOf("env")).toEqual([]); // 完全等于排除自身
      expect(completionsOf("xyz")).toEqual([]);
    });

    it("env 子命令补全", () => {
      expect(completionsOf("env ")).toEqual(["list", "get", "set", "reset", "export"]);
      expect(completionsOf("env g")).toEqual(["get"]);
      expect(completionsOf("env e")).toEqual(["export"]);
    });

    it("env get/set 键名大写补全", () => {
      const keys = completionsOf("env get SYS");
      expect(keys).toContain("SYSTEM_NAME");
      expect(keys).toContain("SYSTEM_VERSION");
      expect(completionsOf("env set ENABLE")).toContain("ENABLE_DEBUG");
    });

    it("env 第 4 段起无补全", () => {
      expect(completionsOf("env export x")).toEqual([]);
    });

    it("cpim 子命令与三级参数补全", () => {
      expect(completionsOf("cpim ")).toContain("status");
      expect(completionsOf("cpim no")).toEqual(["node"]);
      expect(completionsOf("cpim node GP")).toContain("GPU-A100-01");
      expect(completionsOf("cpim node restart ")).toContain("--force");
      expect(completionsOf("cpim unknown x")).toEqual([]);
    });

    it("goto/open 路由前缀补全", () => {
      const routes = completionsOf("goto /p");
      expect(routes).toContain("/patrol");
      expect(routes).toContain("/pwa");
      expect(routes).toContain("/performance");
      expect(completionsOf("goto")).toEqual([]);
    });

    it("ls/cat 文件路径补全", () => {
      expect(completionsOf("ls c")).toContain("configs");
      expect(completionsOf("ls c")).toContain("cache");
      expect(completionsOf("cat configs/")).toContain("configs/patrol.json");
      expect(completionsOf("cat configs/")).not.toContain("logs/node");
    });

    it("未知基命令无补全（兜底 return [] L722）", () => {
      expect(completionsOf("xyz a b")).toEqual([]);
    });
  });

  // ----------------------------------------------------------
  // 输入 / 补全应用 / 历史导航
  // ----------------------------------------------------------

  describe("applyCompletion 与历史导航", () => {
    it("applyCompletion 替换末段并追加空格、重算补全", () => {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.handleInputChange("cpim st");
      });
      expect(result.current.completions).toEqual(["status"]);

      act(() => {
        result.current.applyCompletion("status");
      });
      expect(result.current.inputValue).toBe("cpim status ");
      // 补全后带尾随空格 → "cpim status " 二级段为空串 → COMMANDS.status 为空数组
      expect(result.current.completions).toEqual([]);
    });

    it("空历史导航早退", () => {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.handleHistoryNav("up");
      });
      expect(result.current.inputValue).toBe("");
    });

    it("up 到底钳制 / down 回到空输入", () => {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.execute("help");
      });
      act(() => {
        result.current.execute("ls");
      });

      // handleHistoryNav 的 useCallback 依赖 historyIndex，
      // 同一 act 内多次调用会使用陈旧闭包 → 逐次 act 触发重渲染
      act(() => {
        result.current.handleHistoryNav("up");
      });
      expect(result.current.inputValue).toBe("ls");

      act(() => {
        result.current.handleHistoryNav("up");
      });
      expect(result.current.inputValue).toBe("help");

      // 已到最早一条，继续 up 钳制
      act(() => {
        result.current.handleHistoryNav("up");
      });
      expect(result.current.inputValue).toBe("help");

      act(() => {
        result.current.handleHistoryNav("down");
      });
      expect(result.current.inputValue).toBe("ls");

      act(() => {
        result.current.handleHistoryNav("down");
      });
      expect(result.current.inputValue).toBe("");

      // 空输入处继续 down 保持空
      act(() => {
        result.current.handleHistoryNav("down");
      });
      expect(result.current.inputValue).toBe("");
    });

    it("历史栈上限 50 条截断", () => {
      const { result } = renderHook(() => useTerminal());
      for (let i = 0; i < 55; i++) {
        act(() => {
          result.current.execute(`echo n${i}`);
        });
      }
      // 连续向上导航 50 次到达最早保留条目（每次 act 后重渲染取新闭包）
      const inputs: string[] = [];
      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.handleHistoryNav("up");
        });
        inputs.push(result.current.inputValue);
      }
      // 最新一条是 n54，向上 49 步最早保留 n5（0-4 被截断）
      expect(inputs[0]).toBe("echo n54");
      expect(inputs[49]).toBe("echo n5");
    });

    it("纯空白输入不追加历史", () => {
      const { result } = renderHook(() => useTerminal());
      act(() => {
        result.current.execute("   ");
      });
      expect(result.current.history.length).toBe(1);
    });
  });
});
