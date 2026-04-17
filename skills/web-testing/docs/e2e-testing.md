# E2Eテスト（受け入れテスト）ガイド

**E2Eテスト = 受け入れテスト = 「ユーザーがやりたいことができるか」を確認するテスト**

## E2Eテストの目的

```
最も重要な質問: 「ユーザーがやりたいことができるか？」

E2Eテストは、実際のブラウザで操作し、
ユーザーの視点で機能が動作することを確認する。
```

## E2Eテストの特徴

| 特徴 | 説明 |
|------|------|
| **実ブラウザ** | 実際のブラウザで操作する |
| **実DB** | モックではなく実際のDBを使う |
| **ユーザー視点** | ユーザーが行う操作をシミュレート |
| **結果確認** | UI表示 + DB変更を両方確認 |

## Phase 1: E2Eテストの設計

### ユースケースの洗い出し

**各機能について、以下の観点でテストケースを列挙する:**

| 分類 | 説明 | 例 |
|------|------|-----|
| **正常系** | 想定通りの操作 | 有効なデータで登録成功 |
| **異常系** | エラーになるべき操作 | 無効なメールでエラー表示 |
| **エッジケース** | 境界値・特殊な状況 | 最大文字数ちょうどの入力 |
| **準正常系** | エラーだが回復可能 | セッション切れ→再ログイン |

### 設計テンプレート

```markdown
## 機能名: ユーザー登録

### 正常系
- [ ] 有効なメールアドレスとパスワードで登録できる
- [ ] 登録後、ダッシュボードにリダイレクトされる
- [ ] 登録したユーザーでログインできる

### 異常系
- [ ] 無効なメールアドレスでエラーメッセージが表示される
- [ ] パスワードが短すぎるとエラーメッセージが表示される
- [ ] 既存のメールアドレスでエラーメッセージが表示される
- [ ] 必須項目が空だとエラーメッセージが表示される

### エッジケース
- [ ] メールアドレスの最大長で登録できる
- [ ] パスワードの最小長（8文字）で登録できる
- [ ] パスワードの最大長で登録できる
- [ ] 特殊文字を含むパスワードで登録できる

### セキュリティ
- [ ] XSSペイロードがエスケープされる
- [ ] SQLインジェクションが防がれる

### ビジュアル
- [ ] フォームが正しくレイアウトされている
- [ ] エラーメッセージが適切な位置に表示される
- [ ] ローディング状態が表示される
```

## Phase 3: E2Eテストの実装

### 基本構造

```typescript
import { test, expect } from '@playwright/test';
import { db } from '@/lib/db';  // 実DBへのアクセス

test.describe('ユーザー登録', () => {
  // テスト前の準備
  test.beforeEach(async ({ page }) => {
    // テストデータのクリーンアップ
    await db.user.deleteMany({ where: { email: { contains: '@test.example.com' } } });
  });

  // テスト後のクリーンアップ
  test.afterEach(async () => {
    await db.user.deleteMany({ where: { email: { contains: '@test.example.com' } } });
  });

  test('有効なデータで登録できる', async ({ page }) => {
    // 1. ページにアクセス
    await page.goto('/register');

    // 2. フォームに入力
    await page.fill('[name="email"]', 'newuser@test.example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // 3. 送信
    await page.click('button[type="submit"]');

    // 4. UI上の結果を確認
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('登録完了')).toBeVisible();

    // 5. DBの変更を確認（★重要）
    const user = await db.user.findUnique({
      where: { email: 'newuser@test.example.com' }
    });
    expect(user).not.toBeNull();
    expect(user.email).toBe('newuser@test.example.com');
  });
});
```

### 正常系のテスト

```typescript
test('ログインできる', async ({ page }) => {
  // 事前準備: テストユーザーを作成
  await db.user.create({
    data: {
      email: 'existing@test.example.com',
      password: await hash('password123'),
    }
  });

  // 操作
  await page.goto('/login');
  await page.fill('[name="email"]', 'existing@test.example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 結果確認
  await expect(page).toHaveURL('/dashboard');
  await expect(page.getByText('ようこそ')).toBeVisible();

  // セッションが作成されたことを確認
  const cookies = await page.context().cookies();
  const sessionCookie = cookies.find(c => c.name.includes('session'));
  expect(sessionCookie).toBeDefined();
});
```

### 異常系のテスト

```typescript
test('無効なメールアドレスでエラー', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'invalid-email');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  // エラーメッセージを確認
  await expect(page.getByText('有効なメールアドレスを入力してください')).toBeVisible();

  // ページ遷移していないことを確認
  await expect(page).toHaveURL('/register');

  // DBに保存されていないことを確認
  const user = await db.user.findUnique({ where: { email: 'invalid-email' } });
  expect(user).toBeNull();
});

test('パスワードが短すぎるとエラー', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'test@test.example.com');
  await page.fill('[name="password"]', '123');  // 短すぎる
  await page.click('button[type="submit"]');

  await expect(page.getByText('パスワードは8文字以上')).toBeVisible();
});

test('既存のメールアドレスでエラー', async ({ page }) => {
  // 事前準備: 既存ユーザーを作成
  await db.user.create({
    data: { email: 'existing@test.example.com', password: 'hashed' }
  });

  await page.goto('/register');
  await page.fill('[name="email"]', 'existing@test.example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page.getByText('このメールアドレスは既に使用されています')).toBeVisible();
});
```

### エッジケースのテスト

```typescript
test('パスワードの最小長（8文字）で登録できる', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="email"]', 'minpass@test.example.com');
  await page.fill('[name="password"]', '12345678');  // ちょうど8文字
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');

  const user = await db.user.findUnique({ where: { email: 'minpass@test.example.com' } });
  expect(user).not.toBeNull();
});

test('最大文字数の入力で登録できる', async ({ page }) => {
  const maxLengthEmail = 'a'.repeat(64) + '@test.example.com';  // 仕様に応じて調整

  await page.goto('/register');
  await page.fill('[name="email"]', maxLengthEmail);
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});
```

### セキュリティのテスト

```typescript
test('XSSペイロードがエスケープされる', async ({ page }) => {
  await page.goto('/register');
  await page.fill('[name="name"]', '<script>alert("XSS")</script>');
  await page.fill('[name="email"]', 'xss@test.example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.click('button[type="submit"]');

  // 登録成功
  await expect(page).toHaveURL('/dashboard');

  // プロフィールページで確認
  await page.goto('/profile');

  // スクリプトが実行されていないことを確認
  const name = await page.textContent('[data-testid="user-name"]');
  expect(name).not.toContain('<script>');

  // HTMLとしてレンダリングされていないことを確認
  const html = await page.innerHTML('[data-testid="user-name"]');
  expect(html).not.toContain('<script>');
});

test('認証が必要なページに未ログインでアクセスするとリダイレクト', async ({ page }) => {
  await page.goto('/dashboard');

  // ログインページにリダイレクトされる
  await expect(page).toHaveURL(/\/login/);
});

test('他のユーザーのデータにアクセスできない', async ({ page }) => {
  // ユーザーAでログイン
  await loginAs(page, 'userA@test.example.com');

  // ユーザーBのデータにアクセス試行
  await page.goto('/users/userB/settings');

  // アクセス拒否されることを確認
  await expect(page.getByText('アクセス権限がありません')).toBeVisible();
  // または404になる
  // await expect(page).toHaveURL('/404');
});
```

### ビジュアルのテスト

```typescript
test('登録フォームが正しく表示される', async ({ page }) => {
  await page.goto('/register');

  // スクリーンショットを撮影
  await expect(page).toHaveScreenshot('register-form.png');
});

test('エラー状態が正しく表示される', async ({ page }) => {
  await page.goto('/register');
  await page.click('button[type="submit"]');  // 空のまま送信

  // エラー状態のスクリーンショット
  await expect(page).toHaveScreenshot('register-form-error.png');
});

test('レスポンシブ表示（モバイル）', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/register');

  await expect(page).toHaveScreenshot('register-form-mobile.png');
});
```

## DBアクセスのヘルパー関数

E2EテストでDBを直接確認するためのヘルパー:

```typescript
// e2e/helpers/db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function dbQuery<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T> {
  try {
    return await fn(prisma);
  } finally {
    // 接続を維持（テスト間で再利用）
  }
}

export async function cleanupTestData() {
  await prisma.user.deleteMany({
    where: { email: { contains: '@test.example.com' } }
  });
}

export async function seedTestUser(data: { email: string; password: string }) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: await hash(data.password),
    }
  });
}
```

使用例:
```typescript
import { dbQuery, cleanupTestData, seedTestUser } from './helpers/db';

test.beforeEach(async () => {
  await cleanupTestData();
});

test('ユーザー登録', async ({ page }) => {
  // ... 操作 ...

  // DBを確認
  const user = await dbQuery(db => 
    db.user.findUnique({ where: { email: 'test@test.example.com' } })
  );
  expect(user).not.toBeNull();
});
```

## ページオブジェクトパターン

テストの保守性を高めるため、ページオブジェクトを使用:

```typescript
// e2e/pages/RegisterPage.ts
import { Page, expect } from '@playwright/test';

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  async fillEmail(email: string) {
    await this.page.fill('[name="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('[name="password"]', password);
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  async register(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }

  async expectSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

使用例:
```typescript
import { RegisterPage } from './pages/RegisterPage';

test('ユーザー登録', async ({ page }) => {
  const registerPage = new RegisterPage(page);

  await registerPage.goto();
  await registerPage.register('test@example.com', 'SecurePass123!');
  await registerPage.expectSuccess();
});
```

## 認証が必要なテストの書き方

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password = 'password123') {
  await page.goto('/login');
  await page.fill('[name="email"]', email);
  await page.fill('[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

// または、認証状態を保存して再利用
// playwright.config.ts で storageState を設定
```

使用例:
```typescript
test.describe('認証済みユーザー', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'test@test.example.com');
  });

  test('プロフィールを編集できる', async ({ page }) => {
    await page.goto('/profile/edit');
    // ...
  });
});
```

## チェックリスト

### テスト設計時
- [ ] 正常系のユースケースを列挙したか
- [ ] 異常系のユースケースを列挙したか
- [ ] エッジケースを列挙したか
- [ ] セキュリティの確認ポイントを列挙したか
- [ ] ビジュアルの確認ポイントを列挙したか

### テスト実装時
- [ ] 実際のDBを使っているか（モックではない）
- [ ] UI上の結果を確認しているか
- [ ] DBの変更を確認しているか
- [ ] テストデータのクリーンアップをしているか

### テスト実行後
- [ ] 全機能にE2Eテストがあるか
- [ ] 正常系・異常系がカバーされているか
- [ ] テストが安定して動作するか
