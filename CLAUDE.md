# claude-code-harness — 開発ガイドライン

このリポジトリは [obra/superpowers](https://github.com/obra/superpowers)（MIT License, Copyright (c) 2025 Jesse Vincent）からのフォークで、**個人開発として運用しているプラグイン**である。本家への PR 提出は前提にしない。

## 設計思想（変更しないこと）

このプラグインの中核となる考え方。スキルや構造を変更するときは、これらと矛盾しないかを必ず確認する。

1. **ドキュメント駆動開発**: `docs/features/F-xxx_*.md` を真実の源とする。コードを書く前にドキュメントを書く。「ドキュメントは後で書く」は禁止。
2. **外側→内側のテスト駆動**: 受け入れテスト → 統合テスト → 単体テスト → 実装の順でタスクを並べる。ゴールを先に定義してから実装する。
3. **Ralph Loop 連携**: feature ファイルを Ralph Loop の TODO.md として直接使用できるようにする。タスク行（`- [ ] F-xxx-Txx`）の形式は崩さない。
4. **日本語ファースト**: 説明・トリガー語・出力は日本語を基本とする。英語のままの上流コンテンツは harness 流に翻案してから取り込む。
5. **フレームワーク非依存**: スキル本体（SKILL.md）は汎用的に保ち、フレームワーク固有の内容は `docs/` サブディレクトリに分離する。

## スキル変更時のルール

このリポジトリ自体に対して変更を加えるときの段取り。

### agents/ の変更

- 単体で動作確認すれば OK（コミット前に1セッションで挙動を確認）
- 影響範囲が局所的なので比較的気軽に試せる
- 信頼度スコア・出力フォーマット等の変更は agent ファイル内で完結させる
- **新規エージェント追加時は同コミット内で `skills/using-superpowers/SKILL.md` の "Available Agents" セクションも更新する**（一覧に無いとメイン Claude が認識しない）

### skills/SKILL.md の変更

- スキルは「コードのようにエージェントの挙動を形成する文書」である。文章の修正でも挙動が変わる
- 既存スキルへの追記: 1セッションで挙動確認してからコミット
- 新規スキル追加: 2-3セッションで実際に呼び出されるか・期待通り動くかを確認
- Red Flags テーブル・Rationalization List 等の挙動制御の核となる文言を変えるときは、変更前後の挙動比較を `docs/notes/` に記録する
- **新規スキル追加時は同コミット内で `skills/using-superpowers/SKILL.md` の "Available Skills" 一覧表と「スキル選択の典型パターン」表も更新する**（session-start hook がこのファイルを読む。一覧に無いスキルは事実上未デプロイ）
- 詳細な手順とチェックリストは `skills/writing-skills/SKILL.md` の「★ harness 固有の必須運用ルール」セクションを参照

### 設計思想に関わる変更

- 上記5項目（ドキュメント駆動、外側→内側 TDD、Ralph Loop 連携、日本語ファースト、フレームワーク非依存）に影響する変更は、**実施前**に `docs/notes/{日時}_adr-{番号}_{タイトル}.md` で ADR を残す
- 「やってから記録」ではなく「記録してから実施」の順序

### コミットの粒度

- 1コミット1テーマ（CLAUDE.md 修正と新スキル追加は別コミット）
- 上流遺物の削除と harness 独自機能の追加は別コミット
- メッセージは Conventional Commits 形式（`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`）

## 上流（obra/superpowers）との関係

- **追従しない**: フォルダ構造・スキル粒度・命名規則は harness 独自に最適化する
- **取り込みたい変更がある場合**: git remote として `upstream` を追加し、cherry-pick で必要なものだけ取り込む。マージはしない
- **harness 独自スキル**: `document-lifecycle`, `development-cycle`, `learning-guide`, `project-migration`, `brainstorming-with-docs`, `coding-standards`（一部）, `web-testing`（一部）, `ui-design`（一部）等は harness で書き起こした・大幅改変したもの。上流の同名ファイルで上書きしないこと

## 上流の遺物に注意

このリポジトリには上流由来のファイル・記述が残っていることがある。発見したら：

- 単純に不要なもの（古い計画ドキュメント等）→ 削除
- 内容を harness 流に書き換えれば使えるもの → 書き換える
- 用途が不明なもの → `docs/notes/` に「TODO: 上流遺物の調査」として記録してから判断

## ファイル構成

```
.
├── .claude-plugin/plugin.json    プラグインメタデータ
├── README.md                     ユーザー向け説明
├── CLAUDE.md                     このファイル（開発者向けガイド）
├── agents/                       特化エージェント定義（code-explorer, code-architect, code-reviewer）
├── commands/                     スラッシュコマンド定義
├── hooks/                        セッションフック
├── skills/                       スキル本体（28 個）
├── docs/
│   └── notes/                    開発メモ・ADR・ふりかえり
└── scripts/                      バージョン管理等のメンテナンススクリプト
```

## Pull Request について

このリポジトリへの PR は本家のものとは無関係。フォーク内でのレビューが必要なら通常通り PR を立てるが、本家リポジトリへの逆流（pushup）はしない。

`/Users/johnsmith/.claude/CLAUDE.md`（グローバル）の方針：
- 言語: 日本語
- 説明: 前提知識から、なぜそうするのかを含める
- 学習中の技術: JavaScript（初級）、Python（初心者）、Git（初級）

これに従い、harness のドキュメント・スキル出力も「学習者にとって追いやすい説明」を意識する。
