# claude-code-harness

Claude Code 向けのスキルベース開発ワークフロー。
ドキュメント駆動 + テスト駆動で「設計 → 実装 → テスト → レビュー → セキュリティチェック」の一貫したプロセスを提供する。

## 特徴

- **ドキュメント駆動開発**: feature ファイル（1機能 = 1ファイル）に要求・要件・技術仕様・タスクをまとめ、コードを書く前にドキュメントを書く
- **外側→内側のテスト駆動**: 受け入れテスト → 統合テスト → 単体テスト → 実装の順でタスクを並べ、ゴールを先に定義してから実装する
- **Ralph Loop 連携**: feature ファイルを Ralph Loop の進捗ファイルとして直接使用し、タスクを自動で順次処理する
- **既存プロジェクトへの途中導入**: project-migration スキルで既存コード・ドキュメントから feature ファイルを一括生成

## 経緯

このプロジェクトは [Superpowers](https://github.com/obra/superpowers)（MIT License, Copyright (c) 2025 Jesse Vincent）をベースにしている。

Superpowers は Claude Code プラグインとして、設計・計画・実装・テスト・デバッグを一貫して行うスキルセットを提供するプロジェクト。本リポジトリでは、Superpowers の設計思想を引き継ぎつつ、以下のカスタマイズを加えている。

### 主な変更点

- **ドキュメント駆動開発の導入**: document-lifecycle スキルで feature ファイル体系を定義。architecture.md + feature ファイル + notes/ の3層構造
- **外側→内側のテスト駆動**: 要求→受け入れテスト、要件→統合テスト、技術仕様→単体テストの対応を定義し、テストを先に書くワークフローを強制
- **Ralph Loop との統合**: feature ファイルを Ralph Loop の TODO.md として直接使用可能。タスク行（`- [ ] F-xxx-Txx`）を自動検出
- **バグ修正フロー**: 既存 feature ファイルに再現テスト + 修正のタスクペアを追記する運用ルール
- **既存プロジェクトへの途中導入**: project-migration スキルで既存コード・ドキュメントから feature ファイルを一括生成
- **日本語対応**: 全スキルに日本語トリガーキーワードを追加
- **フレームワーク非依存設計**: スキル本体（SKILL.md）を汎用的に保ち、フレームワーク固有の内容は `docs/` に分離

## ドキュメント体系

```
docs/
├── architecture.md      全体設計（DB一覧、API一覧、技術スタック）
├── design-system.md     デザインシステム（共通UI、配色、操作パターン）
├── features/            機能仕様（1機能 = 1ファイル。frontmatter に進捗を記録）
│   ├── F-000-xxx.md       共通基盤（認証、エラー処理等。NFR の実装）
│   └── F-001〜.md         通常の feature
├── nfr/                 非機能要求（横断的要件のルール集。参照用）
│   ├── security.md        セキュリティ
│   ├── performance.md     パフォーマンス
│   └── ...
├── legacy/              既存ドキュメント保管（途中導入時）
└── notes/               記録系（ブレスト、ADR、日誌、セキュリティレビュー等）
```

### feature ファイルの構造

```markdown
---
id: F-001
feature: 機能名
status: draft | spec | ready | in-progress | done
progress: 0/9
---

## 要求        ← ユーザー視点の目的（R01, R02...）
## 要件        ← 具体的な条件（S01, S02...）
## 技術仕様    ← API / DB / UI の設計（API-01, DB-01, UI-01...）
## タスク      ← 受け入れテスト → 統合テスト → 単体テスト → 実装
## 関連 NFR    ← この feature が遵守すべき非機能要求（docs/nfr/ への参照）
## 未決事項    ← まだ決まっていないこと
```

### Ralph Loop との連携

feature ファイルを Ralph Loop の進捗ファイルとして直接使える。TODO.md は不要。

```bash
# docs/features/ の feature ファイルを自動検出して F-xxx 番号順に順次処理
ralph
```

Ralph Loop は `docs/features/` から未完了の feature ファイルを自動検出し、タスク行（`F-xxx-T` を含む `- [ ]` 行）のみを完了判定に使う。`status: done` の feature はスキップされる。1つの feature が完了したら次の feature へ自動移行する。

1ファイルだけ指定することもできる:

```bash
ralph --todo docs/features/F-001_user-registration.md
```

## スキル一覧

### プロセス系スキル（HOW を決めるスキル）

| スキル | 概要 |
|---|---|
| `development-cycle` | コード変更を伴う作業の全体フロー（5種のフロー: 新機能 / バグ修正 / リファクタ / UI改修 / 仕様変更） |
| `brainstorming-with-docs` | 対話しながらメモを段階的に構造化し、feature ファイルに変換する |
| `writing-plans` | 実装計画をタスク単位に分解 |
| `executing-plans` | 計画をバッチ実行（チェックポイント付き） |
| `document-lifecycle` | ドキュメント駆動開発の基盤（feature ファイル、architecture.md、notes/ の管理） |
| `systematic-debugging` | 4フェーズの根本原因分析 |

### 実装系スキル（WHAT を作るスキル）

| スキル | 概要 |
|---|---|
| `web-testing` | テスト戦略・TDD（E2E → 統合 → 単体、モック許可制度、Red-Green-Refactor） |
| `ui-design` | UI設計（画面一覧 → 共通レイアウト → 情報設計 → ワイヤーフレーム → ビジュアル） |
| `project-structure` | ディレクトリ構成（機能別 + 一方向依存 + コロケーション） |
| `coding-standards` | コーディング規約（TypeScript/React/Next.js）、ESLint/Prettier 設定 |
| `subagent-driven-development` | サブエージェントによる並列実装 |
| `dispatching-parallel-agents` | 並行タスクの管理 |

### 品質管理・コラボレーション系スキル

| スキル | 概要 |
|---|---|
| `verification-before-completion` | 作業完了前の検証チェック |
| `requesting-code-review` | コードレビュー依頼 |
| `receiving-code-review` | レビューフィードバックへの対応 |
| `security-review` | OWASP Top 10:2025 セキュリティチェック |

### Git・ワークフロー系スキル

| スキル | 概要 |
|---|---|
| `git-conventions` | コミットメッセージ規約（Conventional Commits）、ブランチ命名規則 |
| `remote-repository` | PR / Issue / CI/CD |
| `using-git-worktrees` | Git worktree による並列開発 |
| `finishing-a-development-branch` | ブランチのマージ・クリーンアップ |

### 環境・セットアップ系スキル

| スキル | 概要 |
|---|---|
| `project-setup` | 開発環境の構築 |
| `project-migration` | 既存プロジェクトへの途中導入（コード・ドキュメントから feature ファイルを一括生成） |

### メタ系スキル

| スキル | 概要 |
|---|---|
| `using-superpowers` | スキルシステムの案内・スキル選択ルール |
| `claude-md-generator` | CLAUDE.md の生成・更新 |
| `writing-skills` | 新しいスキルの作成方法 |

## フレームワーク固有の docs/

スキルの `docs/` ディレクトリには、フレームワーク・言語固有の内容を格納する。
AI はプロジェクトの技術スタックに応じて、必要な docs/ のみを読み込む。

```
skills/coding-standards/
├── SKILL.md                    ← 共通原則（全言語・全フレームワーク）
└── docs/
    ├── typescript.md           ← TypeScript 固有
    └── react-nextjs.md         ← React / Next.js 固有

skills/security-review/
├── SKILL.md                    ← OWASP Top 10:2025 共通チェック
└── docs/
    └── nextjs-security.md      ← Next.js 固有のセキュリティ
```

新しいフレームワークに対応する場合は、docs/ にファイルを追加し、SKILL.md の参照テーブルに1行加える。

## ライセンス

MIT License

本プロジェクトは [Superpowers](https://github.com/obra/superpowers)（Copyright (c) 2025 Jesse Vincent）をベースにしている。詳細は [LICENSE](LICENSE) を参照。
