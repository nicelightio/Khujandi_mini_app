---
description: Execution context for TASK-FT006-07.
status: done
---
# TASK-FT006-07 Context

## Task
- Task ID: `TASK-FT006-07`
- Goal: add the final repo-local cancellation/refund verification suite for `FT-006` without changing the owning runtime behavior outside existing tests/docs scope.

## Loaded inputs
- `AGENTS.md`
- `.memory-bank/commands/execute.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-07` card)
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.tasks/TASK-FT006-04/TASK-FT006-04-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT006-05/TASK-FT006-05-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT006-06/TASK-FT006-06-S-IMPL-final-report-code-01.md`

## Richer inputs / task-card guidance
- Backlog card scope is limited to `tests/slices/order-cancellation/**/*`, `frontend/src/tests/admin/**/*`, task artifacts, and `FT-006` docs sync.
- Verification target requires end-to-end evidence for allowed-role cancellation, client prohibition, cancellation actor/reason persistence, refund tracking visibility, and audit/event generation.
- Quality gates required by the task card: `lint`, `typecheck`, `unit`, `integration`, `e2e smoke`.

## Fallbacks and assumptions
- No richer implementation-specific verify doc was found beyond the backlog card plus `FT-006`, `order-lifecycle`, `manual-refund-and-negative-alerts`, `api-events-baseline`, and `testing/index.md`.
- Existing backend integration tests already cover most command behavior; this task should extend them into clearer verification evidence rather than reworking production code unless a gap is found.
- Existing admin route smoke tests are treated as the repo-local e2e-smoke baseline for the operator-visible refund-state flow.

## Out of scope
- Backend business-rule changes unless tests expose a genuine spec drift.
- Admin auth/session implementation.
- Final refund runbook closure and RTM sync owned by `TASK-FT006-08`.
