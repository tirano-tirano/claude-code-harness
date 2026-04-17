# テストデータ管理ガイド

テストデータの生成・管理・クリーンアップのベストプラクティスをまとめたドキュメント。

## テストデータ管理の原則

### 1. テストの独立性

各テストは他のテストに依存せず、独立して実行できるべき。

```typescript
// ❌ 悪い例: テスト間で状態を共有
let userId: string;

it('ユーザーを作成', async () => {
  const user = await createUser();
  userId = user.id; // 次のテストで使う
});

it('ユーザーを取得', async () => {
  const user = await getUser(userId); // 前のテストに依存
  expect(user).toBeDefined();
});

// ✅ 良い例: 各テストが独立
it('ユーザーを作成して取得', async () => {
  const user = await createUser();
  const fetched = await getUser(user.id);
  expect(fetched).toEqual(user);
});
```

### 2. テストデータの再現性

同じテストを何度実行しても同じ結果になるべき。

```typescript
// ❌ 悪い例: ランダムなデータ
it('ユーザー名のバリデーション', () => {
  const name = Math.random().toString(); // 毎回異なる
  expect(validateName(name)).toBe(true); // 結果が不安定
});

// ✅ 良い例: 固定のテストデータ
it('ユーザー名のバリデーション', () => {
  const name = 'TestUser123';
  expect(validateName(name)).toBe(true);
});

// ✅ または: シードを固定したランダム
import { faker } from '@faker-js/faker';
faker.seed(12345);

it('ユーザー名のバリデーション', () => {
  const name = faker.person.firstName(); // シード固定で再現可能
  expect(validateName(name)).toBe(true);
});
```

### 3. テストデータの隔離

テストデータは本番データと完全に分離する。

```typescript
// テスト用の識別子を付ける
const TEST_EMAIL_SUFFIX = '@test.example.com';

function createTestUser(overrides = {}) {
  return {
    email: `test-${Date.now()}${TEST_EMAIL_SUFFIX}`,
    name: 'Test User',
    ...overrides,
  };
}

// クリーンアップ時にテストデータのみ削除
async function cleanupTestData() {
  await db.user.deleteMany({
    where: { email: { endsWith: TEST_EMAIL_SUFFIX } },
  });
}
```

## ファクトリーパターン

### 基本的なファクトリー

```typescript
// __tests__/factories/userFactory.ts
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

// デフォルト値を持つファクトリー
export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'user',
    createdAt: new Date(),
    ...overrides,
  };
}

// DBに保存するファクトリー
export async function createUser(overrides: Partial<User> = {}): Promise<User> {
  const userData = buildUser(overrides);
  return await db.user.create({ data: userData });
}

// 複数作成
export async function createUsers(count: number, overrides: Partial<User> = {}): Promise<User[]> {
  const users: User[] = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser(overrides));
  }
  return users;
}
```

### 関連データを持つファクトリー

```typescript
// __tests__/factories/postFactory.ts
import { buildUser, createUser } from './userFactory';

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author?: User;
}

export function buildPost(overrides: Partial<Post> = {}): Post {
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(3),
    authorId: overrides.authorId || faker.string.uuid(),
    ...overrides,
  };
}

// 著者も一緒に作成
export async function createPostWithAuthor(
  postOverrides: Partial<Post> = {},
  userOverrides: Partial<User> = {}
): Promise<Post & { author: User }> {
  const author = await createUser(userOverrides);
  const post = await db.post.create({
    data: {
      ...buildPost(postOverrides),
      authorId: author.id,
    },
    include: { author: true },
  });
  return post;
}
```

### トレイト（特性）を持つファクトリー

```typescript
// __tests__/factories/userFactory.ts

// トレイトの定義
const traits = {
  admin: { role: 'admin' as const },
  verified: { emailVerifiedAt: new Date() },
  unverified: { emailVerifiedAt: null },
  withAvatar: { avatarUrl: faker.image.avatar() },
  deleted: { deletedAt: new Date() },
};

export function buildUser(
  overrides: Partial<User> = {},
  ...traitNames: (keyof typeof traits)[]
): User {
  // トレイトを適用
  const traitOverrides = traitNames.reduce(
    (acc, name) => ({ ...acc, ...traits[name] }),
    {}
  );

  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    role: 'user',
    emailVerifiedAt: null,
    avatarUrl: null,
    deletedAt: null,
    createdAt: new Date(),
    ...traitOverrides,
    ...overrides, // 明示的な上書きが最優先
  };
}

// 使用例
const adminUser = buildUser({}, 'admin', 'verified');
const deletedUser = buildUser({ name: 'Deleted User' }, 'deleted');
```

## フィクスチャー（固定テストデータ）

### JSONフィクスチャー

```typescript
// __tests__/fixtures/users.json
[
  {
    "id": "user-1",
    "name": "Alice",
    "email": "alice@test.example.com",
    "role": "admin"
  },
  {
    "id": "user-2",
    "name": "Bob",
    "email": "bob@test.example.com",
    "role": "user"
  }
]
```

```typescript
// __tests__/fixtures/index.ts
import users from './users.json';
import posts from './posts.json';

export const fixtures = {
  users,
  posts,
};

export async function loadFixtures() {
  await db.user.createMany({ data: fixtures.users });
  await db.post.createMany({ data: fixtures.posts });
}

export async function clearFixtures() {
  await db.post.deleteMany({});
  await db.user.deleteMany({});
}
```

### 使用例

```typescript
import { fixtures, loadFixtures, clearFixtures } from '@/tests/fixtures';

describe('UserList', () => {
  beforeEach(async () => {
    await loadFixtures();
  });

  afterEach(async () => {
    await clearFixtures();
  });

  it('すべてのユーザーが表示される', async () => {
    render(<UserList />);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('管理者ユーザーにはバッジが表示される', async () => {
    render(<UserList />);

    await waitFor(() => {
      const aliceRow = screen.getByText('Alice').closest('tr');
      expect(aliceRow).toContainElement(screen.getByText('Admin'));
    });
  });
});
```

## シードデータ

### シードスクリプト

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  // 既存データをクリア
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});

  // 管理者ユーザー
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@test.example.com',
      role: 'admin',
    },
  });

  // 一般ユーザー
  const users = await Promise.all(
    Array.from({ length: 10 }).map((_, i) =>
      prisma.user.create({
        data: {
          id: `user-${i + 1}`,
          name: faker.person.fullName(),
          email: `user${i + 1}@test.example.com`,
          role: 'user',
        },
      })
    )
  );

  // 投稿
  for (const user of users) {
    await prisma.post.createMany({
      data: Array.from({ length: 3 }).map(() => ({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        authorId: user.id,
      })),
    });
  }

  console.log('Seed data created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

```json
// package.json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

```bash
# シード実行
npx prisma db seed
```

## テストデータのクリーンアップ

### トランザクションロールバック

```typescript
// vitest.setup.ts
import { prisma } from '@/lib/prisma';

beforeEach(async () => {
  // トランザクション開始
  await prisma.$executeRaw`BEGIN`;
});

afterEach(async () => {
  // ロールバック（変更を破棄）
  await prisma.$executeRaw`ROLLBACK`;
});
```

### テーブルのトランケート

```typescript
// __tests__/helpers/cleanup.ts
import { prisma } from '@/lib/prisma';

export async function cleanupDatabase() {
  // 外部キー制約を考慮した順序で削除
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  await prisma.user.deleteMany({});
}

// または、すべてのテーブルをトランケート
export async function truncateAllTables() {
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;

  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "public"."${tablename}" CASCADE;`
      );
    }
  }
}
```

### テスト後のクリーンアップ

```typescript
describe('UserService', () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    // このテストで作成したデータのみ削除
    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
      createdUserIds.length = 0;
    }
  });

  it('ユーザーを作成できる', async () => {
    const user = await createUser({ name: 'Test' });
    createdUserIds.push(user.id); // 削除対象として記録

    expect(user.name).toBe('Test');
  });
});
```

## テストデータビルダー

### ビルダーパターン

```typescript
// __tests__/builders/UserBuilder.ts
import { faker } from '@faker-js/faker';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export class UserBuilder {
  private user: User;

  constructor() {
    this.user = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'user',
      createdAt: new Date(),
    };
  }

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withName(name: string): this {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  asAdmin(): this {
    this.user.role = 'admin';
    return this;
  }

  createdDaysAgo(days: number): this {
    const date = new Date();
    date.setDate(date.getDate() - days);
    this.user.createdAt = date;
    return this;
  }

  build(): User {
    return { ...this.user };
  }

  async create(): Promise<User> {
    return await db.user.create({ data: this.user });
  }
}

// 使用例
const user = new UserBuilder()
  .withName('Test User')
  .asAdmin()
  .createdDaysAgo(30)
  .build();

const savedUser = await new UserBuilder()
  .withEmail('custom@example.com')
  .create();
```

## モックデータ生成

### Faker.jsの活用

```typescript
import { faker } from '@faker-js/faker/locale/ja';

// 日本語データの生成
const user = {
  name: faker.person.fullName(), // 山田 太郎
  email: faker.internet.email(), // yamada.taro@example.com
  phone: faker.phone.number(), // 090-1234-5678
  address: {
    prefecture: faker.location.state(), // 東京都
    city: faker.location.city(), // 渋谷区
    street: faker.location.streetAddress(), // 渋谷1-2-3
  },
};

// 一貫したデータ生成（シード固定）
faker.seed(12345);
const consistentUser1 = faker.person.fullName(); // 常に同じ名前
const consistentUser2 = faker.person.fullName(); // 常に同じ名前
```

### カスタムデータ生成

```typescript
// __tests__/helpers/generators.ts
import { faker } from '@faker-js/faker';

export function generateEmail(domain = 'test.example.com'): string {
  const timestamp = Date.now();
  const random = faker.string.alphanumeric(6);
  return `test-${timestamp}-${random}@${domain}`;
}

export function generatePhoneNumber(): string {
  const area = faker.helpers.arrayElement(['03', '06', '052', '011']);
  const num1 = faker.string.numeric(4);
  const num2 = faker.string.numeric(4);
  return `${area}-${num1}-${num2}`;
}

export function generateCreditCard(): {
  number: string;
  expiry: string;
  cvv: string;
} {
  return {
    number: '4242424242424242', // テスト用カード番号
    expiry: '12/25',
    cvv: '123',
  };
}
```

## テストデータ管理のチェックリスト

### 設計
- [ ] テストが独立している
- [ ] データが再現可能
- [ ] 本番データと分離されている

### 実装
- [ ] ファクトリーパターンを使用
- [ ] フィクスチャーを適切に管理
- [ ] シードスクリプトがある

### クリーンアップ
- [ ] 各テスト後にデータをクリーンアップ
- [ ] トランザクションロールバックの検討
- [ ] テストデータの識別子がある

### パフォーマンス
- [ ] 必要最小限のデータを作成
- [ ] 並列実行時の競合を考慮
- [ ] セットアップの共有を検討
