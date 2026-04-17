# 環境確認・設定ガイド（Phase 0）

**テストを書き始める前に、必ずこのフェーズを完了すること。**

## なぜPhase 0が必要か

```
環境が整っていない状態でテストを書くと...

❌ テストが実行できない
❌ モックだらけの意味のないテストになる
❌ 後から環境を整えても、テストの書き直しが必要

環境を整えてからテストを書くと...

✅ 実際のDB・APIを使ったテストが書ける
✅ E2Eテストが正しく動作する
✅ テストの信頼性が高い
```

## 確認チェックリスト

### 1. テストツールのインストール

```bash
# 単体テスト・統合テスト用
npm install -D vitest @vitejs/plugin-react
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event

# E2Eテスト用
npm install -D playwright @playwright/test
npx playwright install  # ブラウザのインストール

# APIモック用（必要な場合のみ）
npm install -D msw
```

**確認方法:**
```bash
npx vitest --version
npx playwright --version
```

### 2. テストDBの準備

#### Supabaseの場合

**本番DBとは別にテスト用DBを用意する。**

選択肢A: ローカルSupabase（推奨）
```bash
# Supabase CLIのインストール
npm install -D supabase

# ローカルSupabaseの起動
npx supabase start

# 出力されるURLとキーを.env.testに設定
```

選択肢B: Supabaseの別プロジェクト
1. Supabaseダッシュボードで新規プロジェクト作成（テスト用）
2. 接続情報を`.env.test`に設定

#### Prismaの場合

```bash
# テスト用DBへのマイグレーション
DATABASE_URL="postgresql://..." npx prisma db push

# シードデータの投入
npm run db:seed:test
```

### 3. 環境変数の設定

`.env.test` ファイルを作成：

```bash
# テストDB（本番とは別）
DATABASE_URL="postgresql://localhost:54322/postgres"
DIRECT_URL="postgresql://localhost:54322/postgres"

# Supabase（ローカル）
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# 外部API（テスト用キー）
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# ストレージ（テスト用バケット）
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="test-bucket"

# その他
NEXTAUTH_SECRET="test-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. 外部サービスの設定

#### OAuth（Google/GitHub等）

**テストユーザーの追加が必要:**

1. Google Cloud Console → APIs & Services → OAuth consent screen
2. 「Test users」セクションでテスト用メールアドレスを追加
3. テスト用の認証情報を`.env.test`に設定

#### 外部API

| サービス | テスト方法 |
|---------|-----------|
| OpenAI | テスト用APIキーを使用 |
| Stripe | テストモード（`sk_test_...`）を使用 |
| SendGrid | サンドボックスモードを使用 |

#### ストレージ（S3/R2/GCS）

1. テスト用バケットを作成
2. テスト後にクリーンアップするスクリプトを用意

### 5. 設定ファイルの準備

#### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // テスト用環境変数を読み込む
    env: {
      ...require('dotenv').config({ path: '.env.test' }).parsed,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// テスト用環境変数を読み込む
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## 環境確認の実行

すべての設定が完了したら、以下を実行して確認：

```bash
# 単体テストの実行確認
npm run test -- --run

# E2Eテストの実行確認
npm run test:e2e

# DBへの接続確認
npx prisma db pull  # または npx supabase status
```

## 不足がある場合のユーザーへの案内テンプレート

```markdown
## テスト実行に必要な設定

テストを開始する前に、以下の設定が必要です。

### 現在の状況

| 項目 | 状態 | 対応 |
|------|------|------|
| テストツール | ✅ インストール済み | - |
| テストDB | ❌ 未設定 | 下記手順1を実施 |
| 環境変数 | ⚠️ 一部不足 | 下記手順2を実施 |
| 外部API | ❌ 未設定 | 下記手順3を実施 |

### 手順1: テストDBのセットアップ

ローカルSupabaseを起動してください：

```bash
npx supabase start
```

出力されるURLとキーをメモしてください。

### 手順2: 環境変数の設定

`.env.test` ファイルを作成し、以下を設定してください：

```bash
# 手順1で取得した値を設定
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[出力されたキー]"
```

### 手順3: 外部APIの設定

AI機能のテストには以下のAPIキーが必要です：

| 変数名 | 取得方法 |
|--------|----------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys |

---

上記の設定が完了したらお知らせください。
設定を確認後、テストを開始します。
```

## よくある問題と解決策

### 問題1: DBに接続できない

```
Error: Connection refused
```

**解決策:**
- ローカルSupabaseが起動しているか確認: `npx supabase status`
- DATABASE_URLが正しいか確認
- ファイアウォールの設定を確認

### 問題2: 環境変数が読み込まれない

```
Error: NEXT_PUBLIC_SUPABASE_URL is not defined
```

**解決策:**
- `.env.test`ファイルが存在するか確認
- vitest.config.tsで`.env.test`を読み込んでいるか確認
- 変数名のタイポを確認

### 問題3: Playwrightブラウザがない

```
Error: Executable doesn't exist
```

**解決策:**
```bash
npx playwright install
```

### 問題4: OAuthテストユーザーエラー

```
Error: Access blocked: This app's request is invalid
```

**解決策:**
- Google Cloud Consoleでテストユーザーを追加
- OAuth同意画面の設定を確認

## Phase 0 完了の確認

以下がすべて✅になったら、Phase 1に進む：

- [ ] `npm run test -- --run` が成功する
- [ ] `npm run test:e2e` が成功する（最低1件のサンプルテスト）
- [ ] テストDBに接続できる
- [ ] 必要な環境変数がすべて設定されている
- [ ] 外部サービスの認証情報が設定されている（または、テスト不可の機能を明確にした）
