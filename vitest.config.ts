import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "figma:asset/*": path.resolve(__dirname, "./public/placeholder-logo.png"),
    },
  },
  envDir: path.resolve(__dirname, "./.env-CloudPivot-Matrix"),
  test: {
    globals: false,
    include: ["src/app/__tests__/**/*.test.{ts,tsx}"],
    testTimeout: 10000,
    env: {
      NODE_ENV: "test",
      POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || "change_me_in_env",
      DB_PASSWORD: process.env.DB_PASSWORD || "change_me_in_env",
      ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || "change_me_in_env",
      VITE_DEBUG_MODE: "false",
      OLLAMA_HOST: "host.docker.internal",
      OLLAMA_PORT: "11435",
    },

    // 使用 jsdom 作为默认环境（React 组件测试需要 DOM）
    environment: "jsdom",

    // jsdom 组件测试的 setup 文件
    setupFiles: ["src/app/__tests__/setup.ts"],

    // 覆盖率配置
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: [
        "src/app/lib/**/*.ts",
        "src/app/hooks/**/*.ts",
        "src/app/components/**/*.tsx",
        "src/app/types/**/*.ts",
      ],
      exclude: [
        "src/app/components/ui/**",
        "src/app/components/figma/**",
        "src/app/docs/**",
        "src/app/__tests__/**",
      ],
      // 覆盖率渐进门禁：环境变量 COVERAGE_GATE 控制阶段阈值
      //   未设置      → 本地宽松基线（防止误伤开发体验）
      //   phase1     → 2026-09 基线锁定（lines 26 / functions 23 / branches 25 / statements 25）
      //   phase2     → 2026-10 目标 45%
      //   phase3     → 2026-11+ 目标 60%（最终目标 80%）
      // 阶段达标后由维护者修改本文件推进 gate 常量，保证门禁只升不降（ratchet）。
      //
      // shard 模式豁免：分片运行时覆盖率仅为局部样本（≈1/N），对全局阈值判定
      // 必然误报失败。分片仅产出 lcov 供 coverage-gate job 合并后统一判门禁。
      // （thresholds 置空跳过判定；vitest 4 不接受 false，需省略或清零）
      ...(process.env.VITEST_SHARD
        ? {}
        : {
          thresholds: (() => {
            const GATES: Record<
              string,
              { lines: number; functions: number; branches: number; statements: number }
            > = {
              phase1: { lines: 26, functions: 23, branches: 25, statements: 25 },
              phase2: { lines: 45, functions: 40, branches: 35, statements: 45 },
              phase3: { lines: 60, functions: 55, branches: 50, statements: 60 },
              final: { lines: 80, functions: 75, branches: 70, statements: 80 },
            };
            return (
              GATES[process.env.COVERAGE_GATE ?? ""] ?? {
                lines: 20,
                functions: 18,
                branches: 18,
                statements: 20,
              }
            );
          })(),
        }),
    },
  },
});
