---
description: Execution context for TASK-FT006-06.
status: done
---
# TASK-FT006-06 Context

## Task
- Task ID: `TASK-FT006-06`
- Goal: wire admin-web cancellation and manual refund tracking UX to the existing `FT-006` backend flow without expanding auth/session ownership.

## Loaded inputs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/tasks/backlog.md` (`TASK-FT006-06` card)
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/invariants.md`
- `.tasks/TASK-FT006-03/TASK-FT006-03-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT006-04/TASK-FT006-04-S-IMPL-final-report-code-01.md`
- `.tasks/TASK-FT006-05/TASK-FT006-05-S-IMPL-final-report-code-01.md`

## Richer inputs / task-card guidance
- Backlog card defines scope: `frontend/src/admin/**/*`, `frontend/src/shared/ui/**/*`, `frontend/src/tests/admin/**/*`.
- Required verification: UI/integration smoke for allowed cancellation, forbidden cancellation messaging, refund-state rendering, and manual refund note/status updates.
- Normative behavior comes from `FT-006`, `order-lifecycle`, `manual-refund-and-negative-alerts`, `api-events-baseline`, `testing/index.md`.

## Implementation assumptions
- Existing backend slice exposes cancellation and refund-update command behavior, but no richer normative HTTP doc was found for frontend paths.
- To stay aligned with `FT-004` admin wiring, frontend will use a minimal API client with explicit error-contract parsing and command-response handling.
- The route will keep fixture/bootstrap ownership optional so tests and non-runtime scaffolds remain possible without pulling `FT-007` auth/session scope into this task.

## Out of scope
- Backend business-rule changes.
- Admin auth/session implementation.
- Final feature verification closure (`TASK-FT006-07`) and refund evidence sync (`TASK-FT006-08`).
