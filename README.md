# claude-code-harness

Claude Code 向けのスキルベース開発ワークフロー。
コーディングエージェントに「設計 → 実装 → テスト → レビュー → セキュリティチェック」の一貫したプロセスを提供する。

## 経緯

このプロジェクトは [Superpowers](https://github.com/obra/superpowers)（MIT License, Copyright (c) 2025 Jesse Vincent）をベースにしている。

Superpowers は Claude Code プラグインとして、設計・計画・実装・テスト・デバッグを一貫して行うスキルセットを提供するプロジェクト。本リポジトリでは、Superpowers の設計思想を引き継ぎつつ、以下のカスタマイズを加えている。

### 主な変更点

- **日本語対応**: 全スキルに日本語トリガーキーワードを追加
- **スキルの追加**: 以下のスキルを新規作成
  - `coding-standards` — コーディング規約と品質ツール設定
  - `security-review` — OWASP Top 10:2025 準拠のセキュリティチェック
  - `git-conventions` — コミットメッセージ・ブランチ命名規約
  - `remote-repository` — PR / Issue / CI/CD の運用ルール
  - `project-setup` — 開発環境の構築フロー
  - `document-lifecycle` — ドキュメント管理
- **フレームワーク非依存設計**: スキル本体（SKILL.md）を汎用的に保ち、フレームワーク固有の内容は `docs/` に分離
  - `coding-standards/docs/typescript.md` — TypeScript 固有の規約
  - `coding-standards/docs/react-nextjs.md` — React / Next.js 固有の規約
  - `security-review/docs/nextjs-security.md` — Next.js 固有のセキュリティチェック
- **スキル間の連携強化**: development-cycle を中心に、各スキルの参照関係を整理

## スキル一覧

### 設計・計画系

| スキル | 概要 |
|---|---|
| `brainstorming-with-docs` | ソクラテス式の対話で設計を詰める |
| `writing-plans` | 実装計画をタスク単位に分解 |
| `executing-plans` | 計画をバッチ実行（チェックポイント付き） |

### 実装系

| スキル | 概要 |
|---|---|
| `development-cycle` | 設計→実装→検証の全体フロー |
| `subagent-driven-development` | サブエージェントによる並列実装 |
| `dispatching-parallel-agents` | 並行タスクの管理 |
| `coding-standards` | コーディング規約と品質ツール |
| `project-structure` | ディレクトリ構成の設計 |
| `ui-design` | UI コンポーネントの設計 |

### テスト・品質系

| スキル | 概要 |
|---|---|
| `web-testing` | テスト戦略（単体・統合・E2E） |
| `verification-before-completion` | 完了前の検証 |
| `security-review` | OWASP Top 10:2025 セキュリティチェック |

### デバッグ系

| スキル | 概要 |
|---|---|
| `systematic-debugging` | 4フェーズの根本原因分析 |

### Git・ワークフロー系

| スキル | 概要 |
|---|---|
| `git-conventions` | コミット・ブランチの命名規約 |
| `remote-repository` | PR / Issue / CI/CD |
| `using-git-worktrees` | Git worktree による並列開発 |
| `finishing-a-development-branch` | ブランチのマージ・クリーンアップ |

### レビュー・ドキュメント系

| スキル | 概要 |
|---|---|
| `requesting-code-review` | コードレビュー依頼 |
| `receiving-code-review` | レビューフィードバックへの対応 |
| `document-lifecycle` | ドキュメント管理 |
| `claude-md-generator` | CLAUDE.md の生成・更新 |

### 環境・セットアップ系

| スキル | 概要 |
|---|---|
| `project-setup` | 開発環境の構築 |

### メタ系

| スキル | 概要 |
|---|---|
| `using-superpowers` | スキルシステムの案内 |
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
