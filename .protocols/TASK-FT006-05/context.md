# TASK-FT006-05 Context

## Task
- `TASK-FT006-05`
- Scope: implement only backend manual refund tracking progression and refund note persistence inside the owning `order-cancellation` slice, keeping paid cancellations explicitly visible and avoiding any automated provider refund side effects.

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-05` card)
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.tasks/TASK-FT006-01/TASK-FT006-01-S-IMPL-final-report-docs-01.md`
- `.tasks/TASK-FT006-02/TASK-FT006-02-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT006-04/TASK-FT006-04-S-IMPL-final-report-code-01.md`

## Normative inputs found
- Paid cancellation must immediately persist `refund_status = PENDING_MANUAL`.
- Manual refund progression may only move the cancelled paid order to `DONE` or `REJECTED` and must persist `refund_note` as operator context/outcome.
- Refund metadata updates must not reopen the terminal cancelled order lifecycle.
- Refund actions remain manual and auditable; no automatic provider refund side effects are allowed.

## Existing code patterns inspected
- `backend/src/slices/order-cancellation/**/*`
- `tests/slices/order-cancellation/**/*`
- `frontend/src/admin/**/*` only as scope confirmation for later dependent UX work

## Scope notes
- No richer task-specific contract beyond the backlog card and current `FT-006` docs was found; implementation should stay minimal and backend-slice-local.
- Frontend wiring and final feature closure remain with `TASK-FT006-06`..`TASK-FT006-08`.
