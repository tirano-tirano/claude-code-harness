# TypeScript 固有のコーディング規約

## 型の規約

```
✅ 型は明示する（any 禁止、unknown を使う）
✅ 関数の引数と戻り値に型注釈を付ける
✅ interface より type を優先（union や intersection が使えるため）
✅ enum より const object + as const を優先
✅ Non-null assertion (!) は使わない。型ガードで絞り込む
✅ 型キャスト (as) は最小限。使う場合はコメントで理由を書く
```

```typescript
// ❌ 悪い例
const data: any = fetchData();
const name = user!.name;
enum Status { Active, Inactive }

// ✅ 良い例
const data: unknown = fetchData();
if (isUser(data)) { const name = data.name; }
const Status = { Active: 'active', Inactive: 'inactive' } as const;
type Status = typeof Status[keyof typeof Status];
```

## 命名規則

| 対象 | 規則 | 例 |
|---|---|---|
| 型 / type alias | PascalCase | `type UserProfile = {...}` |
| 定数 | UPPER_SNAKE_CASE | `const MAX_RETRY_COUNT = 3` |
| 変数・関数 | camelCase | `const userName = "..."` |
| ファイル | camelCase（ユーティリティ） | `formatDate.ts` |
| テストファイル | 対象ファイル名 + .test | `formatDate.test.ts` |

## TypeScript 設定（strict モード）

```json
// tsconfig.json の compilerOptions に追加
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## ESLint 設定（TypeScript 用共通部分）

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-config-prettier eslint-plugin-prettier
```

```javascript
// eslint.config.mjs（TypeScript 共通部分）
import tseslint from "typescript-eslint";

const eslintConfig = [
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
    },
  },
];

export default eslintConfig;
```

## Prettier 設定

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## 品質ゲート設定（Node.js エコシステム）

### Husky + lint-staged

```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json に追加
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

### commitlint

```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

```javascript
// commitlint.config.mjs
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat', 'fix', 'docs', 'style', 'refactor',
      'test', 'chore', 'perf', 'ci', 'build', 'revert',
    ]],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 200],
  },
};
```

```bash
# .husky/commit-msg
npx --no -- commitlint --edit ${1}
```

## Red Flags（TypeScript 固有）

1. ❌ `any` 型を使っている
2. ❌ `!`（Non-null assertion）を使っている
3. ❌ `enum` を使っている（const object + as const を使う）
4. ❌ `as` による型キャストを理由なく使っている

## 参考リソース

- typescript-eslint: https://typescript-eslint.io/
- TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
