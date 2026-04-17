# package.json に追加するスクリプト

以下のスクリプトを `package.json` の `scripts` セクションに追加してください。

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "test:visual": "playwright test --project=chromium visual",
    "test:all": "npm run test:run && npm run test:e2e"
  }
}
```

## スクリプトの説明

| コマンド | 説明 |
|---------|------|
| `npm run test` | Vitest をウォッチモードで実行（ファイル変更で自動再実行） |
| `npm run test:run` | Vitest を1回実行して終了 |
| `npm run test:ui` | Vitest の UI モードで実行（ブラウザで結果確認） |
| `npm run test:coverage` | カバレッジレポート付きで実行 |
| `npm run test:e2e` | Playwright E2E テストを実行 |
| `npm run test:e2e:ui` | Playwright の UI モードで実行（デバッグに便利） |
| `npm run test:e2e:headed` | ブラウザを表示しながら E2E テスト実行 |
| `npm run test:e2e:debug` | デバッグモードで E2E テスト実行 |
| `npm run test:e2e:report` | 前回の E2E テストレポートを表示 |
| `npm run test:visual` | ビジュアルテストのみ実行 |
| `npm run test:all` | 単体テスト + E2E テストを順番に実行 |

## 必要な依存パッケージ

```bash
# Vitest 関連
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom

# Playwright 関連
npm install -D @playwright/test
npm install -D @axe-core/playwright

# カバレッジ
npm install -D @vitest/coverage-v8

# UI モード（オプション）
npm install -D @vitest/ui
```

## ブラウザのインストール

Playwright を使用する前に、ブラウザをインストールしてください：

```bash
npx playwright install
```
