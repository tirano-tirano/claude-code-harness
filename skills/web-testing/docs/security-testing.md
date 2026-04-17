# セキュリティテストガイド

Webアプリケーションのセキュリティを検証・強化するためのガイドドキュメント。

## セキュリティテストの目的

### なぜセキュリティテストが重要か

- **データ保護**: ユーザー情報の漏洩を防ぐ
- **信頼性**: サービスの信頼を維持する
- **法的リスク**: 個人情報保護法違反を避ける
- **ビジネス継続性**: サービス停止を防ぐ

### 主なセキュリティリスク

| リスク | 説明 | 影響度 |
|--------|------|--------|
| XSS (Cross-Site Scripting) | 悪意のあるスクリプト注入 | 高 |
| CSRF (Cross-Site Request Forgery) | 不正なリクエスト送信 | 高 |
| SQLインジェクション | DBへの不正アクセス | 致命的 |
| 認証・認可の不備 | 権限のない操作が可能 | 致命的 |
| 機密情報の漏洩 | API キー、パスワードの露出 | 致命的 |

## 認証・認可のテスト

### 認証バイパスのテスト

```typescript
// e2e/tests/security/auth-bypass.spec.ts
import { test, expect } from '@playwright/test';

test.describe('認証バイパス', () => {
  // 未認証状態でのテスト
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/settings',
    '/admin',
    '/api/users',
    '/api/admin/settings',
  ];

  for (const route of protectedRoutes) {
    test(`${route} は認証なしでアクセスできない`, async ({ page, request }) => {
      if (route.startsWith('/api')) {
        // APIエンドポイント
        const response = await request.get(route);
        expect(response.status()).toBe(401);
      } else {
        // ページ
        await page.goto(route);
        // ログインページにリダイレクトされる
        await expect(page).toHaveURL(/\/login/);
      }
    });
  }

  test('期限切れトークンでアクセスできない', async ({ request }) => {
    const response = await request.get('/api/users', {
      headers: {
        Authorization: 'Bearer expired_token_12345',
      },
    });

    expect(response.status()).toBe(401);
  });

  test('不正なトークン形式は拒否される', async ({ request }) => {
    const invalidTokens = [
      'invalid',
      'Bearer ',
      'Bearer null',
      'Bearer undefined',
      'Basic dXNlcjpwYXNz',
    ];

    for (const token of invalidTokens) {
      const response = await request.get('/api/users', {
        headers: { Authorization: token },
      });
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});
```

### 権限チェックのテスト

```typescript
// e2e/tests/security/authorization.spec.ts
import { test, expect } from '@playwright/test';

test.describe('権限チェック', () => {
  test.describe('一般ユーザーの制限', () => {
    test.use({ storageState: 'e2e/.auth/user.json' });

    test('管理者APIにアクセスできない', async ({ request }) => {
      const adminEndpoints = [
        { method: 'GET', path: '/api/admin/users' },
        { method: 'POST', path: '/api/admin/settings' },
        { method: 'DELETE', path: '/api/admin/users/1' },
      ];

      for (const endpoint of adminEndpoints) {
        const response = await request.fetch(endpoint.path, {
          method: endpoint.method,
        });
        expect(response.status()).toBe(403);
      }
    });

    test('他のユーザーのデータを取得できない', async ({ request }) => {
      // 自分以外のユーザーID
      const response = await request.get('/api/users/other-user-id');
      expect(response.status()).toBe(403);
    });

    test('他のユーザーのデータを更新できない', async ({ request }) => {
      const response = await request.put('/api/users/other-user-id', {
        data: { name: 'Hacked Name' },
      });
      expect(response.status()).toBe(403);
    });
  });

  test.describe('管理者の権限', () => {
    test.use({ storageState: 'e2e/.auth/admin.json' });

    test('管理者APIにアクセスできる', async ({ request }) => {
      const response = await request.get('/api/admin/users');
      expect(response.status()).toBe(200);
    });
  });
});
```

### セッション管理のテスト

```typescript
// e2e/tests/security/session.spec.ts
import { test, expect } from '@playwright/test';

test.describe('セッション管理', () => {
  test('ログアウト後にセッションが無効化される', async ({ page, context }) => {
    // ログイン
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();
    await expect(page).toHaveURL('/dashboard');

    // セッションCookieを取得
    const cookies = await context.cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));

    // ログアウト
    await page.getByRole('button', { name: 'ログアウト' }).click();
    await expect(page).toHaveURL('/login');

    // 古いセッションCookieでアクセス
    if (sessionCookie) {
      await context.addCookies([sessionCookie]);
      await page.goto('/dashboard');
      // ログインページにリダイレクトされる
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('同時セッション制限', async ({ browser }) => {
    // 1つ目のセッション
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await page1.goto('/login');
    await page1.getByLabel('メールアドレス').fill('test@example.com');
    await page1.getByLabel('パスワード').fill('password123');
    await page1.getByRole('button', { name: 'ログイン' }).click();

    // 2つ目のセッション（同じユーザー）
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await page2.goto('/login');
    await page2.getByLabel('メールアドレス').fill('test@example.com');
    await page2.getByLabel('パスワード').fill('password123');
    await page2.getByRole('button', { name: 'ログイン' }).click();

    // 1つ目のセッションが無効化される（実装による）
    await page1.reload();
    // ログインページにリダイレクトされる or 警告が表示される

    await context1.close();
    await context2.close();
  });
});
```

## XSS（クロスサイトスクリプティング）対策テスト

### 入力フィールドのXSSテスト

```typescript
// e2e/tests/security/xss.spec.ts
import { test, expect } from '@playwright/test';

test.describe('XSS対策', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '"><script>alert("XSS")</script>',
    "javascript:alert('XSS')",
    '<svg onload=alert("XSS")>',
    '{{constructor.constructor("alert(1)")()}}',
  ];

  test('検索フォームでXSSが実行されない', async ({ page }) => {
    await page.goto('/search');

    for (const payload of xssPayloads) {
      await page.getByRole('searchbox').fill(payload);
      await page.getByRole('button', { name: '検索' }).click();

      // アラートが表示されないことを確認
      page.on('dialog', async (dialog) => {
        expect(dialog.type()).not.toBe('alert');
        await dialog.dismiss();
      });

      // ペイロードがエスケープされて表示されることを確認
      const content = await page.content();
      expect(content).not.toContain('<script>alert');
    }
  });

  test('ユーザー入力が安全にレンダリングされる', async ({ page }) => {
    await page.goto('/profile/edit');

    // 悪意のある入力を保存
    await page.getByLabel('自己紹介').fill('<script>alert("XSS")</script>');
    await page.getByRole('button', { name: '保存' }).click();

    // プロフィールページで確認
    await page.goto('/profile');

    // スクリプトタグがエスケープされている
    const content = await page.content();
    expect(content).toContain('&lt;script&gt;');
    expect(content).not.toContain('<script>alert');
  });

  test('URLパラメータでXSSが実行されない', async ({ page }) => {
    const xssUrl = '/search?q=<script>alert("XSS")</script>';
    await page.goto(xssUrl);

    // アラートが表示されないことを確認
    const dialogPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
    const dialog = await dialogPromise;
    expect(dialog).toBeNull();
  });
});
```

### Content Security Policy (CSP) のテスト

```typescript
// e2e/tests/security/csp.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Content Security Policy', () => {
  test('CSPヘッダーが設定されている', async ({ page }) => {
    const response = await page.goto('/');
    const csp = response?.headers()['content-security-policy'];

    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
    expect(csp).not.toContain("'unsafe-inline'"); // インラインスクリプト禁止
    expect(csp).not.toContain("'unsafe-eval'");   // eval禁止
  });

  test('外部スクリプトがブロックされる', async ({ page }) => {
    await page.goto('/');

    // 外部スクリプトの注入を試みる
    const blocked = await page.evaluate(() => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://evil.com/malicious.js';
        script.onerror = () => resolve(true);  // ブロックされた
        script.onload = () => resolve(false);  // 読み込まれた（問題）
        document.head.appendChild(script);

        // タイムアウト
        setTimeout(() => resolve(true), 2000);
      });
    });

    expect(blocked).toBe(true);
  });
});
```

## CSRF（クロスサイトリクエストフォージェリ）対策テスト

```typescript
// e2e/tests/security/csrf.spec.ts
import { test, expect } from '@playwright/test';

test.describe('CSRF対策', () => {
  test('CSRFトークンなしのリクエストは拒否される', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { name: 'New User' },
      headers: {
        'Content-Type': 'application/json',
        // CSRFトークンなし
      },
    });

    expect(response.status()).toBe(403);
  });

  test('無効なCSRFトークンは拒否される', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { name: 'New User' },
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'invalid_token',
      },
    });

    expect(response.status()).toBe(403);
  });

  test('SameSite Cookieが設定されている', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');
    await page.getByRole('button', { name: 'ログイン' }).click();

    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(c => c.name.includes('session'));

    expect(sessionCookie?.sameSite).toBe('Strict');
    // または 'Lax'
  });
});
```

## セキュリティヘッダーのテスト

```typescript
// e2e/tests/security/headers.spec.ts
import { test, expect } from '@playwright/test';

test.describe('セキュリティヘッダー', () => {
  test('必要なセキュリティヘッダーが設定されている', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // X-Content-Type-Options
    expect(headers?.['x-content-type-options']).toBe('nosniff');

    // X-Frame-Options
    expect(headers?.['x-frame-options']).toMatch(/DENY|SAMEORIGIN/);

    // X-XSS-Protection
    expect(headers?.['x-xss-protection']).toBe('1; mode=block');

    // Strict-Transport-Security (HTTPS環境のみ)
    if (process.env.NODE_ENV === 'production') {
      expect(headers?.['strict-transport-security']).toBeDefined();
    }

    // Referrer-Policy
    expect(headers?.['referrer-policy']).toBeDefined();
  });

  test('機密情報がレスポンスヘッダーに含まれていない', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers();

    // サーバー情報の露出を防ぐ
    expect(headers?.['server']).not.toContain('Apache');
    expect(headers?.['server']).not.toContain('nginx');
    expect(headers?.['x-powered-by']).toBeUndefined();
  });
});
```

## 入力バリデーションのテスト

```typescript
// e2e/tests/security/validation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('入力バリデーション', () => {
  test('SQLインジェクションが防止される', async ({ request }) => {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "1; SELECT * FROM users",
      "UNION SELECT * FROM users",
    ];

    for (const payload of sqlPayloads) {
      const response = await request.get(`/api/users?search=${encodeURIComponent(payload)}`);

      // エラーにならずに空の結果を返す（SQLが実行されていない）
      expect(response.status()).toBeLessThan(500);

      const body = await response.json();
      expect(body.error).toBeUndefined();
    }
  });

  test('パストラバーサルが防止される', async ({ request }) => {
    const pathPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '%2e%2e%2f%2e%2e%2f',
    ];

    for (const payload of pathPayloads) {
      const response = await request.get(`/api/files/${encodeURIComponent(payload)}`);
      expect(response.status()).toBe(400);
    }
  });

  test('大きすぎるリクエストが拒否される', async ({ request }) => {
    const largeData = 'a'.repeat(10 * 1024 * 1024); // 10MB

    const response = await request.post('/api/upload', {
      data: { content: largeData },
    });

    expect(response.status()).toBe(413); // Payload Too Large
  });

  test('不正なファイルタイプがアップロードできない', async ({ page }) => {
    await page.goto('/upload');

    // 実行可能ファイルのアップロードを試みる
    await page.setInputFiles('input[type="file"]', {
      name: 'malicious.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ'), // EXEのマジックバイト
    });

    await page.getByRole('button', { name: 'アップロード' }).click();

    await expect(page.getByText('許可されていないファイル形式')).toBeVisible();
  });
});
```

## 環境変数・機密情報の漏洩チェック

```typescript
// e2e/tests/security/secrets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('機密情報の漏洩チェック', () => {
  test('ソースコードに機密情報が含まれていない', async ({ page }) => {
    await page.goto('/');

    // ページのHTMLを取得
    const html = await page.content();

    // 機密情報のパターン
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{32,}/,           // OpenAI APIキー
      /ghp_[a-zA-Z0-9]{36}/,           // GitHub Personal Access Token
      /AKIA[A-Z0-9]{16}/,              // AWS Access Key
      /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,
      /password\s*[=:]\s*['"][^'"]+['"]/i,
      /api[_-]?key\s*[=:]\s*['"][^'"]+['"]/i,
      /secret[_-]?key\s*[=:]\s*['"][^'"]+['"]/i,
    ];

    for (const pattern of secretPatterns) {
      expect(html).not.toMatch(pattern);
    }
  });

  test('APIレスポンスに機密情報が含まれていない', async ({ request }) => {
    const response = await request.get('/api/users/me');
    const body = await response.json();
    const bodyString = JSON.stringify(body);

    // パスワードハッシュが含まれていない
    expect(bodyString).not.toMatch(/password/i);
    expect(bodyString).not.toMatch(/\$2[aby]\$\d+\$/); // bcryptハッシュ

    // 内部IDが露出していない（実装による）
    // expect(body._id).toBeUndefined();
  });

  test('エラーレスポンスにスタックトレースが含まれていない', async ({ request }) => {
    // 意図的にエラーを発生させる
    const response = await request.get('/api/error-test');

    if (response.status() >= 500) {
      const body = await response.text();

      expect(body).not.toContain('at ');
      expect(body).not.toContain('.js:');
      expect(body).not.toContain('node_modules');
      expect(body).not.toContain('Error:');
    }
  });

  test('robots.txtで機密パスが除外されている', async ({ request }) => {
    const response = await request.get('/robots.txt');
    const content = await response.text();

    // 管理画面などが除外されている
    expect(content).toContain('Disallow: /admin');
    expect(content).toContain('Disallow: /api');
  });
});
```

## 依存パッケージの脆弱性チェック

```bash
# npm audit
npm audit

# 自動修正
npm audit fix

# 詳細レポート
npm audit --json > audit-report.json
```

### CI/CDでの自動チェック

```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # 毎日実行

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: npm ci
      - run: npm audit --audit-level=high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v2
        with:
          languages: javascript
      - uses: github/codeql-action/autobuild@v2
      - uses: github/codeql-action/analyze@v2
```

## セキュリティチェックリスト

### 認証・認可
- [ ] 保護されたルートにアクセス制御がある
- [ ] トークンの有効期限が設定されている
- [ ] ログアウト時にセッションが無効化される
- [ ] 権限チェックがサーバーサイドで行われている

### 入力処理
- [ ] すべての入力がバリデーションされている
- [ ] SQLインジェクション対策がある
- [ ] XSS対策がある（エスケープ処理）
- [ ] ファイルアップロードの制限がある

### 通信
- [ ] HTTPS が強制されている
- [ ] セキュリティヘッダーが設定されている
- [ ] CORS が適切に設定されている
- [ ] CSRFトークンが使用されている

### データ保護
- [ ] 機密情報が暗号化されている
- [ ] パスワードがハッシュ化されている
- [ ] ログに機密情報が記録されていない
- [ ] エラーメッセージに内部情報が含まれていない

### 依存関係
- [ ] npm audit で脆弱性がない
- [ ] 依存パッケージが定期的に更新されている
- [ ] 不要な依存関係が削除されている
