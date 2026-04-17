# React / Next.js 固有のコーディング規約

## React コンポーネント規約

```
✅ 関数コンポーネントのみ使用（class コンポーネントは使わない）
✅ named export を使う（default export は page.tsx 等 Next.js が要求する場合のみ）
✅ Props は type で定義し、コンポーネントと同じファイルに置く
✅ カスタム Hook は use プレフィックスを付ける
✅ コンポーネントファイルは PascalCase（UserProfile.tsx）
✅ Hook・ユーティリティファイルは camelCase（useAuth.ts, formatDate.ts）
```

```typescript
// ❌ 悪い例
export default function Component(props: { name: string; age: number }) { ... }

// ✅ 良い例
type UserCardProps = {
  name: string;
  age: number;
};

export function UserCard({ name, age }: UserCardProps) { ... }
```

## Next.js App Router 規約

```
✅ Server Component をデフォルトにする（'use client' は必要な場合のみ）
✅ 'use client' を付ける基準:
   - useState / useEffect 等の Hook を使う
   - onClick 等のイベントハンドラを使う
   - ブラウザ API を使う
✅ データ取得は Server Component で行う
✅ Server Action は別ファイルに分離（'use server' ファイル）
✅ Server Component から Client Component に渡す props はシリアライズ可能な値のみ
```

```
// ファイル構成の例
src/features/auth/
├── components/
│   ├── LoginForm.tsx          ← 'use client'（フォーム操作あり）
│   └── UserProfile.tsx        ← Server Component（表示のみ）
├── actions/
│   └── login.ts               ← 'use server'（Server Action）
└── types/
    └── index.ts
```

## CSS / Tailwind 規約

```
✅ Tailwind CSS のユーティリティクラスを使う
✅ @apply は原則使わない（コンポーネント化で対応）
✅ カスタム値は tailwind.config.ts の theme.extend に定義
✅ レスポンシブはモバイルファースト（sm: → md: → lg:）
✅ shadcn/ui のコンポーネントをカスタマイズする場合は cn() ユーティリティを使う
```

## ESLint 設定（Next.js 用）

TypeScript 共通設定（docs/typescript.md）に加えて、以下を追加:

```bash
npm install -D eslint-config-next
```

```javascript
// eslint.config.mjs（Next.js 用の追加設定）
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    "next/core-web-vitals",
    "next/typescript",
    "prettier"
  ),
  ...tseslint.configs.strictTypeChecked,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-non-null-assertion": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "react/react-in-jsx-scope": "off",
    },
  },
];

export default eslintConfig;
```

## .prettierignore（Next.js 用追加）

```
node_modules
.next
out
coverage
*.min.js
```

## package.json スクリプト（Next.js 用）

```json
{
  "scripts": {
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit"
  }
}
```

## Red Flags（React/Next.js 固有）

1. ❌ Server Component に 'use client' を不必要に付けている
2. ❌ Client Component でデータ取得をしている（Server Component で行うべき）
3. ❌ default export を不必要に使っている（named export を推奨）
4. ❌ `@apply` を多用している（コンポーネント化で対応すべき）
5. ❌ Server Action の引数をバリデーションしていない

## 参考リソース

- ESLint Configuration (Next.js): https://nextjs.org/docs/app/api-reference/config/eslint
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com/
