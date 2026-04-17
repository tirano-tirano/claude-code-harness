# ドキュメント体系の整理

日時: 2026-04-17
状態: 決定済み

## 背景

claude-code-harness プラグインで生成されるドキュメントが7種類以上あり、フォルダがバラバラに分かれていた。AIが実装時に迷わない構成にしつつ、周辺的な記録を効率よく整理したい。AIコーディング時代に最適なドキュメントのあり方を探る。

## 決まったこと

### ドキュメントの分類基準

「AIが実装中に開くファイルか？」で2つに分ける。

- 性質A（実装時に参照する）→ 独立ファイルとして管理
- 性質B（後で振り返る記録）→ docs/notes/ に集約

### 新しいドキュメント体系

```
docs/
├── architecture.md            ... 全体設計（DB一覧、API一覧、共通方針）
├── features/
│   ├── user-registration.md   ... 1機能 = 1ファイル
│   ├── payment.md
│   └── notification.md
├── progress.md                ... 全機能の進捗一覧（自動生成）
└── notes/                     ... 記録系（ブレスト、ADR、日誌等）
    └── {日付}_{種類}_{テーマ}.md
```

### 各ファイルの役割

- **architecture.md**: プロジェクト全体の設計。DB全体のテーブル一覧・ER図、API全エンドポイント一覧、共通ルール（認証方式、レスポンス形式、エラーコード体系）。新機能を設計するとき・横断的に確認したいときに読む
- **features/{機能名}.md**: 1機能に関する全情報を1ファイルにまとめる。要求、要件、技術仕様（API/DB/UI）、タスクリスト＋進捗チェックボックス。AIはこのファイルだけ読めば実装に入れる
- **progress.md**: 全 features/ ファイルのタスクチェックボックスを集約した進捗一覧。自動生成
- **notes/**: 時系列の記録。命名規則「{日付}_{種類}_{テーマ}.md」。種類は brainstorm, adr, journal, security

### feature ファイルの構成

```markdown
---
feature: 機能名
---

## 要求
（何がしたいか）

## 要件
（何を満たすべきか。要求を分解したもの）

## 技術仕様

### API
（エンドポイント、リクエスト/レスポンス）

### DB
（テーブル構造）

### UI
（画面設計）

## タスク
- [ ] Task 1: ...
- [ ] Task 2: ...
進捗: 0/N 完了
```

### architecture.md と feature ファイルの役割分担

- architecture.md: 一覧と共通ルール（横断的な情報）
- feature ファイル: 個別の詳細（機能固有の情報）
- 同じ情報の重複を最小限にする

### 要求と要件の関係

要求（1つ）→ 要件（複数）に分解される。1ファイル内でセクションとして区別する。

### 進捗管理

- feature ファイルのタスクセクションのチェックボックスが進捗の情報源
- progress.md は features/ から自動生成される集約ビュー

### 旧体系からの移行

| 旧 | 新 |
|---|---|
| docs/prd/ | features/{機能名}.md の要求・要件セクション |
| docs/api/ | features/{機能名}.md の技術仕様 + architecture.md |
| docs/db/ | features/{機能名}.md の技術仕様 + architecture.md |
| docs/ui/ | features/{機能名}.md の技術仕様 |
| docs/test-plans/ | features/{機能名}.md の要件テスト表 |
| docs/adr/ | notes/{日付}_adr_{タイトル}.md |
| docs/journal/ | notes/{日付}_journal.md |
| docs/security-findings.md | notes/{日付}_security_{テーマ}.md |
| docs/superpowers/plans/ | features/{機能名}.md のタスクセクション |

### 影響を受けるスキル（12スキル）

修正順序:
1. document-lifecycle（基盤）
2. development-cycle（開発フロー）
3. brainstorming-with-docs（設計フェーズ）
4. writing-plans（実装計画）
5. ui-design, security-review, claude-md-generator, web-testing, project-structure, git-conventions, remote-repository
6. using-superpowers（全体整合の確認）

## 次にやること

- 上記の順番でスキルを書き換える
- architecture.md のテンプレートを作成する
- feature ファイルのテンプレートを作成する
- progress.md の生成ルールを決める
