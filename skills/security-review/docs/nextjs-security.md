# Next.js（React）固有のセキュリティチェック

SKILL.md の共通チェック項目に加えて、Next.js プロジェクトでは以下を確認する。

---

## Server Action のセキュリティ

Server Action とは、Next.js の機能で、クライアント（ブラウザ）から直接サーバー側の関数を呼び出せる仕組み。
`'use server'` を付けた関数は自動的に HTTP エンドポイントとして公開されるため、セキュリティ対策が必須。

**チェック項目:**
- [ ] Server Action の引数を Zod 等のスキーマでバリデーションしているか
- [ ] Server Action の先頭で認証チェック（セッション確認）をしているか
- [ ] Server Action でリソースアクセス時に認可チェックをしているか
- [ ] Server Action の戻り値に不要な情報を含めていないか
- [ ] `revalidatePath` / `revalidateTag` の前に認証・認可を確認しているか

```typescript
// ❌ 悪い例: バリデーション・認証なし
'use server';
export async function updateProfile(formData: FormData) {
  const name = formData.get('name');
  await db.user.update({ data: { name } });
}

// ✅ 良い例: バリデーション + 認証 + 認可
'use server';
import { z } from 'zod';
import { auth } from '@/lib/auth';

const schema = z.object({ name: z.string().min(1).max(100) });

export async function updateProfile(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const parsed = schema.safeParse({ name: formData.get('name') });
  if (!parsed.success) throw new Error('Invalid input');

  await db.user.update({
    where: { id: session.user.id },  // 自分のデータのみ更新
    data: { name: parsed.data.name },
  });
}
```

---

## Server Component と Client Component の境界

Server Component はサーバーでのみ実行され、Client Component はブラウザで実行される。
この境界を正しく管理しないと、機密データがブラウザに漏洩する。

**チェック項目:**
- [ ] Server Component で取得した機密データを Client Component の props に渡していないか
- [ ] `server-only` パッケージを使って、サーバー専用モジュールのクライアントインポートを防いでいるか
- [ ] React の `taintObjectReference` / `taintUniqueValue`（experimental）で機密オブジェクトの漏洩を防いでいるか（利用可能な場合）

```typescript
// ❌ 悪い例: 機密データを Client Component に渡す
// page.tsx (Server Component)
const user = await db.user.findUnique({ where: { id } });
return <UserProfile user={user} />; // user に password hash 等が含まれている

// ✅ 良い例: 必要なフィールドのみ渡す
const user = await db.user.findUnique({
  where: { id },
  select: { name: true, email: true, avatar: true },
});
return <UserProfile user={user} />;
```

```typescript
// サーバー専用モジュールの保護
// lib/db.ts
import 'server-only';  // Client Component からインポートするとビルドエラー
export const db = new PrismaClient();
```

---

## Middleware のセキュリティ

Next.js の Middleware はリクエストの前処理に使われるが、認証の唯一の防御線にしてはいけない。

**チェック項目:**
- [ ] Middleware だけに認証を頼っていないか（各 Server Action / API Route でも認証チェック）
- [ ] Middleware の `matcher` 設定が意図したパスをすべてカバーしているか
- [ ] Middleware のバイパス脆弱性（CVE-2025-29927 等）への対策をしているか

### CVE-2025-29927 への対応

Next.js v14.2.25 未満 / v15.2.3 未満では、`x-middleware-subrequest` ヘッダーを使って
Middleware をバイパスできる脆弱性が報告されている。

**対策:**
1. Next.js を v14.2.25 以上 / v15.2.3 以上に更新する（推奨）
2. 外部からの `x-middleware-subrequest` ヘッダーをブロックする（WAF やリバースプロキシで）
3. Middleware だけでなく、各エンドポイントでも認証チェックを行う（多層防御）

---

## 環境変数

Next.js では `NEXT_PUBLIC_` プレフィックスが付いた環境変数はビルド時にクライアント JavaScript に埋め込まれる。
つまりブラウザの開発者ツールから誰でも読み取れる。

**チェック項目:**
- [ ] `NEXT_PUBLIC_` 付きの環境変数にシークレット（API キー、DB 接続文字列等）を入れていないか
- [ ] サーバー専用の環境変数に `NEXT_PUBLIC_` を付けていないか
- [ ] `.env.local` が `.gitignore` に含まれているか

```
# ❌ 悪い例: シークレットが NEXT_PUBLIC_ に入っている
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx    # ブラウザから見える！
NEXT_PUBLIC_DATABASE_URL=postgresql://...     # ブラウザから見える！

# ✅ 良い例: シークレットは NEXT_PUBLIC_ なし
STRIPE_SECRET_KEY=sk_live_xxx                # サーバーのみ
DATABASE_URL=postgresql://...                # サーバーのみ
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx  # 公開鍵なので OK
```

---

## エラーハンドリング

Next.js App Router では `error.tsx` と `not-found.tsx` で各ルートのエラーを処理できる。
適切に設定しないと、ユーザーにスタックトレースや内部情報が表示される。

**チェック項目:**
- [ ] `app/error.tsx`（グローバルエラーバウンダリ）が設定されているか
- [ ] `app/not-found.tsx` が設定されているか
- [ ] エラーコンポーネントが `error.message` をそのまま表示していないか（内部情報が漏洩）
- [ ] `app/global-error.tsx`（ルートレイアウトのエラー）を設定しているか
- [ ] 本番環境で `error.digest` のみを表示し、詳細はサーバーログに記録しているか

```typescript
// ❌ 悪い例: エラーメッセージをそのまま表示
'use client';
export default function Error({ error }: { error: Error }) {
  return <div>Error: {error.message}</div>; // 内部情報が漏洩
}

// ✅ 良い例: ユーザーには汎用メッセージ、詳細はログに
'use client';
export default function Error({ error }: { error: Error & { digest?: string } }) {
  // error.message はサーバーログに自動記録される
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <p>しばらく経ってからもう一度お試しください。</p>
      {error.digest && <p>エラーコード: {error.digest}</p>}
    </div>
  );
}
```

---

## HTTP セキュリティヘッダー（next.config.js）

Next.js では `next.config.js` の `headers` で HTTP セキュリティヘッダーを設定する。

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self'",        // unsafe-inline / unsafe-eval を避ける
              "style-src 'self' 'unsafe-inline'", // Tailwind 等で必要な場合
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

**チェック項目:**
- [ ] 上記ヘッダーが `next.config.js` に設定されているか
- [ ] CSP で `unsafe-eval` を使っていないか
- [ ] CSP の `script-src` に不要な外部ドメインを許可していないか

---

## Source Map と本番設定

**チェック項目:**
- [ ] 本番ビルドで Source Map が無効になっているか

```javascript
// next.config.js
const nextConfig = {
  productionBrowserSourceMaps: false,  // デフォルトで false
};
```

---

## API Route のセキュリティ

App Router の `route.ts` ファイルで定義される API Route も Server Action と同様にセキュリティ対策が必要。

**チェック項目:**
- [ ] 各 API Route ハンドラの先頭で認証チェックをしているか
- [ ] リクエストボディをスキーマでバリデーションしているか
- [ ] 適切な HTTP メソッドのみを許可しているか
- [ ] レート制限を検討しているか
- [ ] CORS 設定が適切か

```typescript
// ✅ 良い例: 認証 + バリデーション付き API Route
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({ title: z.string().min(1).max(200) });

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // ... 処理
}
```

---

## Vercel デプロイ設定（Vercel を使う場合）

**チェック項目:**
- [ ] 環境変数が Preview / Production で分離されているか
- [ ] Preview デプロイにアクセス制限（Vercel Authentication）が設定されているか
- [ ] `vercel.json` の `headers` 設定が `next.config.js` と矛盾していないか
- [ ] Vercel Firewall（WAF）の導入を検討したか
- [ ] Edge Functions のタイムアウト設定が適切か

---

## Red Flags（Next.js 固有）

以下を検出したら **即座に指摘** すること:

1. ❌ Server Action の引数をバリデーションしていない
2. ❌ Server Action に認証チェックがない
3. ❌ Middleware だけで認証を制御している（エンドポイント側にチェックなし）
4. ❌ `NEXT_PUBLIC_` 環境変数にシークレットが入っている
5. ❌ `error.tsx` で `error.message` をそのまま表示している
6. ❌ `server-only` を使わずに DB クライアントを公開モジュールに置いている
7. ❌ CSP ヘッダーが未設定
8. ❌ 本番で Source Map が有効

---

## 参考リソース

- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security
- Next.js Authentication: https://nextjs.org/docs/app/building-your-application/authentication
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- CVE-2025-29927: https://github.com/advisories/GHSA-f82v-jh2m-4mm2
