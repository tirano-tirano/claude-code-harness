# パフォーマンステストガイド

Webアプリケーションの速度・パフォーマンスを測定・改善するためのガイドドキュメント。

## パフォーマンステストの目的

### なぜパフォーマンスが重要か

- **ユーザー体験**: 遅いサイトは離脱率が上がる
- **SEO**: Core Web VitalsはGoogle検索ランキングに影響
- **コンバージョン**: 表示速度が売上に直結する

### 測定すべき指標

| 指標 | 説明 | 目標値 |
|------|------|--------|
| LCP (Largest Contentful Paint) | 最大コンテンツの表示時間 | 2.5秒以下 |
| FID (First Input Delay) | 初回入力の応答時間 | 100ms以下 |
| CLS (Cumulative Layout Shift) | レイアウトのズレ量 | 0.1以下 |
| TTFB (Time to First Byte) | サーバー応答時間 | 800ms以下 |
| FCP (First Contentful Paint) | 最初のコンテンツ表示 | 1.8秒以下 |

## Lighthouseによる測定

### Playwrightでの自動測定

```typescript
// e2e/tests/performance.spec.ts
import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { chromium } from 'playwright';

test.describe('Lighthouse パフォーマンス測定', () => {
  test('ホームページのパフォーマンス', async () => {
    const browser = await chromium.launch({
      args: ['--remote-debugging-port=9222'],
    });
    const page = await browser.newPage();
    await page.goto('/');

    const result = await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: 80,
        accessibility: 90,
        'best-practices': 80,
        seo: 80,
      },
    });

    console.log('Lighthouse スコア:');
    console.log(`- Performance: ${result.lhr.categories.performance.score * 100}`);
    console.log(`- Accessibility: ${result.lhr.categories.accessibility.score * 100}`);
    console.log(`- Best Practices: ${result.lhr.categories['best-practices'].score * 100}`);
    console.log(`- SEO: ${result.lhr.categories.seo.score * 100}`);

    // パフォーマンススコアが80以上であることを確認
    expect(result.lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(80);

    await browser.close();
  });
});
```

### CLIでの測定

```bash
# Lighthouse CLI インストール
npm install -g lighthouse

# 測定実行
lighthouse http://localhost:3000 --output=json --output-path=./lighthouse-report.json

# HTMLレポート生成
lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html

# モバイル向け測定
lighthouse http://localhost:3000 --preset=perf --form-factor=mobile
```

## Core Web Vitalsの測定

### web-vitalsライブラリの使用

```typescript
// lib/web-vitals.ts
import { onCLS, onFID, onLCP, onFCP, onTTFB, Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // 計測結果をサーバーに送信
  console.log(metric);

  // Google Analyticsに送信する場合
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export function measureWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
```

### Next.jsでの組み込み

```typescript
// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { measureWebVitals } from '@/lib/web-vitals';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    measureWebVitals();
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### テストでの測定

```typescript
// e2e/tests/web-vitals.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Core Web Vitals', () => {
  test('LCPが2.5秒以下', async ({ page }) => {
    await page.goto('/');

    // LCPを測定
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // タイムアウト
        setTimeout(() => resolve(0), 10000);
      });
    });

    console.log(`LCP: ${lcp}ms`);
    expect(lcp).toBeLessThan(2500);
  });

  test('CLSが0.1以下', async ({ page }) => {
    await page.goto('/');

    // ページが安定するまで待つ
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });

        // 少し待ってから結果を返す
        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log(`CLS: ${cls}`);
    expect(cls).toBeLessThan(0.1);
  });
});
```

## バンドルサイズの監視

### @next/bundle-analyzerの使用

```bash
# インストール
npm install -D @next/bundle-analyzer
```

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Next.js設定
});
```

```bash
# バンドル分析実行
ANALYZE=true npm run build
```

### バンドルサイズの自動チェック

```typescript
// scripts/check-bundle-size.ts
import * as fs from 'fs';
import * as path from 'path';

interface BundleLimits {
  [key: string]: number; // KB単位
}

const limits: BundleLimits = {
  'main': 200,           // メインバンドル: 200KB以下
  'framework': 150,      // フレームワーク: 150KB以下
  'commons': 100,        // 共通: 100KB以下
  '_app': 50,            // _app: 50KB以下
};

function checkBundleSize() {
  const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');

  if (!fs.existsSync(buildManifestPath)) {
    console.error('ビルドマニフェストが見つかりません。先にビルドを実行してください。');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf-8'));
  const violations: string[] = [];

  // 各チャンクのサイズをチェック
  const chunksDir = path.join(process.cwd(), '.next/static/chunks');

  if (fs.existsSync(chunksDir)) {
    const files = fs.readdirSync(chunksDir);

    for (const file of files) {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = stats.size / 1024;

      // マッチするリミットを探す
      for (const [pattern, limit] of Object.entries(limits)) {
        if (file.includes(pattern)) {
          if (sizeKB > limit) {
            violations.push(
              `${file}: ${sizeKB.toFixed(1)}KB (上限: ${limit}KB)`
            );
          }
          break;
        }
      }
    }
  }

  if (violations.length > 0) {
    console.error('バンドルサイズ超過:');
    violations.forEach(v => console.error(`- ${v}`));
    process.exit(1);
  }

  console.log('バンドルサイズチェック: OK');
}

checkBundleSize();
```

```json
// package.json
{
  "scripts": {
    "check:bundle": "ts-node scripts/check-bundle-size.ts"
  }
}
```

## 画像最適化のチェック

### 画像フォーマット・サイズの検証

```typescript
// e2e/tests/image-optimization.spec.ts
import { test, expect } from '@playwright/test';

test.describe('画像最適化', () => {
  test('画像が最適化されている', async ({ page }) => {
    await page.goto('/');

    const images = await page.locator('img').all();
    const issues: string[] = [];

    for (const img of images) {
      const src = await img.getAttribute('src');
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      const displayWidth = await img.evaluate((el: HTMLImageElement) => el.clientWidth);
      const displayHeight = await img.evaluate((el: HTMLImageElement) => el.clientHeight);

      // 表示サイズより大幅に大きい画像を検出
      if (naturalWidth > displayWidth * 2 || naturalHeight > displayHeight * 2) {
        issues.push(
          `画像が大きすぎる: ${src} (実際: ${naturalWidth}x${naturalHeight}, 表示: ${displayWidth}x${displayHeight})`
        );
      }

      // Next.js Imageを使っていない画像を検出
      const srcset = await img.getAttribute('srcset');
      if (!srcset && !src?.includes('/_next/image')) {
        issues.push(`Next.js Imageを使用していない: ${src}`);
      }
    }

    if (issues.length > 0) {
      console.log('画像最適化の問題:');
      issues.forEach(i => console.log(`- ${i}`));
    }

    // 軽微な問題は警告のみ
    expect(issues.filter(i => i.includes('大きすぎる')).length).toBeLessThan(3);
  });

  test('遅延読み込みが設定されている', async ({ page }) => {
    await page.goto('/');

    // ファーストビュー外の画像
    const belowFoldImages = await page.locator('img').filter({
      has: page.locator(':below-the-fold'), // 疑似セレクタ（実際にはスクロール位置で判定）
    }).all();

    // 実際の実装
    const viewportHeight = page.viewportSize()?.height || 800;
    const allImages = await page.locator('img').all();

    for (const img of allImages) {
      const box = await img.boundingBox();
      if (box && box.y > viewportHeight) {
        const loading = await img.getAttribute('loading');
        if (loading !== 'lazy') {
          console.log(`遅延読み込みが設定されていない: y=${box.y}`);
        }
      }
    }
  });
});
```

## API応答時間の測定

### APIエンドポイントのパフォーマンステスト

```typescript
// e2e/tests/api-performance.spec.ts
import { test, expect } from '@playwright/test';

const API_ENDPOINTS = [
  { path: '/api/users', method: 'GET', maxTime: 200 },
  { path: '/api/products', method: 'GET', maxTime: 300 },
  { path: '/api/search?q=test', method: 'GET', maxTime: 500 },
];

test.describe('API パフォーマンス', () => {
  for (const endpoint of API_ENDPOINTS) {
    test(`${endpoint.method} ${endpoint.path} が ${endpoint.maxTime}ms 以内`, async ({ request }) => {
      const start = Date.now();

      const response = await request.fetch(endpoint.path, {
        method: endpoint.method,
      });

      const duration = Date.now() - start;

      console.log(`${endpoint.path}: ${duration}ms`);

      expect(response.ok()).toBe(true);
      expect(duration).toBeLessThan(endpoint.maxTime);
    });
  }
});

test.describe('API 負荷テスト', () => {
  test('同時リクエストに耐えられる', async ({ request }) => {
    const concurrentRequests = 10;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(request.fetch('/api/users'));
    }

    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    console.log(`${concurrentRequests}同時リクエスト: ${duration}ms`);

    // すべてのリクエストが成功
    for (const response of responses) {
      expect(response.ok()).toBe(true);
    }

    // 平均応答時間が許容範囲内
    expect(duration / concurrentRequests).toBeLessThan(500);
  });
});
```

## ページ読み込み時間の測定

### Navigation Timing APIの使用

```typescript
// e2e/tests/page-load.spec.ts
import { test, expect } from '@playwright/test';

interface PageLoadMetrics {
  dnsLookup: number;
  tcpConnection: number;
  serverResponse: number;
  domParsing: number;
  resourceLoading: number;
  domInteractive: number;
  pageLoad: number;
}

async function measurePageLoad(page: any): Promise<PageLoadMetrics> {
  const timing = await page.evaluate(() => {
    const t = performance.timing;
    return {
      dnsLookup: t.domainLookupEnd - t.domainLookupStart,
      tcpConnection: t.connectEnd - t.connectStart,
      serverResponse: t.responseEnd - t.requestStart,
      domParsing: t.domInteractive - t.responseEnd,
      resourceLoading: t.loadEventStart - t.domContentLoadedEventEnd,
      domInteractive: t.domInteractive - t.navigationStart,
      pageLoad: t.loadEventEnd - t.navigationStart,
    };
  });

  return timing;
}

test.describe('ページ読み込み時間', () => {
  const pages = [
    { url: '/', name: 'ホーム', maxLoad: 3000 },
    { url: '/products', name: '商品一覧', maxLoad: 4000 },
    { url: '/dashboard', name: 'ダッシュボード', maxLoad: 5000 },
  ];

  for (const pageInfo of pages) {
    test(`${pageInfo.name}ページ`, async ({ page }) => {
      await page.goto(pageInfo.url, { waitUntil: 'load' });

      const metrics = await measurePageLoad(page);

      console.log(`${pageInfo.name}ページの読み込み時間:`);
      console.log(`- DNS: ${metrics.dnsLookup}ms`);
      console.log(`- TCP接続: ${metrics.tcpConnection}ms`);
      console.log(`- サーバー応答: ${metrics.serverResponse}ms`);
      console.log(`- DOM解析: ${metrics.domParsing}ms`);
      console.log(`- リソース読み込み: ${metrics.resourceLoading}ms`);
      console.log(`- DOM Interactive: ${metrics.domInteractive}ms`);
      console.log(`- 総読み込み時間: ${metrics.pageLoad}ms`);

      expect(metrics.pageLoad).toBeLessThan(pageInfo.maxLoad);
    });
  }
});
```

## メモリリークの検出

### メモリ使用量の監視

```typescript
// e2e/tests/memory-leak.spec.ts
import { test, expect } from '@playwright/test';

test('メモリリークが発生していない', async ({ page }) => {
  await page.goto('/');

  // 初期メモリ使用量
  const initialMemory = await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });

  // 繰り返し操作を実行
  for (let i = 0; i < 10; i++) {
    await page.click('nav a:first-child');
    await page.waitForLoadState('networkidle');
    await page.goBack();
    await page.waitForLoadState('networkidle');
  }

  // ガベージコレクションを促す
  await page.evaluate(() => {
    if ((window as any).gc) {
      (window as any).gc();
    }
  });

  // 最終メモリ使用量
  const finalMemory = await page.evaluate(() => {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  });

  const memoryIncrease = finalMemory - initialMemory;
  const increasePercent = (memoryIncrease / initialMemory) * 100;

  console.log(`メモリ増加: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB (${increasePercent.toFixed(1)}%)`);

  // メモリ増加が50%以下であることを確認
  expect(increasePercent).toBeLessThan(50);
});
```

## CI/CDでのパフォーマンス監視

### GitHub Actionsでの設定

```yaml
# .github/workflows/performance.yml
name: Performance

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Start server
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/products
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run build

      - name: Check bundle size
        run: npm run check:bundle
```

### Lighthouseバジェットファイル

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "interactive", "budget": 5000 },
      { "metric": "first-contentful-paint", "budget": 2000 },
      { "metric": "largest-contentful-paint", "budget": 3000 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "total", "budget": 500 }
    ],
    "resourceCounts": [
      { "resourceType": "third-party", "budget": 10 }
    ]
  }
]
```

## パフォーマンス改善のチェックリスト

### 画像
- [ ] Next.js Imageコンポーネントを使用している
- [ ] 適切なサイズで配信している
- [ ] WebP/AVIFフォーマットを使用している
- [ ] 遅延読み込みを設定している

### JavaScript
- [ ] コード分割を行っている
- [ ] 動的インポートを使用している
- [ ] 未使用コードを削除している
- [ ] Tree Shakingが効いている

### CSS
- [ ] 未使用CSSを削除している
- [ ] クリティカルCSSをインライン化している
- [ ] CSSファイルを最小化している

### キャッシュ
- [ ] 静的アセットにキャッシュヘッダーを設定している
- [ ] Service Workerを活用している
- [ ] CDNを使用している

### サーバー
- [ ] Gzip/Brotli圧縮を有効にしている
- [ ] HTTP/2を使用している
- [ ] TTFBが800ms以下
