/**
 * @file: vite.config.ts
 * @description: Vite 配置文件 · 包含构建、插件、别名等配置
 * @author: YanYuCloudCube Team
 * @version: v1.0.0
 * @created: 2026-02-26
 * @updated: 2026-03-05
 * @status: active
 * @tags: [config],[build],[vite]
 *
 * @brief: Vite 构建配置
 *
 * @details:
 * - 基础路径配置（./ 用于 Electron 兼容）
 * - 插件配置（React + TailwindCSS）
 * - 路径别名（@/* → ./src/*）
 * - 开发服务器配置（端口 3218）
 * - 构建优化（代码分割、压缩）
 *
 * @dependencies: Vite, React, TailwindCSS
 * @exports: default config
 * @notes: 修改配置后需要重启开发服务器
 */

import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Electron 插件仅在构建期或显式开启时加载：
  // `pnpm dev` 为纯 Web 开发（插件在 serve 期会尝试 spawn electron 二进制，
  // 而 pnpm 环境下该二进制可能尚未下载，导致 dev 直接崩溃）；
  // 桌面联调请用 `pnpm electron:dev`（依赖已构建的 dist-electron/）。
  const enableElectron = command === 'build' || process.env.ELECTRON_ENABLE === 'true'

  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Electron 主进程 / 预加载脚本构建链：
      // 输出至根目录 dist-electron/（main.js = ESM，preload.cjs = CJS），
      // 与 package.json 的 main 字段及 electron-builder files 配置对齐
      enableElectron &&
      electron({
        main: {
          entry: 'electron/main.ts',
        },
        preload: [
          {
            input: 'electron/preload.ts',
            vite: {
              build: {
                rolldownOptions: {
                  output: {
                    // 覆盖默认的 preload.mjs（CJS 内容 + mjs 后缀在 sandbox:false 下
                    // 会被 Electron 按 ESM 解析导致启动失败），改用无歧义的 .cjs
                    entryFileNames: '[name].cjs',
                    chunkFileNames: '[name].cjs',
                  },
                },
              },
            },
          },
        ],
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: parseInt(env.VITE_PORT || '3218'),
      host: true,
      proxy: {
        // music-api @ NAS（Tailscale）；生产构建用 VITE_MUSIC_API_BASE 直连
        '/api/music': {
          target: 'http://100.65.172.88:3113',
          changeOrigin: true,
        },
      },
    },

    assetsInclude: ['**/*.svg', '**/*.csv'],

    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 400,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@mui')) {
                return 'mui-vendor';
              }
              if (id.includes('@radix-ui')) {
                return 'radix-vendor';
              }
              if (id.includes('recharts')) {
                return 'recharts-vendor';
              }
              if (id.includes('lucide-react')) {
                return 'lucide-vendor';
              }
              if (id.includes('motion')) {
                return 'motion-vendor';
              }
              if (id.includes('date-fns')) {
                return 'date-vendor';
              }
              if (id.includes('react-router')) {
                return 'router-vendor';
              }
              if (id.includes('@supabase')) {
                return 'supabase-vendor';
              }
              return 'vendor';
            }
          },
        },
      },
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'recharts'],
    },
  }
})
