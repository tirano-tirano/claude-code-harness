---
name: project-structure
description: |
  プロジェクトのディレクトリ構成を定義・維持するスキル。
  新しいファイルやフォルダを作成する前に参照すること。
  Trigger: ファイル作成、フォルダ作成、「どこに置く」、プロジェクト初期セットアップ、
  構成の整理、リファクタリング（ファイル移動を伴う場合）
---

# プロジェクト構成（Project Structure）

## このスキルの役割

ファイルを「どこに置くか」を決めるルール。すべてのプロジェクトで同じ構成を使う。

**基本原則：ファイルの置き場所に迷ったら、このスキルを参照する。推測で置かない。**

## 採用パターン

| 判断項目 | 採用方針 |
|---------|---------|
| フォルダの分け方 | **機能別（Feature-Based）** |
| 依存の制約 | **レベル2：層の一方向依存** |
| テスト・型の配置 | **コロケーション + E2E 分離** |

このパターンはプロジェクトの規模に関わらず統一して適用する。

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/           #   認証不要のページグループ
│   ├── (auth)/             #   認証が必要なページグループ
│   ├── api/                #   API Routes
│   ├── layout.tsx          #   ルートレイアウト
│   └── page.tsx            #   トップページ
│
├── features/               # ★ 機能別モジュール（核心）
│   ├── auth/               #   認証機能
│   │   ├── components/     #     この機能専用のコンポーネント
│   │   ├── hooks/          #     この機能専用のフック
│   │   ├── lib/            #     この機能専用のロジック・ユーティリティ
│   │   ├── api/            #     この機能専用のAPI呼び出し
│   │   ├── types/          #     この機能専用の型定義
│   │   ├── index.ts        #     公開API（外部に公開するもののみ export）
│   │   ├── auth.test.ts    #     単体テスト（コロケーション）
│   │   └── auth.integration.test.ts
│   ├── dashboard/
│   ├── billing/
│   └── ...
│
├── entities/               # 機能横断のドメインモデル
│   ├── user/               #   User に関する型・バリデーション・変換
│   │   ├── user.ts
│   │   ├── user.test.ts
│   │   └── index.ts
│   ├── order/
│   └── ...
│
├── components/             # 複数機能で共有する UI コンポーネント
│   ├── ui/                 #   汎用 UI パーツ（Button, Card, Dialog 等）
│   └── layout/             #   レイアウト系（Header, Sidebar, Footer 等）
│
├── lib/                    # 複数機能で共有するユーティリティ
│   ├── utils/              #   汎用ヘルパー関数
│   ├── constants/          #   定数
│   └── config/             #   設定
│
├── hooks/                  # 複数機能で共有するカスタムフック
│
├── types/                  # 複数機能で共有する型定義
│
└── styles/                 # グローバルスタイル

tests/
└── e2e/                    # E2E テスト（Playwright）
    ├── auth.spec.ts
    ├── dashboard.spec.ts
    └── ...

docs/                       # ドキュメント（document-lifecycle が管理）
    ├── architecture.md     # 全体設計（DB一覧、API一覧、共通方針）
    ├── features/           # 機能仕様（1機能 = 1ファイル。frontmatter に進捗を記録）
    └── notes/              # 記録系（ブレスト、ADR、日誌等）
```

## 依存ルール（一方向依存）

ファイル間の import は以下の方向のみ許可される。逆方向は禁止。

```
app/ → features/ → entities/ → lib/（共有）
         ↓            ↓          ↓
      components/   types/     hooks/（共有）
      （共有）      （共有）
```

### 許可される import

```typescript
// ✅ app/ → features/（上位層 → 下位層）
import { LoginForm } from '@/features/auth';

// ✅ features/ → entities/（上位層 → 下位層）
import { User } from '@/entities/user';

// ✅ features/ → 共有（features/ → lib/, components/, hooks/, types/）
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui';

// ✅ entities/ → 共有（entities/ → lib/, types/）
import { validateEmail } from '@/lib/utils';
```

### 禁止される import

```typescript
// ❌ feature → feature（同じ層の横断参照）
import { UserProfile } from '@/features/auth';
// ↑ features/billing/ からの参照。billing が auth に依存してしまう

// ❌ entities/ → features/（下位層 → 上位層）
import { useAuth } from '@/features/auth';
// ↑ entities/ はどの feature にも依存してはいけない

// ❌ lib/ → features/（共有 → 機能固有）
import { AuthService } from '@/features/auth';
// ↑ 共有ユーティリティが特定機能に依存してしまう
```

### feature 間で共通処理が必要な場合

```
features/billing/ が features/auth/ のユーザー情報を必要とする場合：

❌ billing/ から auth/ を直接 import
✅ ユーザー情報を entities/user/ に置き、両方から参照する

features/A/ と features/B/ で同じヘルパー関数が必要な場合：

❌ A/ から B/ を直接 import
✅ その関数を lib/ に移動し、両方から参照する
```

## ファイル配置の判定ルール

新しいファイルを作るとき、以下の順序で判定する：

```
Q1: このファイルは特定の1つの機能だけで使うか？
  → YES → features/{機能名}/ の中に置く
  → NO ↓

Q2: このファイルはドメインモデル（User, Order 等の核心的な型やルール）か？
  → YES → entities/{ドメイン名}/ に置く
  → NO ↓

Q3: このファイルは UI コンポーネントか？
  → YES → components/ に置く（ui/ か layout/ を選ぶ）
  → NO ↓

Q4: このファイルはカスタムフックか？
  → YES → hooks/ に置く
  → NO ↓

Q5: このファイルは型定義か？
  → YES → types/ に置く
  → NO → lib/ に置く
```

**重要：最初は features/ に置く。** 2つ以上の機能で使うことが確定してから共有フォルダに移動する。「将来使うかも」で共有に置かない。

## feature の公開 API（index.ts）

各 feature は `index.ts` で外部に公開するものだけを export する。feature の内部構造を外から直接参照しない。

```typescript
// features/auth/index.ts
export { LoginForm } from './components/LoginForm';
export { useAuth } from './hooks/useAuth';
export type { AuthUser } from './types';

// ✅ 外部からは index.ts 経由でアクセス
import { LoginForm, useAuth } from '@/features/auth';

// ❌ 内部ファイルを直接参照しない
import { LoginForm } from '@/features/auth/components/LoginForm';
```

## テストファイルの配置

| テストの種類 | 配置場所 | ファイル名 |
|------------|---------|-----------|
| 単体テスト | テスト対象の隣（コロケーション） | `{name}.test.ts` |
| 統合テスト | テスト対象の隣（コロケーション） | `{name}.integration.test.ts` |
| E2E テスト | `tests/e2e/` に分離 | `{feature}.spec.ts` |

**理由：** 単体・統合テストはファイル単位なので隣に置くのが自然。E2E テストはユーザーフロー全体をテストするので機能横断になり、分離する方が管理しやすい。

## app/ ディレクトリの役割

`app/` は Next.js のルーティング専用。ビジネスロジックや UI を直接書かない。

```typescript
// ✅ app/dashboard/page.tsx — features/ のコンポーネントを呼ぶだけ
import { DashboardPage } from '@/features/dashboard';

export default function Page() {
  return <DashboardPage />;
}

// ❌ app/dashboard/page.tsx — ロジックを直接書かない
export default function Page() {
  const data = await fetch('/api/...');  // ← features/ に書くべき
  return <div>{/* 大量のJSX */}</div>;   // ← features/ に書くべき
}
```

## 既存プロジェクトの整理手順

ファイルが散らかっている既存プロジェクトに適用する場合：

1. **現状の把握** — ファイル一覧を取得し、機能ごとにグループ分けする
2. **features/ の作成** — 機能ごとのフォルダを作成
3. **ファイルの移動** — 1機能ずつ移動する（一度に全部やらない）
4. **import パスの修正** — `@/features/{name}` 形式に統一
5. **index.ts の作成** — 各 feature の公開 API を定義
6. **テスト実行** — 移動後にすべてのテストが通ることを確認
7. **共有の抽出** — 2つ以上の機能で使われているものを共有フォルダに移動

**1機能ずつ移動する理由：** 一度に全部動かすと壊れたときに原因特定が困難。

## ツール生成ファイルの配置ルール

開発ツール（Ralph、ビルドツール、テストツール等）が生成するファイルの配置方針。

### 基本原則

1. **自作ツールは `.toolname/` にまとめる** — ルート直下の散乱を防ぐ。`.git/`、`.next/` と同じ慣習
2. **標準ツールはデフォルトに従う** — `node_modules/`、`.next/`、`coverage/` 等は変えない
3. **git 管理の判断基準** — 「消えたら困るか？」で決める。再生成できるものは gitignore

### 自作ツールの配置パターン

各ツールは `.toolname/` ディレクトリにまとめる：

```
.ralph/                     # Ralph Loop の作業ディレクトリ
├── PROMPT.md               #   実行指示テンプレート（git 管理）
├── SCRATCH.md              #   作業中の一時メモ（gitignore）
├── archive/                #   古い SCRATCH.md の退避先（gitignore）
└── logs/                   #   実行ログ（gitignore）
```

### git 管理の分類

| 分類 | git 管理 | 例 |
|------|---------|---|
| ツールの設定・テンプレート | する | `.ralph/PROMPT.md` |
| 作業中の一時ファイル | しない | `.ralph/SCRATCH.md` |
| ログ・アーカイブ | しない | `.ralph/logs/`、`.ralph/archive/` |
| ビルド・キャッシュ | しない | `.next/`、`node_modules/`、`coverage/` |
| ドキュメント | する | `docs/`（feature, architecture, notes, nfr） |

### .gitignore の記述例

```gitignore
# Ralph
.ralph/SCRATCH.md
.ralph/archive/
.ralph/logs/

# Build & Cache
.next/
node_modules/
coverage/
```

### 新しいツールを追加するとき

1. `.toolname/` ディレクトリを作成する
2. git 管理するファイルと gitignore するファイルを分類する
3. `.gitignore` にエントリを追加する
4. このセクションの表にツール情報を追記する

## Red Flags — 以下に該当したら立ち止まること

| Red Flag | 正しい対応 |
|----------|-----------|
| どこに置くか迷った | このスキルの判定ルール（Q1〜Q5）に従う |
| features/ の中のファイルが増えすぎた | サブフォルダ（components/, hooks/ 等）に整理する |
| feature から別の feature を直接 import した | entities/ か共有フォルダに移動して依存を解消する |
| 「将来使うかもしれないから共有に置く」と思った | 今使う場所に置く。実際に共有が必要になってから移動する |
| app/ にビジネスロジックを書いた | features/ に移動する。app/ はルーティングのみ |
| src/ 直下にファイルを置いた | 該当するフォルダに移動する |
| テストファイルを tests/ にまとめた（E2E以外） | テスト対象の隣に移動する（コロケーション） |
| index.ts なしで feature の内部を直接参照した | index.ts を作成し、公開 API を定義する |
| ツールの出力ファイルをルート直下に置いた | `.toolname/` ディレクトリにまとめる |
| ツールのログや一時ファイルを git 管理した | 再生成できるものは gitignore する |
