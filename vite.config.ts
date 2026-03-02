import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Build analysis tool (disabled by default, enable with: pnpm build --analyze)
    process.env.ANALYZE === 'true' ? visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }) : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3218,
    host: true,
  },

  // File types to support raw imports. Never add .css, .csv, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Enable minification
    minify: 'esbuild',
    // Enable sourcemaps for production debugging
    sourcemap: false,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 500,
    // Rollup options for code splitting
    rollupOptions: {
      // Manual chunk configuration
      output: {
        // Optimize chunk naming
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Manual chunks for better code splitting
        manualChunks: {
          // React and ReactDOM - core framework
          'react-vendor': ['react', 'react-dom', 'react-router', 'react-router-dom'],
          
          // UI Libraries - split by usage
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
          ],
          
          // Charting libraries
          'charts-vendor': ['recharts'],
          
          // Animation libraries
          'animation-vendor': ['motion', '@popperjs/core'],
          
          // Utilities
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // Testing libraries (only in development)
          'testing-vendor': ['@testing-library/react', '@testing-library/jest-dom'],
        },
      },
      // External large dependencies
      external: [],
    },
    // Enable esbuild for faster builds
    esbuild: {
      // Drop console logs in production
      drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
      // Minify whitespace and comments
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      // Tree shaking
      keepNames: false,
      // Target
      target: 'esnext',
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    // Include these dependencies for faster HMR
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      'recharts',
      'motion',
    ],
    // Exclude these from optimization
    exclude: [],
    // Force re-optimization
    force: false,
  },

  // CSS optimization
  css: {
    // Enable CSS modules for better scoping
    modules: {
      localsConvention: 'camelCase',
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
    // Preprocessor options
    preprocessorOptions: {},
    // PostCSS is configured in postcss.config.mjs
  },

  // Log level
  logLevel: 'info',

  // Clear screen on rebuild
  clearScreen: true,

  // Enable profiling in development
  profile: false,
})
