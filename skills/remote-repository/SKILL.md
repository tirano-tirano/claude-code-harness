---
name: remote-repository
description: |
  GitHub / GitLab / Bitbucket 等のリモートリポジトリサービスとの連携スキル。
  PR（Pull Request / Merge Request）作成、Issue 管理、CI/CD 設定、
  テンプレート整備を扱う。サービスに依存しない共通ルールと、サービス固有の手順を分離。
  Trigger: PR、Pull Request、Merge Request、Issue、CI/CD、GitHub Actions、
  GitLab CI、PR作成、レビュー依頼、テンプレート、ワークフロー、
  「PRを出して」「Issue作って」「CI設定して」
  日本語トリガー: PR、プルリクエスト、Issue、CI、GitHub、GitLab、PR作成、レビュー依頼
---

# Remote Repository Skill

リモートリポジトリサービス（GitHub / GitLab / Bitbucket 等）との連携を管理するスキル。

**開始時に宣言:** 「remote-repository スキルでリモートリポジトリ連携を行います。」

---

## 全体像

```
1. プロジェクト初期セットアップ（テンプレート・CI/CD）
2. 日常の作業フロー（PR作成・Issue管理）
3. CI/CD パイプライン設計
```

このスキルは「サービス共通ルール」と「サービス固有の手順」を分けて記載する。
どのサービスを使っていても、共通ルールに従えば一貫した運用ができる。

---

## サービス判定

プロジェクトのリモートURLから使用サービスを判定する:

```bash
git remote get-url origin
```

| URL パターン | サービス | PR の呼び方 |
|---|---|---|
| `github.com` | GitHub | Pull Request (PR) |
| `gitlab.com` または自前GitLab | GitLab | Merge Request (MR) |
| `bitbucket.org` | Bitbucket | Pull Request (PR) |

以降、PRの呼び方は検出されたサービスに合わせること。

---

## 1. プロジェクト初期セットアップ

### 必須ファイル構成

```
.github/                          # GitHub の場合
├── PULL_REQUEST_TEMPLATE.md      # PRテンプレート
├── ISSUE_TEMPLATE/
│   ├── bug_report.md             # バグ報告テンプレート
│   ├── feature_request.md        # 機能要望テンプレート
│   └── config.yml                # テンプレート選択画面設定
└── workflows/
    ├── ci.yml                    # CI パイプライン
    └── release.yml               # リリースワークフロー

.gitlab/                          # GitLab の場合
├── merge_request_templates/
│   └── default.md
├── issue_templates/
│   ├── bug_report.md
│   └── feature_request.md
└── .gitlab-ci.yml               # ルートに配置
```

### PR テンプレート

```markdown
## 概要
<!-- この PR で何を変更したか -->

## 変更の種類
- [ ] 新機能（feat）
- [ ] バグ修正（fix）
- [ ] リファクタリング（refactor）
- [ ] テスト追加・修正（test）
- [ ] ドキュメント（docs）
- [ ] その他（chore）

## 変更内容
<!-- 具体的な変更点を箇条書きで -->

## テスト
<!-- どのようにテストしたか -->
- [ ] 単体テスト追加/更新
- [ ] 統合テスト追加/更新
- [ ] E2Eテスト追加/更新
- [ ] 手動テスト実施

## セキュリティ
<!-- セキュリティに影響する変更がある場合 -->
- [ ] 認証・認可に影響なし
- [ ] 入力バリデーション追加済み
- [ ] セキュリティレビュー実施済み

## 関連 Issue
<!-- Closes #123 -->

## スクリーンショット（UI変更の場合）

## レビューのポイント
<!-- 特に見てほしい箇所があれば -->
```

### feature ファイルから PR description を自動生成

harness では feature ファイル（`docs/features/F-xxx_*.md`）に「要求・要件・
技術仕様・タスク・関連 NFR」がすべて揃っている。PR を書くときに同じ内容を
書き直すのは無駄なので、feature ファイルを再利用してテンプレートを埋める。

**手順:**

1. PR の対象 feature を特定する（多くの場合ブランチ名や直近コミットから推定可能）
2. 該当する feature ファイルから以下を抽出する：
   - 要求セクション（R01, R02...）→ PR の「概要」に転記
   - 完了済みタスクのうち、テスト系（T01〜）の実行結果 → 「テスト」セクション
   - 実装タスク（T05〜）から変更ファイル一覧を集約 → 「変更内容」
   - 関連 NFR → そのまま「セキュリティ」「レビューのポイント」に展開
3. 上記をテンプレートに当てはめる

**変換マッピング:**

| feature ファイルのセクション | PR description の対応箇所 |
|---|---|
| `## 要求` の R01〜 | `## 概要` の箇条書き |
| `## 要件` の S01〜（実装で関連したもののみ） | `## 変更内容` の箇条書き |
| `## タスク` の完了済み T01〜（テスト系） | `## テスト` のチェックボックス |
| `## 関連 NFR` の各エントリ | `## セキュリティ` 、または `## レビューのポイント` |
| `## 技術仕様` の API/DB/UI 変更点 | `## 変更内容` または `## レビューのポイント` |

**生成例:**

feature ファイル F-001 に以下があるとする：

```markdown
## 要求
R01: ユーザーがメール+パスワードで登録できる
R02: 登録時に確認メールを送信する

## 要件
S01: パスワードは8文字以上、英数字混在
S02: 同一メールでの重複登録は不可

## 関連 NFR
- docs/nfr/security.md OWASP A07（パスワード強度）→ S01 で対応
- docs/nfr/security.md OWASP A03（インジェクション）→ メール検証で対応
```

これから生成される PR description（部分）：

```markdown
## 概要
- ユーザーがメール+パスワードで登録できる（F-001 R01）
- 登録時に確認メールを送信する（F-001 R02）

## 変更内容
- パスワードバリデーション追加（8文字以上、英数字混在）
- メール重複チェックの実装
- 確認メール送信処理の実装

## テスト
- [x] 受け入れテスト: 登録フロー全体（F-001-T01）
- [x] 統合テスト: 重複登録の拒否（F-001-T03）
- [x] 単体テスト: パスワードバリデーション（F-001-T05）
- [x] 単体テスト: メール検証（F-001-T06）

## セキュリティ
- [x] OWASP A07 対応: パスワード強度を S01 で実装
- [x] OWASP A03 対応: メール入力検証を追加
- [x] セキュリティレビュー実施済み（docs/notes/2026-04-30_security_F-001.md）

## レビューのポイント
- F-001 の関連 NFR 2 件への対応箇所（src/auth/PasswordValidator.ts:12, src/auth/EmailValidator.ts:8）
```

**この方式の利点:**

- 書き手の負担が「再度書き起こす」から「マッピングする」に変わる（5分→1分）
- feature ファイルと PR の内容が乖離しない（信頼できるドキュメント連鎖）
- レビュアーが feature ファイルへの参照（F-xxx, R01）から元の意図を辿れる

**Red Flag:**

| 兆候 | 対応 |
|---|---|
| feature ファイルが無い、または未完成のまま PR を出そうとしている | feature ファイルを完成させてから PR を出す（フロー A 違反） |
| PR の内容が feature ファイルにない | スコープが膨らんでいる。別 feature に切り出す |
| 関連 NFR セクションが空のまま PR を出した | 該当 NFR を確認して埋める。NFR 違反は信頼度関係なくレビューで指摘される |

### Issue テンプレート（バグ報告）

```markdown
---
name: バグ報告
about: バグの報告
labels: bug
---

## バグの概要
<!-- 何が起きたか -->

## 再現手順
1.
2.
3.

## 期待する動作
<!-- 本来どうなるべきか -->

## 実際の動作
<!-- 実際にどうなったか -->

## 環境
- OS:
- ブラウザ:
- バージョン:

## スクリーンショット・ログ
```

### Issue テンプレート（機能要望）

```markdown
---
name: 機能要望
about: 新機能の提案
labels: enhancement
---

## 解決したい課題
<!-- どんな問題や不便を感じているか -->

## 提案する解決策
<!-- どうなれば良いか -->

## 代替案
<!-- 他に考えた方法があれば -->

## 補足情報
```

---

## 2. PR（Pull Request / Merge Request）作成フロー

### PR 作成前チェックリスト

```
□ ブランチ名が git-conventions の命名規則に従っているか
□ コミットメッセージが Conventional Commits に従っているか
□ テストがすべてパスしているか（npm test）
□ 型チェックがパスしているか（npx tsc --noEmit）
□ リントがパスしているか（npm run lint）
□ 不要なデバッグコード（console.log等）を削除したか
□ 変更に関連するドキュメントを更新したか
□ security-review のチェックが必要な変更ではないか
```

### PR の書き方ルール

**タイトル:**
```
Conventional Commits の形式に合わせる
例: feat(auth): ログイン画面を追加
例: fix(cart): 数量計算のバグを修正
```

**本文:**
```
✅ テンプレートのすべての項目を埋める
✅ 「なぜ」この変更が必要かを説明する
✅ レビュアーが知るべき背景情報を含める
✅ UI変更にはスクリーンショットを添付
❌ テンプレートの項目を削除して提出
❌ 「修正しました」だけの説明
```

### PR のサイズ

```
目安: 変更ファイル数 10以下、変更行数 400行以下

大きすぎる場合の対処:
1. 機能を分割して複数のPRにする
2. リファクタリングと機能追加を別PRにする
3. テスト追加を先行PRにする

例外: 自動生成ファイル、パッケージロックファイルの変更は行数に含めない
```

### レビュー依頼の手順

```
1. PR を作成（下書き → 準備完了に変更）
2. レビュアーを指名
3. requesting-code-review スキルでセルフレビューを実施
4. レビュー指摘への対応は receiving-code-review スキルに従う
```

---

## 3. Issue 管理

### Issue の使い分け

| 種類 | いつ作るか | ラベル |
|---|---|---|
| バグ報告 | バグを発見した時 | `bug` |
| 機能要望 | 新機能を提案する時 | `enhancement` |
| タスク | 作業を記録・分割する時 | `task` |
| 質問 | 設計判断を議論する時 | `question` |

### Issue とブランチ・PR の紐づけ

```
Issue #123 → ブランチ: feature/123-user-login → PR: feat(auth): ログイン画面を追加

PR本文に以下を記載すると、マージ時に自動でIssueが閉じる:
GitHub:  Closes #123 / Fixes #123 / Resolves #123
GitLab:  Closes #123（同じ）
```

### ラベル運用

推奨ラベルセット:

```
種類:     bug, enhancement, task, question, documentation
優先度:   priority:high, priority:medium, priority:low
状態:     wontfix, duplicate, invalid
領域:     frontend, backend, infra, design
```

---

## 4. CI/CD パイプライン

### 基本パイプライン構成

```
PR作成 / push 時に実行:
  ├── lint（コードスタイルチェック）
  ├── type-check（TypeScript型チェック）
  ├── unit-test（単体テスト）
  ├── integration-test（統合テスト）
  ├── build（ビルドが通るか確認）
  └── security-audit（npm audit）

main マージ時に実行:
  ├── 上記すべて
  ├── e2e-test（E2Eテスト）
  └── deploy（デプロイ）
```

### GitHub Actions テンプレート

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
      - run: npm audit --audit-level=high

  e2e:
    if: github.ref == 'refs/heads/main'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npx playwright test
```

### GitLab CI テンプレート

```yaml
# .gitlab-ci.yml
stages:
  - quality
  - e2e
  - deploy

quality:
  stage: quality
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run lint
    - npx tsc --noEmit
    - npm test
    - npm run build
    - npm audit --audit-level=high
  rules:
    - if: $CI_MERGE_REQUEST_IID
    - if: $CI_COMMIT_BRANCH == "main"

e2e:
  stage: e2e
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  script:
    - npm ci
    - npx playwright install --with-deps
    - npm run build
    - npx playwright test
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### CI/CD セキュリティ

```
✅ シークレットは環境変数/Secrets で管理（コードにハードコードしない）
✅ サードパーティ Actions は SHA でピン留め（例: actions/checkout@abc123）
✅ CI の権限は最小限にする（write 権限は必要な場合のみ）
✅ Dependabot / Renovate で依存パッケージの自動更新を設定
❌ CI ログにシークレットを出力する
❌ CI ジョブに admin 権限を与える
```

---

## 5. リリース管理

### バージョニング（Semantic Versioning）

```
v メジャー.マイナー.パッチ
例: v1.2.3

パッチ（+0.0.1）: バグ修正のみ（fix コミット）
マイナー（+0.1.0）: 新機能追加、後方互換あり（feat コミット）
メジャー（+1.0.0）: 破壊的変更あり（BREAKING CHANGE）
```

### リリースフロー

```
1. release/vX.Y.Z ブランチを作成
2. バージョン番号を更新（package.json）
3. CHANGELOG を生成・確認
4. PR を作成してレビュー
5. main にマージ
6. タグを作成: git tag vX.Y.Z
7. リリースノートを作成
```

---

## finishing-a-development-branch との連携

PR 作成は finishing-a-development-branch スキルの「PR作成オプション」と連携する:

```
finishing-a-development-branch → PR作成を選択
  ↓
remote-repository スキルの PR テンプレートに従って作成
  ↓
requesting-code-review でセルフレビュー
  ↓
CI パイプラインが自動実行
  ↓
レビュー完了後マージ
```

---

## Red Flags

以下を検出したら **即座に指摘** すること:

1. ❌ PR テンプレートを無視した空の説明
2. ❌ 変更行数が 1000行を超える単一 PR
3. ❌ CI がすべてパスしていないのにマージ
4. ❌ レビューなしでのマージ（1人プロジェクトではセルフレビュー必須）
5. ❌ シークレットがコードやCI設定にハードコードされている
6. ❌ main ブランチへの直接 push
7. ❌ Issue と紐づいていない PR（追跡不能になる）
8. ❌ サードパーティ Actions をタグ指定（SHA指定すべき）

---

## 参考リソース

- GitHub PR Template: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository
- GitHub Issue Template: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository
- GitHub Actions: https://docs.github.com/en/actions
- GitLab CI/CD: https://docs.gitlab.com/ee/ci/
- Semantic Versioning: https://semver.org/
