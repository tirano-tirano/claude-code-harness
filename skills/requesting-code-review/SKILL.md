---
name: requesting-code-review
description: "Use when completing tasks, implementing major features, or before merging to verify work meets requirements. 日本語トリガー: レビュー依頼、レビューして、コードレビュー、確認してほしい、見てほしい"
---

# Requesting Code Review

サブエージェントにコードレビューを依頼する。レビュアーには `code-reviewer.md` テンプレートで必要なコンテキストだけを渡す。セッションの履歴は渡さない。これにより、レビュアーは成果物に集中でき、自分のコンテキストも消費しない。

**Core principle:** Review early, review often.

## When to Request Review

**Mandatory:**
- After each task in subagent-driven development
- After completing major feature
- Before merge to main

**Optional but valuable:**
- When stuck (fresh perspective)
- Before refactoring (baseline check)
- After fixing complex bug

## How to Request

**1. Get git SHAs:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # or origin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. コードレビュー用サブエージェントを起動:**

Agent ツールでサブエージェントを起動し、`code-reviewer.md` テンプレートの内容をプロンプトに含める

**Placeholders:**
- `{WHAT_WAS_IMPLEMENTED}` - What you just built
- `{PLAN_OR_REQUIREMENTS}` - What it should do
- `{BASE_SHA}` - Starting commit
- `{HEAD_SHA}` - Ending commit
- `{DESCRIPTION}` - Brief summary

**3. Act on feedback:**
- Fix Critical issues immediately（信頼度 90-100）
- Fix Important issues before proceeding（信頼度 80-89）
- NFR 違反は信頼度関係なく対処（security / performance 等）
- Push back if reviewer is wrong (with reasoning)

**信頼度スコアリングについて:**

`agents/code-reviewer.md` は信頼度 0-100 のスコアを各指摘に付け、
**信頼度 80 未満の指摘は出力しない**仕様になっている（feature-dev 流の
confidence-based filtering を harness に取り込んだもの）。

これにより、レビュー結果は「対応すべき指摘だけ」に絞られる。レビュー結果を
受け取ったら、まず以下を確認する：

- 「信頼度 80 以上の指摘なし」と返ってきた場合は、その判断を信頼してよい
  （ノイズの全件報告を要求し直してはいけない。レビューの仕事はノイズ除去まで）
- 報告された指摘は基本的にすべて対処する
  （対処しないと判断した場合は、その理由を明示してコミットメッセージか PR
  description に残す）
- NFR 違反（security.md, performance.md 等への違反）は、信頼度が 80 未満でも
  例外的に報告される。これは早期警告なので必ず確認する

## Example

```
[Just completed Task 2: Add verification function]

You: Let me request code review before proceeding.

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[Agent ツールでコードレビュー用サブエージェントを起動、code-reviewer.md テンプレート使用]
  WHAT_WAS_IMPLEMENTED: Verification and repair functions for conversation index
  PLAN_OR_REQUIREMENTS: F-001-T04 from docs/features/F-001_conversation-index.md
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: Added verifyIndex() and repairIndex() with 4 issue types

[Subagent returns]:
  Strengths: Clean architecture, real tests

  Critical 指摘（信頼度 90-100）:
    なし

  Important 指摘（信頼度 80-89）:
    1. 進捗インジケーターの欠落
       - 信頼度: 85
       - 場所: src/services/IndexVerifier.ts:34
       - 根拠: feature ファイル F-001 の要件 S03「ユーザーへの進捗表示」
       - 修正案: logger.info('progress', { current, total }) を 100 件ごとに出力

  NFR 違反（参考、信頼度 70）:
    1. パフォーマンス影響の可能性
       - NFR: docs/nfr/performance.md "1000件のインデックス検証は 5 秒以内"
       - 場所: src/services/IndexVerifier.ts:67
       - 問題: 直列処理のため 1000 件で 8 秒程度かかる可能性
       - 修正案: Promise.all による並列化を検討

  Assessment: Important 1件と NFR 1件の対応後、Ready to proceed

You: [Fix progress indicators]
[Continue to Task 3]
```

## Integration with Workflows

**Subagent-Driven Development:**
- Review after EACH task
- Catch issues before they compound
- Fix before moving to next task

**Executing Plans:**
- Review after each batch (3 tasks)
- Get feedback, apply, continue

**Ad-Hoc Development:**
- Review before merge
- Review when stuck

## Red Flags

**Never:**
- Skip review because "it's simple"
- Ignore Critical issues
- Proceed with unfixed Important issues
- Argue with valid technical feedback

**If reviewer wrong:**
- Push back with technical reasoning
- Show code/tests that prove it works
- Request clarification

See template at: requesting-code-review/code-reviewer.md
