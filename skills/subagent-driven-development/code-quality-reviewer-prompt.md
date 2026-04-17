# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
サブエージェントに requesting-code-review/code-reviewer.md のテンプレートを渡す:

  WHAT_WAS_IMPLEMENTED: [実装者の報告から]
  PLAN_OR_REQUIREMENTS: F-xxx-Txx のタスク内容（feature ファイルから抽出）
  BASE_SHA: [タスク開始前のコミット]
  HEAD_SHA: [現在のコミット]
  DESCRIPTION: [タスクの概要]
```

**In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the plan?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
