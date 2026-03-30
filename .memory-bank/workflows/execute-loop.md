---
description: Workflow: PRD → FT → TASK loop (interactive or autonomous).
status: active
---
# Execute loop (PRD → Feature → Tasks)

## Principle: no task explosion
- `/prd` creates L1–L3 only (product/requirements/epics/features/testing/index).
- Tasks are created **per feature** via `/prd-to-tasks FT-<NNN>`.

## Interactive mode (you stay)
1) `/prd` (fills L1–L3; records open questions)
2) Pick one top feature: `FT-<NNN>`
3) `/prd-to-tasks FT-<NNN>` (creates IMPL plan + TASK-* for this feature)
4) Execute tasks from `.memory-bank/tasks/backlog.md` one-by-one:
   - `/execute TASK-<ID>` → `/verify` → `/mb-sync`
5) After each wave: `/review` (or `mb-review` fresh context)

## Autonomous end-to-end mode (start and leave)
1) `/autonomous`
2) command builds L1–L3, runs review gate, decomposes all FT, and then schedules ready TASKs
3) each TASK runs in **fresh CLI sessions**
4) after each wave: `/review`
5) final success only if last review = `APPROVE` and no blocking tasks remain

## Autonomous executor only
If backlog already exists and review gate already passed, use:
- `/autopilot`

Codex (implement then verify):
~~~bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md + acceptance criteria. Keep context.md updated. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL.'
~~~

Claude (implement then verify):
~~~bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md + acceptance criteria. Keep context.md updated. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
~~~

## Parallel vs sequential
- Independent tasks (no shared files) MAY run in parallel (separate sessions).
- Dependent or shared-file tasks MUST run sequentially: TASK-A (impl→verify→mb-sync) → TASK-B.
