/**
 * E2Eテスト（受け入れテスト）テンプレート
 *
 * このテンプレートを使用して、機能のE2Eテストを作成する。
 * ファイル名: [機能名].spec.ts
 *
 * ★重要ポイント:
 * - UIの結果だけでなく、DBの変更も確認する
 * - 正常系・異常系・エッジケースを網羅する
 * - try-catchで両方OKにしない
 */

import { test, expect, Page } from '@playwright/test';
// import { db } from '@/lib/db';  // 実DBへのアクセス

// ============================================
// DBアクセスヘルパー（実DBを使用）
// ============================================

// async function dbQuery<T>(fn: (db: typeof prisma) => Promise<T>): Promise<T> {
//   return fn(db);
// }

// async function cleanupTestData() {
//   await db.user.deleteMany({
//     where: { email: { contains: '@test.example.com' } }
//   });
// }

// async function seedTestUser(data: { email: string; password: string }) {
//   return db.user.create({ data });
// }

// ============================================
// ページオブジェクト
// ============================================

class ExamplePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/example');
  }

  // フォーム入力
  async fillEmail(email: string) {
    await this.page.fill('[name="email"]', email);
  }

  async fillPassword(password: string) {
    await this.page.fill('[name="password"]', password);
  }

  async submit() {
    await this.page.click('button[type="submit"]');
  }

  // アサーション
  async expectSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible();
  }
}

// ============================================
// テスト本体
// ============================================

test.describe('機能名: ユーザー登録', () => {
  // テスト前の準備
  test.beforeEach(async ({ page }) => {
    // テストデータのクリーンアップ
    // await cleanupTestData();
  });

  // テスト後のクリーンアップ
  test.afterEach(async () => {
    // await cleanupTestData();
  });

  // ============================================
  // 正常系
  // ============================================

  test.describe('正常系', () => {
    test('有効なデータで登録できる', async ({ page }) => {
      // 1. ページにアクセス
      await page.goto('/register');

      // 2. フォームに入力
      await page.fill('[name="email"]', 'newuser@test.example.com');
      await page.fill('[name="password"]', 'SecurePass123!');

      // 3. 送信
      await page.click('button[type="submit"]');

      // 4. UI上の結果を確認
      await expect(page).toHaveURL('/dashboard');
      await expect(page.getByText('登録完了')).toBeVisible();

      // 5. DBの変更を確認（★重要）
      // const user = await dbQuery(db =>
      //   db.user.findUnique({ where: { email: 'newuser@test.example.com' } })
      // );
      // expect(user).not.toBeNull();
      // expect(user.email).toBe('newuser@test.example.com');
    });
  });

  // ============================================
  // 異常系
  // ============================================

  test.describe('異常系', () => {
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
      // const user = await dbQuery(db =>
      //   db.user.findFirst({ where: { email: 'invalid-email' } })
      // );
      // expect(user).toBeNull();
    });

    test('パスワードが短すぎるとエラー', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[name="email"]', 'test@test.example.com');
      await page.fill('[name="password"]', '123');
      await page.click('button[type="submit"]');

      await expect(page.getByText('パスワードは8文字以上')).toBeVisible();
    });

    test('既存のメールアドレスでエラー', async ({ page }) => {
      // 事前準備: 既存ユーザーを作成
      // await seedTestUser({
      //   email: 'existing@test.example.com',
      //   password: 'hashedPassword',
      // });

      await page.goto('/register');
      await page.fill('[name="email"]', 'existing@test.example.com');
      await page.fill('[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');

      await expect(page.getByText('このメールアドレスは既に使用されています')).toBeVisible();
    });

    test('必須項目が空でエラー', async ({ page }) => {
      await page.goto('/register');
      await page.click('button[type="submit"]');

      await expect(page.getByText('メールアドレスを入力してください')).toBeVisible();
      await expect(page.getByText('パスワードを入力してください')).toBeVisible();
    });
  });

  // ============================================
  // エッジケース
  // ============================================

  test.describe('エッジケース', () => {
    test('パスワードの最小長（8文字）で登録できる', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[name="email"]', 'minpass@test.example.com');
      await page.fill('[name="password"]', 'Abcdefg1');  // ちょうど8文字
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');
    });

    test('特殊文字を含むパスワードで登録できる', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[name="email"]', 'special@test.example.com');
      await page.fill('[name="password"]', 'Pass@#$%123');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL('/dashboard');
    });
  });

  // ============================================
  // セキュリティ
  // ============================================

  test.describe('セキュリティ', () => {
    test('XSSペイロードがエスケープされる', async ({ page }) => {
      await page.goto('/register');
      await page.fill('[name="name"]', '<script>alert("XSS")</script>');
      await page.fill('[name="email"]', 'xss@test.example.com');
      await page.fill('[name="password"]', 'SecurePass123!');
      await page.click('button[type="submit"]');

      // 登録成功後、プロフィールページで確認
      await page.goto('/profile');

      // スクリプトが実行されていないことを確認
      const name = await page.textContent('[data-testid="user-name"]');
      expect(name).not.toContain('<script>');
    });

    test('認証が必要なページに未ログインでアクセスするとリダイレクト', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/login/);
    });
  });

  // ============================================
  // ビジュアル
  // ============================================

  test.describe('ビジュアル', () => {
    test('登録フォームが正しく表示される', async ({ page }) => {
      await page.goto('/register');
      await expect(page).toHaveScreenshot('register-form.png');
    });

    test('エラー状態が正しく表示される', async ({ page }) => {
      await page.goto('/register');
      await page.click('button[type="submit"]');
      await expect(page).toHaveScreenshot('register-form-error.png');
    });

    test('モバイル表示', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/register');
      await expect(page).toHaveScreenshot('register-form-mobile.png');
    });
  });
});

// ============================================
// テスト作成後のチェックリスト
// ============================================

/*
□ 正常系のテストがあるか
□ 異常系のテストがあるか
□ エッジケースのテストがあるか
□ セキュリティのテストがあるか
□ ビジュアルのテストがあるか
□ UI上の結果を確認しているか
□ DBの変更を確認しているか（★重要）
□ テストデータのクリーンアップをしているか
*/
