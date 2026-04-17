import { defineConfig, devices } from '@playwright/test';

/**
 * 環境変数から読み込み
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './e2e/tests',

  // テストファイルのパターン
  testMatch: '**/*.spec.ts',

  // 並列実行
  fullyParallel: true,

  // CI環境ではリトライなし、ローカルでは失敗時にリトライ
  retries: process.env.CI ? 2 : 0,

  // 並列ワーカー数
  workers: process.env.CI ? 1 : undefined,

  // レポーター
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // 出力ディレクトリ
  outputDir: 'test-results',

  // グローバル設定
  use: {
    // ベースURL
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // トレースの記録（失敗時のみ）
    trace: 'on-first-retry',

    // スクリーンショット（失敗時のみ）
    screenshot: 'only-on-failure',

    // 動画（失敗時のみ）
    video: 'on-first-retry',

    // タイムアウト
    actionTimeout: 10000,
    navigationTimeout: 30000,

    // 自動待機
    // waitForNavigation: 'load',
  },

  // 個別のテスト設定
  expect: {
    // アサーションのタイムアウト
    timeout: 10000,

    // スナップショット設定
    toHaveScreenshot: {
      maxDiffPixels: 100,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.1,
    },
  },

  // グローバルタイムアウト
  timeout: 60000,

  // プロジェクト（ブラウザ）設定
  projects: [
    // 認証セットアップ
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // デスクトップ Chrome
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // デスクトップ Firefox
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // デスクトップ Safari
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // モバイル Chrome
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // モバイル Safari
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
    },

    // 未認証テスト用
    {
      name: 'chromium-no-auth',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.noauth\.spec\.ts/,
    },
  ],

  // ローカル開発サーバー設定
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  // グローバルセットアップ・ティアダウン
  // globalSetup: './e2e/global-setup.ts',
  // globalTeardown: './e2e/global-teardown.ts',
});
