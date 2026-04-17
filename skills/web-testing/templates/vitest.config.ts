/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // テスト環境
    environment: 'jsdom',

    // グローバルAPI（describe, it, expectなどをimportなしで使用）
    globals: true,

    // セットアップファイル
    setupFiles: ['./vitest.setup.ts'],

    // テストファイルのパターン
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],

    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        'e2e/**',
      ],
      // カバレッジ閾値（必要に応じて調整）
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },

    // タイムアウト
    testTimeout: 10000,
    hookTimeout: 10000,

    // 並列実行
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },

    // ウォッチモードの設定
    watch: true,
    watchExclude: ['**/node_modules/**', '**/dist/**'],

    // レポーター
    reporters: ['default'],

    // スナップショット
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
  },

  // パスエイリアス（Next.jsのtsconfig.jsonに合わせる）
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
});
