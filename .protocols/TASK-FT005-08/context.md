---
description: Контекст выполнения TASK-FT005-08.
status: active
---
# TASK-FT005-08 Context

## Task
- TASK-ID: `TASK-FT005-08`
- Title: `Collect polling SLA evidence and final docs sync`
- Feature: `FT-005`
- REQs: `REQ-010`, `REQ-018`

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-005-order-tracking-and-events-polling.md`
- `.memory-bank/tasks/plans/IMPL-FT-005.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/contracts/telegram-bot-contract.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/events-polling-and-bot-runtime.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/adrs/ADR-002-events-polling-for-mvp.md`

## Loaded prior-task artifacts
- `.tasks/TASK-FT005-05/TASK-FT005-05-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-06/TASK-FT005-06-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT005-07/TASK-FT005-07-S-IMPL-final-report-code-01.md`
- `.protocols/TASK-FT005-05/handoff.md`
- `.protocols/TASK-FT005-06/handoff.md`
- `.protocols/TASK-FT005-07/verification.md`

## Normative inputs found
- `REQ-010` требует explicit polling SLA evidence с целью `p95 <= 10 секунд`.
- `FT-005` already has functional closure via repo-local integration/e2e evidence; this task owns only the final latency gate and docs sync.
- `GET /events?since=<cursor>` and UI polling must remain duplicate-safe and string-cursor based.
- Scope must stay inside `FT-005`; cancellation/refund semantics remain with `FT-006`.

## Scope focus
- Собрать repo-local SLA evidence bundle для current polling implementation.
- Re-run the final ordered-polling regression gates needed to keep `FT-005` closure coherent.
- Sync backlog, RTM, feature/index/changelog docs after evidence lands.
- Do not expand into `FT-006` cancellation/refund behavior.

## Code areas inspected
- `frontend/src/slices/order-tracking/hooks/use-order-tracking-view-model.ts`
- `frontend/src/tests/slices/order-tracking/order-tracking-route.spec.tsx`
- `backend/src/slices/delivery-tracking/**/*`
- `tests/slices/delivery-tracking/delivery-tracking.integration.spec.ts`
