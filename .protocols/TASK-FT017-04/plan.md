---
description: План выполнения TASK-FT017-04 final verification and Memory Bank sync.
status: active
---
# TASK-FT017-04 Plan

## Steps

1. Re-read required FT-017 specs, previous verification notes and scoped run status.
2. Run final mandatory gates:
   - `npx jest --config jest.config.cjs tests/slices/checkout-payment --runInBand`
   - `npx jest --config jest.config.cjs frontend/src/tests/slices/checkout-payment --runInBand`
   - `npm run build:frontend`
   - `git diff --check`
3. Run `npm run lint` if practical and record result or unrelated failure clearly.
4. If gates pass, sync minimal Memory Bank closure:
   - `FT-017` current implementation/verification closure.
   - `e2e-mock-payment` runbook only if final evidence needs a closure note.
   - `testing/index` only if closure anchor needs update.
   - `requirements` RTM lifecycle for `REQ-023` / `FT-017` if justified.
   - `tasks/backlog` status and verify outcome.
   - Memory Bank index recent update.
   - `AUTONOMOUS-RUN` terminal state.
5. Write `.protocols/TASK-FT017-04/{progress,verification}.md` and `.tasks/TASK-FT017-04/TASK-FT017-04-S-VERIFY-final-report-docs-01.md`.

## Non-Goals

- No production provider design.
- No failed/timeout/pending mock outcomes.
- No delivery lifecycle implementation.
- No shared abstraction.
- No unrelated cleanup of the existing dirty worktree.
