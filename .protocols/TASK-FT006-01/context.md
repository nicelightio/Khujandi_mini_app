---
description: Контекст выполнения TASK-FT006-01.
status: active
---
# TASK-FT006-01 Context

## Task
- TASK-ID: `TASK-FT006-01`
- Title: `Freeze cancellation policy, refund-state semantics and verify boundary`
- Feature: `FT-006`
- REQs: `REQ-011`, `REQ-012`, `REQ-018`

## Loaded specs
- `AGENTS.md`
- `.memory-bank/mbb/index.md`
- `.memory-bank/spec-index.md`
- `.memory-bank/index.md`
- `.memory-bank/product.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/EP-002-delivery-operations.md`
- `.memory-bank/features/FT-006-operational-cancellation-and-manual-refund.md`
- `.memory-bank/tasks/plans/IMPL-FT-006.md`
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/contracts/api-events-baseline.md`
- `.memory-bank/states/order-lifecycle.md`
- `.memory-bank/runbooks/manual-refund-and-negative-alerts.md`
- `.memory-bank/invariants.md`
- `.memory-bank/architecture/data-boundaries-and-persistence.md`
- `.memory-bank/testing/index.md`

## Normative inputs found
- `REQ-011` ограничивает cancellation только ролями `admin` и `courier`, причем courier path разрешен только для unavailable-case.
- `REQ-012` требует явный manual refund tracking state и audit visibility.
- `REQ-018` требует единый error contract и audit semantics для cancellation/refund write flows.
- Existing state/runbook layer already defines cancellation statuses and refund fields, but refund-state semantics and final verify split needed tighter wording.

## Scope focus
- This task is docs-first only.
- Freeze allowed actors/states, explicit `refund_status` semantics, `refund_note` expectations, and verify routing for later `FT-006` runtime tasks.
- Update Memory Bank and backlog statuses without changing runtime implementation or RTM lifecycle rows.

## Code areas inspected
- None. Task scope was satisfied by spec-layer updates only; runtime code inspection was not required.
