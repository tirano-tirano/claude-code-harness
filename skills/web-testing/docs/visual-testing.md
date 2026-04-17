# ビジュアルテストガイド（★重点領域）

見た目の問題を検出・改善するためのガイドドキュメント。
従来の「スクリーンショット比較」の限界を超え、自律的に判断できる仕組みを構築する。

## ビジュアルテストの判定原則

### ❌ やってはいけない判定方法

```
「前回のスクリーンショットと違う = 問題」
```

この方法では：
- 意図した改善も「差分あり」と警告される
- 毎回人間の確認が必要になる
- 自律的な開発ができない

### ✅ 採用する判定方法

```
判定フロー:
    │
    ├─ ① ルールベースチェック
    │   「明確な基準に違反しているか？」
    │   → 違反あり → 問題として報告
    │
    ├─ ② AI品質チェック（Claude Vision）
    │   「設計意図に反していないか？」
    │   → 問題あり → 問題として報告
    │
    └─ ③ 上記で問題なし
        → スクリーンショットの差分があってもOK
        → ベースラインを自動更新
```

## A. ルールベースチェック（絶対的な基準）

「前回と違うか」ではなく「ルールに違反しているか」で判定する。

### 1. アクセシビリティチェック（axe-core）

```typescript
// e2e/tests/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('アクセシビリティ', () => {
  test('ホームページに重大な違反がない', async ({ page }) => {
    await page.goto('/');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])  // WCAG 2.0 Level A, AA
      .analyze();

    // 重大な違反がないことを確認
    expect(results.violations.filter(v => 
      v.impact === 'critical' || v.impact === 'serious'
    )).toHaveLength(0);
  });

  test('フォームページのアクセシビリティ', async ({ page }) => {
    await page.goto('/contact');

    const results = await new AxeBuilder({ page })
      .include('form')  // フォーム部分のみチェック
      .analyze();

    // 違反の詳細を出力
    if (results.violations.length > 0) {
      console.log('アクセシビリティ違反:');
      results.violations.forEach(v => {
        console.log(`- ${v.id}: ${v.description}`);
        console.log(`  影響度: ${v.impact}`);
        console.log(`  対象: ${v.nodes.map(n => n.target).join(', ')}`);
      });
    }

    expect(results.violations).toHaveLength(0);
  });
});
```

### 2. タップ領域サイズチェック

```typescript
// e2e/tests/tap-targets.spec.ts
import { test, expect } from '@playwright/test';

const MIN_TAP_SIZE = 44; // 推奨最小タップ領域（px）

test('インタラクティブ要素のタップ領域', async ({ page }) => {
  await page.goto('/');

  // すべてのボタン・リンクを取得
  const interactiveElements = await page.locator('button, a, [role="button"], input[type="submit"]').all();

  const violations: string[] = [];

  for (const element of interactiveElements) {
    const box = await element.boundingBox();
    if (box) {
      if (box.width < MIN_TAP_SIZE || box.height < MIN_TAP_SIZE) {
        const text = await element.textContent() || await element.getAttribute('aria-label') || 'unknown';
        violations.push(
          `"${text.trim()}" のサイズが小さい: ${box.width}x${box.height}px (最小: ${MIN_TAP_SIZE}x${MIN_TAP_SIZE}px)`
        );
      }
    }
  }

  if (violations.length > 0) {
    console.log('タップ領域の問題:');
    violations.forEach(v => console.log(`- ${v}`));
  }

  expect(violations).toHaveLength(0);
});
```

### 3. コントラスト比チェック

```typescript
// axe-coreで自動チェックされるが、追加で特定要素をチェック
test('重要なテキストのコントラスト', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  // コントラスト違反の詳細
  const contrastViolations = results.violations.filter(v => v.id === 'color-contrast');

  if (contrastViolations.length > 0) {
    console.log('コントラスト違反:');
    contrastViolations[0].nodes.forEach(node => {
      console.log(`- ${node.target}: ${node.failureSummary}`);
    });
  }

  expect(contrastViolations).toHaveLength(0);
});
```

### 4. 必須要素の存在確認

```typescript
// e2e/tests/required-elements.spec.ts
import { test, expect } from '@playwright/test';

test.describe('必須要素の存在確認', () => {
  test('ヘッダーに必要な要素がある', async ({ page }) => {
    await page.goto('/');

    // ロゴ
    await expect(page.getByRole('img', { name: /logo/i })).toBeVisible();

    // ナビゲーション
    await expect(page.getByRole('navigation')).toBeVisible();

    // ログインボタンまたはユーザーメニュー
    const loginOrUser = page.getByRole('button', { name: /ログイン|マイページ/i });
    await expect(loginOrUser).toBeVisible();
  });

  test('フォームに必要なラベルがある', async ({ page }) => {
    await page.goto('/contact');

    // 各入力フィールドにラベルがあることを確認
    const inputs = await page.locator('input:not([type="hidden"]), textarea, select').all();

    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // いずれかの方法でラベル付けされている
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      const hasAriaLabel = !!ariaLabel || !!ariaLabelledBy;

      expect(hasLabel || hasAriaLabel).toBeTruthy();
    }
  });
});
```

### 5. 要素の重なりチェック

```typescript
// e2e/tests/overlap-check.spec.ts
import { test, expect } from '@playwright/test';

test('重要な要素が他の要素と重なっていない', async ({ page }) => {
  await page.goto('/');

  // 重要なインタラクティブ要素を取得
  const elements = await page.locator('button, a, input, select').all();
  const boxes: { element: string; box: { x: number; y: number; width: number; height: number } }[] = [];

  for (const element of elements) {
    const box = await element.boundingBox();
    if (box && box.width > 0 && box.height > 0) {
      const text = await element.textContent() || await element.getAttribute('aria-label') || 'unknown';
      boxes.push({ element: text.trim().substring(0, 20), box });
    }
  }

  // 重なりをチェック
  const overlaps: string[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].box;
      const b = boxes[j].box;

      // 重なり判定
      if (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
      ) {
        overlaps.push(`"${boxes[i].element}" と "${boxes[j].element}" が重なっている`);
      }
    }
  }

  if (overlaps.length > 0) {
    console.log('要素の重なり:');
    overlaps.forEach(o => console.log(`- ${o}`));
  }

  // 重なりがないことを確認（または許容範囲内）
  expect(overlaps).toHaveLength(0);
});
```

### 6. 画面外はみ出しチェック

```typescript
test('要素が画面外にはみ出していない', async ({ page }) => {
  await page.goto('/');

  const viewportSize = page.viewportSize()!;
  const elements = await page.locator('*').all();

  const overflows: string[] = [];

  for (const element of elements.slice(0, 100)) { // 最初の100要素をチェック
    const box = await element.boundingBox();
    if (box) {
      if (box.x + box.width > viewportSize.width + 10) { // 10pxの余裕
        const tag = await element.evaluate(el => el.tagName.toLowerCase());
        overflows.push(`${tag} が右にはみ出し: x=${box.x}, width=${box.width}`);
      }
    }
  }

  expect(overflows.length).toBeLessThan(5); // 軽微なはみ出しは許容
});
```

## B. レスポンシブテスト

### テストすべきviewportサイズ

```typescript
// e2e/tests/responsive.spec.ts
import { test, expect, devices } from '@playwright/test';

const viewports = [
  { name: 'Mobile', width: 375, height: 667 },   // iPhone SE
  { name: 'Tablet', width: 768, height: 1024 },  // iPad
  { name: 'Desktop', width: 1280, height: 720 }, // 一般的なラップトップ
  { name: 'Wide', width: 1920, height: 1080 },   // フルHD
];

for (const viewport of viewports) {
  test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('ナビゲーションが適切に表示される', async ({ page }) => {
      await page.goto('/');

      if (viewport.width < 768) {
        // モバイル: ハンバーガーメニューが表示される
        await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
        await expect(page.getByRole('navigation')).not.toBeVisible();
      } else {
        // デスクトップ: ナビゲーションが直接表示される
        await expect(page.getByRole('navigation')).toBeVisible();
      }
    });

    test('コンテンツが画面内に収まる', async ({ page }) => {
      await page.goto('/');

      // 横スクロールが発生していないことを確認
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewport.width + 20);
    });

    test('スクリーンショットを取得', async ({ page }) => {
      await page.goto('/');
      await page.screenshot({
        path: `visual/screenshots/home-${viewport.name.toLowerCase()}.png`,
        fullPage: true,
      });
    });
  });
}
```

### デバイスエミュレーション

```typescript
import { devices } from '@playwright/test';

test.describe('実機エミュレーション', () => {
  test.describe('iPhone 12', () => {
    test.use({ ...devices['iPhone 12'] });

    test('タッチ操作が動作する', async ({ page }) => {
      await page.goto('/');
      await page.tap('.menu-button');
      await expect(page.getByRole('navigation')).toBeVisible();
    });
  });

  test.describe('iPad Pro', () => {
    test.use({ ...devices['iPad Pro'] });

    test('横向きでも正常に表示される', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});
```

## C. AI品質チェック（Claude Vision活用）

### スクリーンショットをClaudeに渡す方法

```typescript
// e2e/utils/ai-visual-check.ts
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';

const anthropic = new Anthropic();

interface VisualCheckResult {
  isAcceptable: boolean;
  issues: string[];
  suggestions: string[];
  severity: 'none' | 'minor' | 'major' | 'critical';
}

export async function checkVisualQuality(
  screenshotPath: string,
  context: {
    pageName: string;
    pageDescription: string;
    designPrinciples?: string[];
  }
): Promise<VisualCheckResult> {
  const imageData = fs.readFileSync(screenshotPath);
  const base64Image = imageData.toString('base64');

  const defaultPrinciples = [
    '視覚的な階層構造が明確であること',
    '重要な要素（CTA、ナビゲーション）が目立っていること',
    '余白のバランスが適切であること',
    'テキストが読みやすいこと',
    '色使いが一貫していること',
    'レイアウトが整っていること（要素が整列している）',
  ];

  const principles = context.designPrinciples || defaultPrinciples;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/png',
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: `あなたはUI/UXの専門家です。以下のWebページのスクリーンショットを評価してください。

## ページ情報
- ページ名: ${context.pageName}
- 説明: ${context.pageDescription}

## 評価観点
${principles.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## 回答形式
以下のJSON形式で回答してください：
{
  "isAcceptable": true/false,
  "severity": "none" | "minor" | "major" | "critical",
  "issues": ["問題点1", "問題点2", ...],
  "suggestions": ["改善提案1", "改善提案2", ...]
}

- isAcceptable: 全体として許容できる品質かどうか
- severity: 最も深刻な問題の重大度
  - none: 問題なし
  - minor: 軽微な問題（使用に支障なし）
  - major: 大きな問題（ユーザー体験に影響）
  - critical: 致命的な問題（使用不可能）
- issues: 具体的な問題点（空配列の場合あり）
- suggestions: 改善提案（空配列の場合あり）

JSON以外の文字は含めないでください。`,
          },
        ],
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  return JSON.parse(content.text);
}
```

### テストでの使用

```typescript
// e2e/tests/visual-ai.spec.ts
import { test, expect } from '@playwright/test';
import { checkVisualQuality } from '../utils/ai-visual-check';
import * as path from 'path';

test.describe('AI ビジュアル品質チェック', () => {
  test('ホームページの品質', async ({ page }) => {
    await page.goto('/');
    
    const screenshotPath = path.join(__dirname, '../screenshots/home-ai-check.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const result = await checkVisualQuality(screenshotPath, {
      pageName: 'ホームページ',
      pageDescription: 'サービスの紹介と主要機能へのナビゲーションを提供するランディングページ',
    });

    console.log('AI評価結果:', JSON.stringify(result, null, 2));

    // 重大な問題がないことを確認
    expect(result.severity).not.toBe('critical');
    expect(result.severity).not.toBe('major');
  });

  test('フォームページの品質', async ({ page }) => {
    await page.goto('/contact');
    
    const screenshotPath = path.join(__dirname, '../screenshots/contact-ai-check.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    const result = await checkVisualQuality(screenshotPath, {
      pageName: 'お問い合わせフォーム',
      pageDescription: 'ユーザーが問い合わせを送信するためのフォームページ',
      designPrinciples: [
        'フォームフィールドが明確にラベル付けされている',
        '必須項目が分かりやすい',
        '送信ボタンが目立つ位置にある',
        'エラー状態が想像しやすいデザイン',
      ],
    });

    // 問題があれば詳細を出力
    if (result.issues.length > 0) {
      console.log('検出された問題:');
      result.issues.forEach(issue => console.log(`- ${issue}`));
    }

    if (result.suggestions.length > 0) {
      console.log('改善提案:');
      result.suggestions.forEach(s => console.log(`- ${s}`));
    }

    expect(result.isAcceptable).toBe(true);
  });
});
```

### 特定のコンポーネントのチェック

```typescript
test('ボタンコンポーネントの品質', async ({ page }) => {
  await page.goto('/components/buttons');

  // ボタンセクションのスクリーンショット
  const buttonSection = page.locator('.button-showcase');
  const screenshotPath = path.join(__dirname, '../screenshots/buttons-ai-check.png');
  await buttonSection.screenshot({ path: screenshotPath });

  const result = await checkVisualQuality(screenshotPath, {
    pageName: 'ボタンコンポーネント',
    pageDescription: 'プライマリ、セカンダリ、無効状態のボタンのショーケース',
    designPrinciples: [
      'ボタンの状態（通常、ホバー、無効）が視覚的に区別できる',
      'プライマリボタンが最も目立つ',
      'アイコンとテキストのバランスが良い',
      'クリック可能であることが明確',
    ],
  });

  expect(result.isAcceptable).toBe(true);
});
```

## D. 改善ワークフロー

### 問題検出から修正までのフロー

```
1. スクリーンショット取得
       ↓
2. ルールベースチェック実行
       ↓
   問題あり → 3. 問題の詳細を報告
       ↓
4. AI品質チェック実行
       ↓
   問題あり → 5. 問題と改善提案を報告
       ↓
6. 問題なし → テスト成功 & ベースライン更新
```

### 自動修正のガイドライン

```typescript
// e2e/utils/auto-fix-suggestions.ts

interface FixSuggestion {
  issue: string;
  cssProperty: string;
  currentValue: string;
  suggestedValue: string;
  selector: string;
}

export function generateFixSuggestions(issues: string[]): FixSuggestion[] {
  const suggestions: FixSuggestion[] = [];

  for (const issue of issues) {
    // タップ領域が小さい
    if (issue.includes('タップ領域') || issue.includes('クリック領域')) {
      suggestions.push({
        issue,
        cssProperty: 'min-height / min-width',
        currentValue: 'auto',
        suggestedValue: '44px',
        selector: 'button, a, [role="button"]',
      });
    }

    // コントラスト不足
    if (issue.includes('コントラスト')) {
      suggestions.push({
        issue,
        cssProperty: 'color / background-color',
        currentValue: '現在の色',
        suggestedValue: 'コントラスト比4.5:1以上の色',
        selector: '該当テキスト要素',
      });
    }

    // 余白不足
    if (issue.includes('余白') || issue.includes('詰まって')) {
      suggestions.push({
        issue,
        cssProperty: 'padding / margin / gap',
        currentValue: '現在値',
        suggestedValue: '16px以上',
        selector: '該当コンテナ',
      });
    }
  }

  return suggestions;
}
```

### テスト結果レポートの生成

```typescript
// e2e/utils/report-generator.ts
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  pageName: string;
  timestamp: string;
  screenshotPath: string;
  ruleBasedChecks: {
    accessibility: { passed: boolean; violations: string[] };
    tapTargets: { passed: boolean; violations: string[] };
    contrast: { passed: boolean; violations: string[] };
  };
  aiCheck: {
    isAcceptable: boolean;
    severity: string;
    issues: string[];
    suggestions: string[];
  };
}

export function generateReport(results: TestResult[]): string {
  const reportDir = path.join(__dirname, '../../visual/reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>ビジュアルテストレポート</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; }
    .page-result { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 8px; }
    .passed { border-left: 4px solid green; }
    .failed { border-left: 4px solid red; }
    .screenshot { max-width: 400px; border: 1px solid #ddd; }
    .issues { color: red; }
    .suggestions { color: blue; }
  </style>
</head>
<body>
  <h1>ビジュアルテストレポート</h1>
  <p>生成日時: ${new Date().toISOString()}</p>
  
  ${results.map(r => `
    <div class="page-result ${r.aiCheck.isAcceptable ? 'passed' : 'failed'}">
      <h2>${r.pageName}</h2>
      <img src="${r.screenshotPath}" class="screenshot" />
      
      <h3>ルールベースチェック</h3>
      <ul>
        <li>アクセシビリティ: ${r.ruleBasedChecks.accessibility.passed ? '✅' : '❌'}</li>
        <li>タップ領域: ${r.ruleBasedChecks.tapTargets.passed ? '✅' : '❌'}</li>
        <li>コントラスト: ${r.ruleBasedChecks.contrast.passed ? '✅' : '❌'}</li>
      </ul>
      
      <h3>AI品質チェック</h3>
      <p>判定: ${r.aiCheck.isAcceptable ? '✅ 合格' : '❌ 不合格'}</p>
      <p>重大度: ${r.aiCheck.severity}</p>
      
      ${r.aiCheck.issues.length > 0 ? `
        <h4 class="issues">検出された問題</h4>
        <ul>${r.aiCheck.issues.map(i => `<li>${i}</li>`).join('')}</ul>
      ` : ''}
      
      ${r.aiCheck.suggestions.length > 0 ? `
        <h4 class="suggestions">改善提案</h4>
        <ul>${r.aiCheck.suggestions.map(s => `<li>${s}</li>`).join('')}</ul>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
  `;

  const reportPath = path.join(reportDir, `report-${Date.now()}.html`);
  fs.writeFileSync(reportPath, html);

  return reportPath;
}
```

## E. 統合テストスクリプト

### すべてのビジュアルチェックを実行

```typescript
// e2e/tests/visual-full.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { checkVisualQuality } from '../utils/ai-visual-check';
import { generateReport } from '../utils/report-generator';
import * as path from 'path';

const pages = [
  { url: '/', name: 'ホームページ', description: 'ランディングページ' },
  { url: '/login', name: 'ログイン', description: '認証ページ' },
  { url: '/dashboard', name: 'ダッシュボード', description: 'メイン画面' },
  { url: '/contact', name: 'お問い合わせ', description: 'フォームページ' },
];

const results: any[] = [];

for (const pageInfo of pages) {
  test.describe(`${pageInfo.name}のビジュアルテスト`, () => {
    test('総合チェック', async ({ page }) => {
      await page.goto(pageInfo.url);

      const screenshotPath = path.join(
        __dirname,
        `../screenshots/${pageInfo.name}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // 1. アクセシビリティチェック
      const axeResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      const accessibilityPassed = axeResults.violations.filter(
        v => v.impact === 'critical' || v.impact === 'serious'
      ).length === 0;

      // 2. タップ領域チェック
      const MIN_TAP_SIZE = 44;
      const buttons = await page.locator('button, a, [role="button"]').all();
      const tapViolations: string[] = [];

      for (const btn of buttons) {
        const box = await btn.boundingBox();
        if (box && (box.width < MIN_TAP_SIZE || box.height < MIN_TAP_SIZE)) {
          tapViolations.push(`サイズ不足: ${box.width}x${box.height}`);
        }
      }

      // 3. AI品質チェック
      const aiResult = await checkVisualQuality(screenshotPath, {
        pageName: pageInfo.name,
        pageDescription: pageInfo.description,
      });

      // 結果を記録
      results.push({
        pageName: pageInfo.name,
        timestamp: new Date().toISOString(),
        screenshotPath,
        ruleBasedChecks: {
          accessibility: {
            passed: accessibilityPassed,
            violations: axeResults.violations.map(v => v.description),
          },
          tapTargets: {
            passed: tapViolations.length === 0,
            violations: tapViolations,
          },
          contrast: { passed: true, violations: [] },
        },
        aiCheck: aiResult,
      });

      // アサーション
      expect(accessibilityPassed).toBe(true);
      expect(tapViolations).toHaveLength(0);
      expect(aiResult.severity).not.toBe('critical');
    });
  });
}

test.afterAll(() => {
  // レポート生成
  const reportPath = generateReport(results);
  console.log(`レポート生成: ${reportPath}`);
});
```

## 実行コマンド

```bash
# ビジュアルテストのみ実行
npx playwright test visual

# 特定ページのビジュアルテスト
npx playwright test visual -g "ホームページ"

# レポート付きで実行
npx playwright test visual --reporter=html

# スクリーンショット更新
npx playwright test visual --update-snapshots
```
