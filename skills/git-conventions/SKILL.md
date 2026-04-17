---
name: git-conventions
description: |
  Git のコミットメッセージ規約、ブランチ命名規則、コンフリクト解消手順を定義するスキル。
  Conventional Commits に準拠し、一貫性のある Git 履歴を維持する。
  Trigger: コミット、ブランチ、コンフリクト、マージ、git、コミットメッセージ、
  ブランチ名、命名規則、「何てコミットする？」「ブランチどうする？」
  日本語トリガー: コミット、ブランチ、コンフリクト、マージ、Git規約、コミットメッセージ
---

# Git Conventions Skill

Git 操作の規約を定義し、一貫性のある履歴を維持するスキル。

**開始時に宣言:** 「git-conventions スキルで Git 規約に従って作業します。」

---

## 全体像

このスキルは3つの領域をカバーする:

```
1. コミットメッセージ規約 — 「何を変えたか」を正確に伝える書き方
2. ブランチ命名規則 — 「何のための作業か」が一目でわかる名前
3. コンフリクト解消手順 — マージ時の衝突を安全に解決する方法
```

---

## 1. コミットメッセージ規約（Conventional Commits）

Conventional Commits とは、コミットメッセージに「型」をつける規約。
これにより、変更履歴の自動生成やバージョン番号の自動決定が可能になる。

### 基本形式

```
<型>(<スコープ>): <説明>

[本文（任意）]

[フッター（任意）]
```

### 型（type）一覧

| 型 | 意味 | 例 |
|---|---|---|
| `feat` | 新機能の追加 | `feat(auth): ログイン画面を追加` |
| `fix` | バグ修正 | `fix(cart): 数量が0以下になるバグを修正` |
| `fix(security)` | セキュリティ修正 | `fix(security): XSS脆弱性を修正` |
| `docs` | ドキュメントのみの変更 | `docs: feature仕様を更新` |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） | `style: インデントを統一` |
| `refactor` | バグ修正でも機能追加でもないコード変更 | `refactor(api): レスポンス生成を共通化` |
| `test` | テストの追加・修正 | `test(auth): ログインのE2Eテストを追加` |
| `chore` | ビルド、ツール、設定等の変更 | `chore: eslint設定を更新` |
| `perf` | パフォーマンス改善 | `perf(list): 仮想スクロールを導入` |
| `ci` | CI/CD 設定の変更 | `ci: GitHub Actions にキャッシュを追加` |
| `build` | ビルドシステムや依存関係の変更 | `build: Next.js を15にアップデート` |
| `revert` | 以前のコミットの取り消し | `revert: feat(auth): ログイン画面を追加` |

### スコープ（scope）の決め方

スコープは「どの機能・領域の変更か」を示す。省略可能。

```
推奨: feature名 または 技術領域
例: auth, cart, api, ui, db, config, deps
```

**プロジェクトの features/ 配下のフォルダ名をスコープとして使うのが最もわかりやすい。**

### 説明（description）のルール

- 命令形で書く（日本語の場合は「〜を追加」「〜を修正」の形）
- 先頭を大文字にしない（英語の場合）
- 末尾にピリオドを付けない
- 50文字以内を目指す

### 本文（body）

「なぜこの変更が必要だったか」を書く場所。変更が自明でない場合に使う。

```
fix(cart): 数量計算で浮動小数点誤差が発生するバグを修正

JavaScriptの浮動小数点演算により、0.1 + 0.2 が 0.30000000000000004 に
なる問題。整数演算（円単位）に変更して対処。
```

### フッター（footer）

```
# 破壊的変更がある場合
BREAKING CHANGE: API のレスポンス形式を変更

# Issue と紐づける場合
Refs: #123
Closes: #456
```

### 破壊的変更（BREAKING CHANGE）

既存の動作が変わる変更には2つの表記方法がある:

```
方法1: フッターに BREAKING CHANGE: を記載
方法2: 型の後に ! を付ける → feat(api)!: レスポンス形式をv2に変更
```

### コミットの粒度

```
✅ 1つのコミット = 1つの論理的変更
✅ テストと実装は同じコミットに含める（TDD の Red→Green は別でも可）
✅ リファクタリングは機能変更と分ける
❌ 「いろいろ修正」のような曖昧なコミット
❌ 動かない状態でのコミット（bisect で問題を特定できなくなる）
```

---

## 2. ブランチ命名規則

### 基本形式

```
<種類>/<説明>
```

### 種類（prefix）一覧

| 種類 | 意味 | 例 |
|---|---|---|
| `feature/` | 新機能開発 | `feature/user-login` |
| `bugfix/` | バグ修正 | `bugfix/cart-quantity-error` |
| `hotfix/` | 本番の緊急修正 | `hotfix/xss-vulnerability` |
| `release/` | リリース準備 | `release/v1.2.0` |
| `chore/` | 雑務（設定変更等） | `chore/update-eslint` |
| `refactor/` | リファクタリング | `refactor/extract-auth-logic` |
| `docs/` | ドキュメント変更 | `docs/update-feature-spec` |
| `test/` | テスト追加・修正 | `test/add-e2e-checkout` |

### 命名ルール

```
✅ 英小文字とハイフン区切り: feature/user-login
✅ 短く具体的に: bugfix/null-pointer-in-cart
✅ Issue 番号を含めてもよい: feature/123-user-login
❌ 日本語: feature/ユーザーログイン
❌ アンダースコア: feature/user_login
❌ 大文字: feature/UserLogin
❌ 曖昧な名前: feature/update, bugfix/fix
```

### ブランチ戦略

```
main（または master）
  ├── develop（任意: 開発統合ブランチ）
  │     ├── feature/user-login
  │     ├── feature/checkout-flow
  │     └── bugfix/cart-error
  ├── release/v1.2.0
  └── hotfix/critical-fix
```

**小〜中規模プロジェクト**では `develop` ブランチを省略し、`main` から直接ブランチを切ってもよい。

### development-cycle との連携

development-cycle のフロー判定に応じたブランチ種類:

| フロー | ブランチ種類 |
|---|---|
| A: 新機能開発 | `feature/` |
| B: バグ修正 | `bugfix/` または `hotfix/` |
| C: リファクタリング | `refactor/` |
| D: UI改修 | `feature/` または `refactor/` |
| E: 仕様変更 | `feature/` |

---

## 3. コンフリクト解消手順

コンフリクト（衝突）とは、2つのブランチが同じファイルの同じ箇所を違う内容に変更した状態。Git が自動でマージできないため、手動で解決する必要がある。

### 解消フロー

```
1. コンフリクトの状況を確認
2. 各ファイルの衝突箇所を理解
3. 正しい内容を選択・統合
4. テストを実行して動作確認
5. コミット
```

### Step 1: 状況確認

```bash
# コンフリクト発生時
git status
# → "both modified:" と表示されるファイルがコンフリクト箇所

# コンフリクトの数を確認
git diff --name-only --diff-filter=U
```

### Step 2: 衝突箇所の読み方

```
<<<<<<< HEAD（現在のブランチの内容）
  const greeting = "こんにちは";
=======
  const greeting = "Hello";
>>>>>>> feature/english-support（マージしようとしているブランチの内容）
```

### Step 3: 解消の選択肢

```
選択肢 A: 現在のブランチの内容を採用（HEAD側）
選択肢 B: マージ元のブランチの内容を採用
選択肢 C: 両方を統合した新しい内容にする（最も多い）
```

### Step 4: 解消後の確認

```bash
# コンフリクトマーカー（<<<, ===, >>>）が残っていないか確認
grep -rn "<<<<<<< " src/
grep -rn "=======" src/
grep -rn ">>>>>>> " src/

# テスト実行
npm test

# 型チェック
npx tsc --noEmit
```

### Step 5: コミット

```bash
git add .
git commit
# デフォルトのマージコミットメッセージを使用するか、内容を追記
```

### コンフリクトを予防する習慣

```
✅ こまめに main/develop から最新を取り込む（git pull --rebase origin main）
✅ ブランチの作業期間を短くする（長期ブランチはコンフリクトしやすい）
✅ 同じファイルを複数人で同時に編集しない（設計で回避）
✅ 大きなリファクタリングは他の機能開発と時期をずらす
```

---

## Red Flags

以下を検出したら **即座に指摘** すること:

1. ❌ コミットメッセージに型（type）がない
2. ❌ 「いろいろ修正」「update」「fix」のような意味のないメッセージ
3. ❌ 1つのコミットに無関係な複数の変更が混在
4. ❌ 動かない状態（テスト失敗、ビルドエラー）でコミット
5. ❌ ブランチ名が命名規則に従っていない
6. ❌ コンフリクトマーカー（<<<, ===, >>>）がコードに残っている
7. ❌ main ブランチに直接コミット（保護されていない場合の警告）
8. ❌ 機密情報（APIキー、パスワード）を含むコミット
9. ❌ `git push --force` を共有ブランチで実行

---

## 参考リソース

- Conventional Commits: https://www.conventionalcommits.org/en/v1.0.0/
- Conventional Branch: https://conventional-branch.github.io/
