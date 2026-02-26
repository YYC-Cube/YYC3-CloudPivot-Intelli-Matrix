import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: false,
    include: ["src/app/__tests__/**/*.test.{ts,tsx}"],
    testTimeout: 10000,

    // 使用 jsdom 作为默认环境（React 组件测试需要 DOM）
    environment: "jsdom",

    // 配置并行执行以提升测试速度
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4, // 根据CPU核心数调整
        minThreads: 2,
      },
    },

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
      // 80% 最低覆盖率门槛
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
});