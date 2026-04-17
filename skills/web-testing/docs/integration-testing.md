# 統合テストガイド

**統合テストは、E2Eテストを支える土台。**
**API Route + DB連携が正しく動作することを確認する。**

## 統合テストの位置づけ

```
E2E（受け入れテスト）← ゴール
    │
    │  これが通るためには...
    │
    └─→ 統合テスト ← 今ここ
            │
            │  API + DB連携が正しい
            │
            └─→ 単体テスト
                    │
                    │  個々のロジックが正しい
```

## 統合テストの特徴

| 特徴 | 説明 |
|------|------|
| **実DB** | モックではなく実際のDBを使う（★重要） |
| **API境界** | HTTP リクエスト → レスポンスをテスト |
| **副作用確認** | DBの変更、外部APIの呼び出しを確認 |
| **UIなし** | ブラウザは使わない |

## モックの使い方

**原則: モックは最小限に。実DBを使う。**

| 対象 | モックする？ | 理由 |
|------|-------------|------|
| **DB** | ❌ しない | 実際の動作を確認するため |
| **外部API** | ✅ する | 課金・レート制限・不安定さを避けるため |
| **メール送信** | ✅ する | 実際に送信しないため |
| **ファイルストレージ** | ⚠️ 場合による | テスト用バケットがあれば実際に使う |

```typescript
// ❌ 悪い例：DBをモック
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ id: 1, name: 'Mock User' }),
    }
  }
}));

// ✅ 良い例：実DBを使い、外部APIだけモック
import { db } from '@/lib/db';  // 実DB
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),  // 外部APIはモック
}));
```

## 基本構造

### API Routeのテスト

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET, POST, PUT, DELETE } from '@/app/api/users/route';
import { db } from '@/lib/db';

describe('API: /api/users', () => {
  // テスト前の準備
  beforeEach(async () => {
    // テストデータのクリーンアップ
    await db.user.deleteMany({
      where: { email: { contains: '@test.example.com' } }
    });
  });

  // テスト後のクリーンアップ
  afterEach(async () => {
    await db.user.deleteMany({
      where: { email: { contains: '@test.example.com' } }
    });
  });

  describe('GET /api/users', () => {
    it('ユーザー一覧を取得できる', async () => {
      // 事前準備: テストデータを作成
      await db.user.createMany({
        data: [
          { email: 'user1@test.example.com', name: 'User 1' },
          { email: 'user2@test.example.com', name: 'User 2' },
        ]
      });

      // リクエスト実行
      const request = new Request('http://localhost/api/users');
      const response = await GET(request);
      const body = await response.json();

      // レスポンスを検証
      expect(response.status).toBe(200);
      expect(body).toHaveLength(2);
      expect(body[0]).toMatchObject({
        email: 'user1@test.example.com',
        name: 'User 1',
      });
    });
  });

  describe('POST /api/users', () => {
    it('ユーザーを作成できる', async () => {
      // リクエスト作成
      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newuser@test.example.com',
          name: 'New User',
        }),
      });

      // リクエスト実行
      const response = await POST(request);
      const body = await response.json();

      // レスポンスを検証
      expect(response.status).toBe(201);
      expect(body.id).toBeDefined();
      expect(body.email).toBe('newuser@test.example.com');

      // DBに実際に保存されたか検証（★重要）
      const saved = await db.user.findUnique({
        where: { email: 'newuser@test.example.com' }
      });
      expect(saved).not.toBeNull();
      expect(saved.name).toBe('New User');
    });

    it('無効なメールアドレスでエラー', async () => {
      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          name: 'Test',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toContain('メールアドレス');

      // DBに保存されていないことを確認
      const saved = await db.user.findFirst({
        where: { email: 'invalid-email' }
      });
      expect(saved).toBeNull();
    });

    it('重複するメールアドレスでエラー', async () => {
      // 事前準備: 既存ユーザーを作成
      await db.user.create({
        data: { email: 'existing@test.example.com', name: 'Existing' }
      });

      const request = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@test.example.com',
          name: 'Duplicate',
        }),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(409);
      expect(body.error).toContain('既に使用されています');
    });
  });

  describe('PUT /api/users/[id]', () => {
    it('ユーザーを更新できる', async () => {
      // 事前準備
      const user = await db.user.create({
        data: { email: 'update@test.example.com', name: 'Before' }
      });

      const request = new Request(`http://localhost/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'After' }),
      });

      const response = await PUT(request, { params: { id: user.id } });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.name).toBe('After');

      // DBが更新されたか確認
      const updated = await db.user.findUnique({ where: { id: user.id } });
      expect(updated.name).toBe('After');
    });

    it('存在しないIDで404', async () => {
      const request = new Request('http://localhost/api/users/nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/users/[id]', () => {
    it('ユーザーを削除できる', async () => {
      // 事前準備
      const user = await db.user.create({
        data: { email: 'delete@test.example.com', name: 'ToDelete' }
      });

      const request = new Request(`http://localhost/api/users/${user.id}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: user.id } });

      expect(response.status).toBe(204);

      // DBから削除されたか確認
      const deleted = await db.user.findUnique({ where: { id: user.id } });
      expect(deleted).toBeNull();
    });
  });
});
```

## テストデータ管理

### クリーンアップ戦略

```typescript
// 方法1: beforeEach/afterEach でクリーンアップ
beforeEach(async () => {
  await db.user.deleteMany({ where: { email: { contains: '@test.example.com' } } });
});

// 方法2: トランザクションでロールバック
import { db } from '@/lib/db';

beforeEach(async () => {
  await db.$executeRaw`BEGIN`;
});

afterEach(async () => {
  await db.$executeRaw`ROLLBACK`;
});

// 方法3: テスト用のヘルパー関数
import { cleanupTestData, seedTestData } from '@/test/helpers';

beforeEach(async () => {
  await cleanupTestData();
  await seedTestData();
});
```

### テストデータのシード

```typescript
// test/helpers/seed.ts
import { db } from '@/lib/db';

export async function seedTestData() {
  // テスト用ユーザー
  await db.user.createMany({
    data: [
      { id: 'test-user-1', email: 'user1@test.example.com', name: 'Test User 1' },
      { id: 'test-user-2', email: 'user2@test.example.com', name: 'Test User 2' },
    ]
  });

  // テスト用プロジェクト
  await db.project.createMany({
    data: [
      { id: 'test-project-1', name: 'Test Project', userId: 'test-user-1' },
    ]
  });
}

export async function cleanupTestData() {
  // 外部キー制約を考慮した順序で削除
  await db.project.deleteMany({ where: { id: { startsWith: 'test-' } } });
  await db.user.deleteMany({ where: { id: { startsWith: 'test-' } } });
}
```

## 認証が必要なAPIのテスト

```typescript
import { createMockSession } from '@/test/helpers/auth';

describe('認証が必要なAPI', () => {
  it('認証済みでアクセスできる', async () => {
    // モックセッションを作成
    const session = createMockSession({ userId: 'test-user-1' });

    const request = new Request('http://localhost/api/protected', {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('未認証で401', async () => {
    const request = new Request('http://localhost/api/protected');

    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('他のユーザーのリソースにアクセスで403', async () => {
    const session = createMockSession({ userId: 'test-user-1' });

    // user-2のリソースにアクセス
    const request = new Request('http://localhost/api/users/test-user-2/settings', {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(403);
  });
});
```

## 外部APIのモック

```typescript
import { vi } from 'vitest';
import { sendEmail } from '@/lib/email';

// 外部APIをモック
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

describe('メール送信を含むAPI', () => {
  beforeEach(() => {
    vi.mocked(sendEmail).mockResolvedValue({ success: true, messageId: 'mock-id' });
  });

  it('ユーザー登録時にメールが送信される', async () => {
    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@test.example.com',
        password: 'SecurePass123!',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);

    // メール送信が呼ばれたことを確認
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'newuser@test.example.com',
      subject: expect.stringContaining('確認'),
      body: expect.any(String),
    });
  });

  it('メール送信失敗時のエラーハンドリング', async () => {
    vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP error'));

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newuser@test.example.com',
        password: 'SecurePass123!',
      }),
    });

    const response = await POST(request);

    // ユーザーは作成されるが、メール送信エラーは記録される
    expect(response.status).toBe(201);

    // または、メール送信失敗でエラーにする場合
    // expect(response.status).toBe(500);
  });
});
```

## トランザクションのテスト

```typescript
describe('複数テーブルにまたがる操作', () => {
  it('注文作成時に在庫が減る（トランザクション）', async () => {
    // 事前準備
    const product = await db.product.create({
      data: { name: 'Test Product', stock: 10 }
    });

    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        quantity: 3,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);

    // 注文が作成された
    const order = await db.order.findFirst({
      where: { productId: product.id }
    });
    expect(order).not.toBeNull();
    expect(order.quantity).toBe(3);

    // 在庫が減った
    const updatedProduct = await db.product.findUnique({
      where: { id: product.id }
    });
    expect(updatedProduct.stock).toBe(7);  // 10 - 3
  });

  it('在庫不足時は注文も在庫も変更されない', async () => {
    const product = await db.product.create({
      data: { name: 'Test Product', stock: 2 }
    });

    const request = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        quantity: 5,  // 在庫より多い
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);

    // 注文は作成されていない
    const order = await db.order.findFirst({
      where: { productId: product.id }
    });
    expect(order).toBeNull();

    // 在庫は変わっていない
    const unchangedProduct = await db.product.findUnique({
      where: { id: product.id }
    });
    expect(unchangedProduct.stock).toBe(2);
  });
});
```

## チェックリスト

### テスト実装時
- [ ] 実DBを使っているか（モックしていないか）
- [ ] テストデータのクリーンアップをしているか
- [ ] レスポンスだけでなくDBの変更も確認しているか
- [ ] 正常系・異常系の両方をテストしているか

### テスト設計時
- [ ] 認証が必要なAPIは認証のテストを含めているか
- [ ] バリデーションエラーのテストがあるか
- [ ] 重複・存在チェックのテストがあるか
- [ ] トランザクションが必要な操作は整合性をテストしているか
