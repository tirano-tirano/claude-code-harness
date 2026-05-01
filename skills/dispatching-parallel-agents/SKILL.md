---
name: dispatching-parallel-agents
description: "Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies. 日本語トリガー: 並列、同時に、並行して、サブエージェント、分担、まとめてやって"
---

# Dispatching Parallel Agents

## Overview

You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

When you have multiple unrelated failures (different test files, different subsystems, different bugs), investigating them sequentially wastes time. Each investigation is independent and can happen in parallel.

**Core principle:** Dispatch one agent per independent problem domain. Let them work concurrently.

## When to Use

```dot
digraph when_to_use {
    "Multiple failures?" [shape=diamond];
    "Are they independent?" [shape=diamond];
    "Single agent investigates all" [shape=box];
    "One agent per problem domain" [shape=box];
    "Can they work in parallel?" [shape=diamond];
    "Sequential agents" [shape=box];
    "Parallel dispatch" [shape=box];

    "Multiple failures?" -> "Are they independent?" [label="yes"];
    "Are they independent?" -> "Single agent investigates all" [label="no - related"];
    "Are they independent?" -> "Can they work in parallel?" [label="yes"];
    "Can they work in parallel?" -> "Parallel dispatch" [label="yes"];
    "Can they work in parallel?" -> "Sequential agents" [label="no - shared state"];
}
```

**Use when:**
- 3+ test files failing with different root causes
- Multiple subsystems broken independently
- Each problem can be understood without context from others
- No shared state between investigations

**Don't use when:**
- Failures are related (fix one might fix others)
- Need to understand full system state
- Agents would interfere with each other

## The Pattern

### 1. Identify Independent Domains

Group failures by what's broken:
- File A tests: Tool approval flow
- File B tests: Batch completion behavior
- File C tests: Abort functionality

Each domain is independent - fixing tool approval doesn't affect abort tests.

### 2. Create Focused Agent Tasks

Each agent gets:
- **Specific scope:** One test file or subsystem
- **Clear goal:** Make these tests pass
- **Constraints:** Don't change other code
- **Expected output:** Summary of what you found and fixed

### 3. Dispatch in Parallel

```typescript
// In Claude Code / AI environment
Task("Fix agent-tool-abort.test.ts failures")
Task("Fix batch-completion-behavior.test.ts failures")
Task("Fix tool-approval-race-conditions.test.ts failures")
// All three run concurrently
```

### 4. Review and Integrate

When agents return:
- Read each summary
- **Read the files agents identified as important** (see next section)
- Verify fixes don't conflict
- Run full test suite
- Integrate all changes

## エージェント結果の必読ルール（Required: Read Files Agents Return）

並列エージェントには必ず「最重要ファイル 5-10 個のリスト」を返させること。
メイン Claude は、受け取ったファイルを Read してから次のステップに進む。

### なぜか

エージェントの要約だけで判断を進めると、伝言ゲームになる。要約は情報を
圧縮するため、コーディング規約・局所的な慣習・暗黙の依存関係が抜け落ちる
ことが多い。特に既存コードベースへの実装では、メイン Claude が直接コードを
読んでいないと「動くが規約違反」「動くが既存パターンを破壊」という結果に
なりやすい。

feature-dev プラグイン（Anthropic 公式）では Phase 2 のコードベース調査で
この原則を明示的に強調している。harness にも同じ原則を適用する。

### エージェントへの指示テンプレート

タスク本体の最後に、以下を必ず含める：

```
## 必須出力
1. 調査結果のサマリ（どこに何があるか）
2. 必読ファイルリスト: メイン Claude が次のステップで読むべき重要ファイルを
   5-10 個、以下の形式で返すこと
   - {ファイルパス}:{行範囲} ← {なぜ重要か}

   例:
   - src/auth/AuthService.ts:45-120 ← 認証フローの中核
   - src/middleware/authMiddleware.ts:12-40 ← リクエスト認証
   - src/config/security.ts:8-25 ← セキュリティ設定
```

### Red Flag — 以下の思考が浮かんだら立ち止まる

| 思考 | 正しい対応 |
|---|---|
| 「エージェントが要約してくれたから読まなくていい」 | 必ず読む。要約だけで判断しない |
| 「ファイルリストを読むのは時間の無駄」 | 短く読み流すだけでも実装品質が大きく変わる |
| 「複数エージェントが返したファイルが重複している。片方だけ読む」 | 重複は重要度のシグナル。両方読む |
| 「タスクが急ぎだから読む時間がない」 | 急ぎほど誤りのコストが大きい。読んでから進める |
| 「ファイルが多すぎる。上位 2-3 個でいい」 | 5 個未満ならエージェントへの指示が広すぎる。指示を絞り直す |

### 読まないことのコスト（よくある失敗）

- 既存コードに同じヘルパー関数があるのに、新規に同名関数を作って二重実装になった
- 既存のエラーハンドリングパターンを無視して、独自のパターンで実装した
- DB スキーマの暗黙の制約（カスケード削除等）を見落として、データ不整合が発生した
- feature ファイルの「関連 NFR」セクションに記載された制約を実装で違反した

これらはすべて「エージェントの要約は読んだがファイルは読まなかった」ケースで
起きやすい。

## Agent Prompt Structure

Good agent prompts are:
1. **Focused** - One clear problem domain
2. **Self-contained** - All context needed to understand the problem
3. **Specific about output** - What should the agent return?

```markdown
Fix the 3 failing tests in src/agents/agent-tool-abort.test.ts:

1. "should abort tool with partial output capture" - expects 'interrupted at' in message
2. "should handle mixed completed and aborted tools" - fast tool aborted instead of completed
3. "should properly track pendingToolCount" - expects 3 results but gets 0

These are timing/race condition issues. Your task:

1. Read the test file and understand what each test verifies
2. Identify root cause - timing issues or actual bugs?
3. Fix by:
   - Replacing arbitrary timeouts with event-based waiting
   - Fixing bugs in abort implementation if found
   - Adjusting test expectations if testing changed behavior

Do NOT just increase timeouts - find the real issue.

Return: Summary of what you found and what you fixed.
```

## Common Mistakes

**❌ Too broad:** "Fix all the tests" - agent gets lost
**✅ Specific:** "Fix agent-tool-abort.test.ts" - focused scope

**❌ No context:** "Fix the race condition" - agent doesn't know where
**✅ Context:** Paste the error messages and test names

**❌ No constraints:** Agent might refactor everything
**✅ Constraints:** "Do NOT change production code" or "Fix tests only"

**❌ Vague output:** "Fix it" - you don't know what changed
**✅ Specific:** "Return summary of root cause and changes"

## When NOT to Use

**Related failures:** Fixing one might fix others - investigate together first
**Need full context:** Understanding requires seeing entire system
**Exploratory debugging:** You don't know what's broken yet
**Shared state:** Agents would interfere (editing same files, using same resources)

## Real Example from Session

**Scenario:** 6 test failures across 3 files after major refactoring

**Failures:**
- agent-tool-abort.test.ts: 3 failures (timing issues)
- batch-completion-behavior.test.ts: 2 failures (tools not executing)
- tool-approval-race-conditions.test.ts: 1 failure (execution count = 0)

**Decision:** Independent domains - abort logic separate from batch completion separate from race conditions

**Dispatch:**
```
Agent 1 → Fix agent-tool-abort.test.ts
Agent 2 → Fix batch-completion-behavior.test.ts
Agent 3 → Fix tool-approval-race-conditions.test.ts
```

**Results:**
- Agent 1: Replaced timeouts with event-based waiting
- Agent 2: Fixed event structure bug (threadId in wrong place)
- Agent 3: Added wait for async tool execution to complete

**Integration:** All fixes independent, no conflicts, full suite green

**Time saved:** 3 problems solved in parallel vs sequentially

## Key Benefits

1. **Parallelization** - Multiple investigations happen simultaneously
2. **Focus** - Each agent has narrow scope, less context to track
3. **Independence** - Agents don't interfere with each other
4. **Speed** - 3 problems solved in time of 1

## Verification

After agents return:
1. **Review each summary** - Understand what changed
2. **Check for conflicts** - Did agents edit same code?
3. **Run full suite** - Verify all fixes work together
4. **Spot check** - Agents can make systematic errors

## Real-World Impact

From debugging session (2025-10-03):
- 6 failures across 3 files
- 3 agents dispatched in parallel
- All investigations completed concurrently
- All fixes integrated successfully
- Zero conflicts between agent changes
